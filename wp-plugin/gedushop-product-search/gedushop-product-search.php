<?php
/**
 * Plugin Name: GeduShop Product Search
 * Description: Weighted multilingual product search for the headless storefront, with aliases, synonyms, typo tolerance, filters and relevance ranking.
 * Version:     1.2.0
 * Author:      GeduShop
 * Requires PHP: 7.4
 * Requires Plugins: woocommerce
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/search-algorithm.php';
require_once __DIR__ . '/includes/migration-data.php';

const GEDU_SEARCH_ALIASES_META    = '_gedushop_search_aliases';
const GEDU_SEARCH_SYNONYMS_OPTION = 'gedushop_search_synonyms';
const GEDU_SEARCH_INDEX_TRANSIENT = 'gedushop_product_search_index_v2';
const GEDU_SEARCH_BACKUP_OPTION   = 'gedushop_search_migration_backup';

function gedu_search_default_synonyms() {
	return gedu_search_recommended_synonyms();
}

register_activation_hook(
	__FILE__,
	function () {
		if ( false === get_option( GEDU_SEARCH_SYNONYMS_OPTION, false ) ) {
			add_option( GEDU_SEARCH_SYNONYMS_OPTION, gedu_search_default_synonyms(), '', false );
		}
		delete_transient( GEDU_SEARCH_INDEX_TRANSIENT );
	}
);

function gedu_search_clear_index() {
	delete_transient( GEDU_SEARCH_INDEX_TRANSIENT );
}

add_action( 'save_post_product', 'gedu_search_clear_index' );
add_action( 'deleted_post', 'gedu_search_clear_index' );
add_action( 'woocommerce_update_product', 'gedu_search_clear_index' );

function gedu_search_clear_index_for_term( $term_id, $tt_id, $taxonomy ) {
	if ( in_array( $taxonomy, array( 'product_cat', 'product_tag', 'product_brand' ), true ) || 0 === strpos( $taxonomy, 'pa_' ) ) {
		gedu_search_clear_index();
	}
}

add_action( 'created_term', 'gedu_search_clear_index_for_term', 10, 3 );
add_action( 'edited_term', 'gedu_search_clear_index_for_term', 10, 3 );
add_action( 'delete_term', 'gedu_search_clear_index_for_term', 10, 3 );

add_action(
	'init',
	function () {
		register_post_meta(
			'product',
			GEDU_SEARCH_ALIASES_META,
			array(
				'type'              => 'string',
				'single'            => true,
				'show_in_rest'      => true,
				'sanitize_callback' => 'sanitize_textarea_field',
				'auth_callback'     => function () {
					return current_user_can( 'manage_woocommerce' );
				},
			)
		);
	}
);

add_action(
	'woocommerce_product_options_general_product_data',
	function () {
		global $post;
		woocommerce_wp_textarea_input(
			array(
				'id'          => GEDU_SEARCH_ALIASES_META,
				'label'       => 'Search aliases',
				'value'       => $post ? get_post_meta( $post->ID, GEDU_SEARCH_ALIASES_META, true ) : '',
				'description' => 'Optional comma-separated customer terms not already present in the title, categories or description. English, Bangla and Banglish are supported.',
				'desc_tip'    => true,
			)
		);
	}
);

add_action(
	'woocommerce_admin_process_product_object',
	function ( $product ) {
		$value = isset( $_POST[ GEDU_SEARCH_ALIASES_META ] )
			? sanitize_textarea_field( wp_unslash( $_POST[ GEDU_SEARCH_ALIASES_META ] ) )
			: '';
		$product->update_meta_data( GEDU_SEARCH_ALIASES_META, $value );
		gedu_search_clear_index();
	}
);

function gedu_search_term_text( $product_id, $taxonomy ) {
	$terms = wp_get_post_terms( $product_id, $taxonomy, array( 'fields' => 'all' ) );
	if ( is_wp_error( $terms ) ) {
		return array( 'ids' => array(), 'text' => '' );
	}
	$names = array();
	$ids   = array();
	foreach ( $terms as $term ) {
		$ids[]   = (int) $term->term_id;
		$names[] = $term->name;
		$names[] = $term->slug;
	}
	return array( 'ids' => $ids, 'text' => implode( ' ', $names ) );
}

function gedu_search_attribute_text( $product ) {
	$values = array();
	foreach ( $product->get_attributes() as $attribute ) {
		$values[] = $attribute->get_name();
		if ( $attribute->is_taxonomy() ) {
			$terms = wc_get_product_terms( $product->get_id(), $attribute->get_name(), array( 'fields' => 'all' ) );
			foreach ( $terms as $term ) {
				$values[] = $term->name;
				$values[] = $term->slug;
			}
		} else {
			$values = array_merge( $values, $attribute->get_options() );
		}
	}
	return implode( ' ', $values );
}

/** Normalized age options declared on a product (never guessed from copy). */
function gedu_search_age_options( $product ) {
	$options = array();
	foreach ( $product->get_attributes() as $attribute ) {
		$name = gedu_search_normalize( $attribute->get_name() );
		if (
			false === strpos( $name, 'age' ) &&
			false === strpos( $name, 'recommended age' ) &&
			false === strpos( $name, 'বয়স' ) &&
			false === strpos( $name, 'বয়স' )
		) {
			continue;
		}

		$labels = array();
		if ( $attribute->is_taxonomy() ) {
			$labels = wp_list_pluck( wc_get_product_terms( $product->get_id(), $attribute->get_name(), array( 'fields' => 'all' ) ), 'name' );
		} else {
			$labels = $attribute->get_options();
		}
		foreach ( $labels as $label ) {
			$label = trim( wp_strip_all_tags( (string) $label ) );
			$key   = sanitize_title( $label );
			if ( '' !== $key && '' !== $label ) {
				$options[ $key ] = $label;
			}
		}
	}
	return $options;
}

/** Build a compact, normalized index from the current WooCommerce catalogue. */
function gedu_search_get_index() {
	$cached = get_transient( GEDU_SEARCH_INDEX_TRANSIENT );
	if ( is_array( $cached ) ) {
		return $cached;
	}

	$ids = get_posts(
		array(
			'post_type'              => 'product',
			'post_status'            => 'publish',
			'posts_per_page'         => -1,
			'fields'                 => 'ids',
			'orderby'                => 'ID',
			'order'                  => 'ASC',
			'no_found_rows'          => true,
			'update_post_meta_cache' => true,
			'update_post_term_cache' => true,
		)
	);

	$index  = array();
	$factor = 10 ** wc_get_price_decimals();
	foreach ( $ids as $id ) {
		$product = wc_get_product( $id );
		if ( ! $product || ! in_array( $product->get_catalog_visibility(), array( 'visible', 'search' ), true ) ) {
			continue;
		}

		$post       = get_post( $id );
		$protected  = $post && '' !== (string) $post->post_password;
		$categories = gedu_search_term_text( $id, 'product_cat' );
		$tags       = gedu_search_term_text( $id, 'product_tag' );
		$brand_text = '';
		if ( taxonomy_exists( 'product_brand' ) ) {
			$brand_text = gedu_search_term_text( $id, 'product_brand' )['text'];
		}

		$min_price = $product->is_type( 'variable' ) ? $product->get_variation_price( 'min', true ) : $product->get_price();
		$max_price = $product->is_type( 'variable' ) ? $product->get_variation_price( 'max', true ) : $product->get_price();
		$created   = $product->get_date_created();
		$regular_price = $product->is_type( 'variable' ) ? $product->get_variation_regular_price( 'min', true ) : $product->get_regular_price();
		$current_price = (float) $min_price;
		$regular_price = (float) $regular_price;
		$discount_amount  = max( 0, $regular_price - $current_price );
		$discount_percent = $regular_price > 0 ? ( $discount_amount / $regular_price ) * 100 : 0;
		$age_options      = gedu_search_age_options( $product );
		$stored_aliases    = $product->get_meta( GEDU_SEARCH_ALIASES_META, true );
		$suggested_aliases = gedu_search_suggest_aliases( $product->get_name(), $categories['text'] );
		$search_aliases    = gedu_search_merge_aliases( $stored_aliases, $suggested_aliases );

		$index[] = array(
			'id'            => (int) $id,
			'title'         => gedu_search_normalize( $product->get_name() ),
			'sku'           => gedu_search_normalize( $product->get_sku() ),
			'aliases'       => gedu_search_normalize( $search_aliases ),
			'categories'    => gedu_search_normalize( $categories['text'] ),
			'category_ids'  => $categories['ids'],
			'tags'          => gedu_search_normalize( trim( $tags['text'] . ' ' . $brand_text ) ),
			'attributes'    => gedu_search_normalize( gedu_search_attribute_text( $product ) ),
			'short'         => $protected ? '' : gedu_search_normalize( $product->get_short_description() ),
			'description'   => $protected ? '' : gedu_search_normalize( $product->get_description() ),
			'min_price'     => (int) round( (float) $min_price * $factor ),
			'max_price'     => (int) round( (float) $max_price * $factor ),
			'on_sale'       => (bool) $product->is_on_sale(),
			'stock_status'  => $product->get_stock_status(),
			'total_sales'   => (int) $product->get_total_sales(),
			'rating'        => (float) $product->get_average_rating(),
			'created'       => $created ? $created->getTimestamp() : 0,
			'discount_amount'  => (int) round( $discount_amount * $factor ),
			'discount_percent' => (float) $discount_percent,
			'free_shipping'    => 'yes' === get_post_meta( $id, '_gedu_combo_free_shipping', true ),
			'age_options'      => $age_options,
			'age_keys'         => array_keys( $age_options ),
		);
	}

	set_transient( GEDU_SEARCH_INDEX_TRANSIENT, $index, 12 * HOUR_IN_SECONDS );
	return $index;
}

function gedu_search_compare_records( $a, $b, $orderby, $order ) {
	$direction = 'asc' === $order ? 1 : -1;
	switch ( $orderby ) {
		case 'price':
			$comparison = $a['min_price'] <=> $b['min_price'];
			break;
		case 'date':
			$comparison = $a['created'] <=> $b['created'];
			break;
		case 'title':
			$comparison = strnatcasecmp( $a['title'], $b['title'] );
			break;
		case 'rating':
			$comparison = $a['rating'] <=> $b['rating'];
			break;
		case 'discount_percent':
			$comparison = $a['discount_percent'] <=> $b['discount_percent'];
			break;
		case 'discount_amount':
			$comparison = $a['discount_amount'] <=> $b['discount_amount'];
			break;
		case 'popularity':
			$comparison = $a['total_sales'] <=> $b['total_sales'];
			if ( 0 === $comparison ) {
				$comparison = $a['rating'] <=> $b['rating'];
			}
			break;
		case 'relevance':
		default:
			$comparison = $a['_score'] <=> $b['_score'];
			$direction  = -1;
			if ( 0 === $comparison ) {
				$comparison = ( 'instock' === $a['stock_status'] ) <=> ( 'instock' === $b['stock_status'] );
			}
			if ( 0 === $comparison ) {
				$comparison = $a['total_sales'] <=> $b['total_sales'];
			}
			break;
	}
	if ( 0 === $comparison ) {
		$comparison = $a['id'] <=> $b['id'];
	}
	return $comparison * $direction;
}

function gedu_search_products( WP_REST_Request $request ) {
	$query    = sanitize_text_field( (string) $request->get_param( 'q' ) );
	$page     = max( 1, (int) $request->get_param( 'page' ) );
	$per_page = min( 100, max( 1, (int) $request->get_param( 'per_page' ) ) );
	$category = max( 0, (int) $request->get_param( 'category' ) );
	$on_sale  = rest_sanitize_boolean( $request->get_param( 'on_sale' ) );
	$stock    = sanitize_key( (string) $request->get_param( 'stock_status' ) );
	$min      = max( 0, (int) $request->get_param( 'min_price' ) );
	$max      = max( 0, (int) $request->get_param( 'max_price' ) );
	$free_shipping = rest_sanitize_boolean( $request->get_param( 'free_shipping' ) );
	$min_rating    = min( 5, max( 0, (float) $request->get_param( 'min_rating' ) ) );
	$age           = sanitize_title( (string) $request->get_param( 'age' ) );
	$orderby  = sanitize_key( (string) $request->get_param( 'orderby' ) );
	$order    = 'asc' === strtolower( (string) $request->get_param( 'order' ) ) ? 'asc' : 'desc';
	$orderby  = in_array( $orderby, array( 'relevance', 'popularity', 'date', 'price', 'title', 'rating', 'discount_percent', 'discount_amount' ), true ) ? $orderby : 'relevance';
	if ( '' === trim( $query ) && 'relevance' === $orderby ) {
		$orderby = 'popularity';
	}

	$synonyms = get_option( GEDU_SEARCH_SYNONYMS_OPTION, gedu_search_default_synonyms() );
	$variants = gedu_search_query_variants( $query, gedu_search_parse_synonyms( $synonyms ) );
	$matches  = array();
	foreach ( gedu_search_get_index() as $record ) {
		if ( $category && ! in_array( $category, $record['category_ids'], true ) ) {
			continue;
		}
		if ( $on_sale && ! $record['on_sale'] ) {
			continue;
		}
		if ( $stock && $stock !== $record['stock_status'] ) {
			continue;
		}
		if ( $min && $record['max_price'] < $min ) {
			continue;
		}
		if ( $max && $record['min_price'] > $max ) {
			continue;
		}
		if ( $free_shipping && empty( $record['free_shipping'] ) ) {
			continue;
		}
		if ( $min_rating && $record['rating'] < $min_rating ) {
			continue;
		}
		if ( $age && ! in_array( $age, $record['age_keys'], true ) ) {
			continue;
		}

		$record['_score'] = empty( $variants ) ? 0 : gedu_search_score_record( $record, $variants );
		if ( empty( $variants ) || $record['_score'] > 0 ) {
			$matches[] = $record;
		}
	}

	usort(
		$matches,
		function ( $a, $b ) use ( $orderby, $order ) {
			return gedu_search_compare_records( $a, $b, $orderby, $order );
		}
	);

	$total      = count( $matches );
	$totalpages = max( 1, (int) ceil( $total / $per_page ) );
	$slice      = array_slice( $matches, ( $page - 1 ) * $per_page, $per_page );
	$ids        = array_map(
		function ( $record ) {
			return $record['id'];
		},
		$slice
	);
	$records_by_id = array();
	foreach ( $slice as $record ) {
		$records_by_id[ $record['id'] ] = $record;
	}

	$data = array();
	if ( ! empty( $ids ) ) {
		$store_request = new WP_REST_Request( 'GET', '/wc/store/v1/products' );
		$store_request->set_param( 'include', $ids );
		$store_request->set_param( 'orderby', 'include' );
		$store_request->set_param( 'per_page', count( $ids ) );
		$store_response = rest_do_request( $store_request );
		if ( $store_response->is_error() ) {
			return new WP_Error( 'gedushop_search_store_api_error', 'Could not load matching products.', array( 'status' => 502 ) );
		}
		$by_id = array();
		foreach ( (array) $store_response->get_data() as $product ) {
			if ( isset( $product['id'] ) ) {
				$by_id[ (int) $product['id'] ] = $product;
			}
		}
		foreach ( $ids as $id ) {
			if ( isset( $by_id[ $id ] ) ) {
				$product = $by_id[ $id ];
				if ( isset( $records_by_id[ $id ] ) ) {
					if ( ! isset( $product['extensions']['gedushop'] ) || ! is_array( $product['extensions']['gedushop'] ) ) {
						$product['extensions']['gedushop'] = array();
					}
					$product['extensions']['gedushop']['catalog_metrics'] = array(
						'total_sales' => $records_by_id[ $id ]['total_sales'],
						'created'     => $records_by_id[ $id ]['created'],
					);
				}
				$data[] = $product;
			}
		}
	}

	$response = rest_ensure_response( $data );
	$response->header( 'X-WP-Total', (string) $total );
	$response->header( 'X-WP-TotalPages', (string) $totalpages );
	$response->header( 'Cache-Control', 'no-store' );
	return $response;
}

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'gedushop/v1',
			'/product-search',
			array(
				'methods'             => 'GET',
				'callback'            => 'gedu_search_products',
				'permission_callback' => '__return_true',
				'args'                => array(
					'q'            => array( 'required' => false, 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ),
					'page'         => array( 'default' => 1, 'sanitize_callback' => 'absint' ),
					'per_page'     => array( 'default' => 24, 'sanitize_callback' => 'absint' ),
					'category'     => array( 'default' => 0, 'sanitize_callback' => 'absint' ),
					'on_sale'      => array( 'default' => false, 'sanitize_callback' => 'rest_sanitize_boolean' ),
					'stock_status' => array( 'default' => '', 'sanitize_callback' => 'sanitize_key' ),
					'min_price'    => array( 'default' => 0, 'sanitize_callback' => 'absint' ),
					'max_price'    => array( 'default' => 0, 'sanitize_callback' => 'absint' ),
					'free_shipping' => array( 'default' => false, 'sanitize_callback' => 'rest_sanitize_boolean' ),
					'min_rating'    => array( 'default' => 0, 'sanitize_callback' => 'floatval' ),
					'age'           => array( 'default' => '', 'sanitize_callback' => 'sanitize_title' ),
					'orderby'      => array( 'default' => 'relevance', 'sanitize_callback' => 'sanitize_key' ),
					'order'        => array( 'default' => 'desc', 'sanitize_callback' => 'sanitize_key' ),
				),
	)
);

/** Filter facets that are safe to display for the current catalogue. */
function gedu_search_filter_options() {
	$ages = array();
	foreach ( gedu_search_get_index() as $record ) {
		foreach ( $record['age_options'] as $key => $label ) {
			$ages[ $key ] = $label;
		}
	}
	natcasesort( $ages );
	$response = rest_ensure_response( array( 'ages' => $ages ) );
	$response->header( 'Cache-Control', 'public, max-age=3600' );
	return $response;
}

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'gedushop/v1',
			'/product-filter-options',
			array(
				'methods'             => 'GET',
				'callback'            => 'gedu_search_filter_options',
				'permission_callback' => '__return_true',
			)
		);
	}
);
	}
);

/** Return a preview of safe, additive alias changes for the current catalogue. */
function gedu_search_get_migration_rows() {
	$ids = get_posts(
		array(
			'post_type'      => 'product',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'fields'         => 'ids',
			'orderby'        => 'ID',
			'order'          => 'ASC',
			'no_found_rows'  => true,
		)
	);

	$rows = array();
	foreach ( $ids as $id ) {
		$product = wc_get_product( $id );
		if ( ! $product ) {
			continue;
		}
		$categories = gedu_search_term_text( $id, 'product_cat' )['text'];
		$current    = (string) $product->get_meta( GEDU_SEARCH_ALIASES_META, true );
		$suggested  = gedu_search_suggest_aliases( $product->get_name(), $categories );
		$merged     = gedu_search_merge_aliases( $current, $suggested );

		$current_keys = array();
		foreach ( preg_split( '/[,\r\n]+/u', $current ) as $alias ) {
			$key = gedu_search_normalize( $alias );
			if ( '' !== $key ) {
				$current_keys[ $key ] = true;
			}
		}
		$additions = array_values(
			array_filter(
				$suggested,
				function ( $alias ) use ( $current_keys ) {
					return ! isset( $current_keys[ gedu_search_normalize( $alias ) ] );
				}
			)
		);

		$rows[] = array(
			'id'        => (int) $id,
			'name'      => $product->get_name(),
			'current'   => $current,
			'merged'    => $merged,
			'additions' => $additions,
		);
	}
	return $rows;
}

function gedu_search_build_backup() {
	$products = array();
	foreach ( gedu_search_get_migration_rows() as $row ) {
		$products[] = array(
			'id'      => $row['id'],
			'name'    => $row['name'],
			'aliases' => $row['current'],
		);
	}
	return array(
		'created_at_utc' => gmdate( 'c' ),
		'plugin_version' => '1.1.0',
		'synonyms'       => get_option( GEDU_SEARCH_SYNONYMS_OPTION, '' ),
		'products'       => $products,
	);
}

add_action(
	'admin_post_gedushop_export_search_backup',
	function () {
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_die( 'You do not have permission to export product search data.' );
		}
		check_admin_referer( 'gedushop_export_search_backup' );
		$backup = gedu_search_build_backup();
		nocache_headers();
		header( 'Content-Type: application/json; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename="gedushop-search-backup-' . gmdate( 'Y-m-d-His' ) . '.json"' );
		echo wp_json_encode( $backup, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
		exit;
	}
);

add_action(
	'admin_post_gedushop_apply_search_migration',
	function () {
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_die( 'You do not have permission to migrate product search data.' );
		}
		check_admin_referer( 'gedushop_apply_search_migration' );

		// Preserve the pre-migration state once. Re-running is intentionally safe.
		if ( false === get_option( GEDU_SEARCH_BACKUP_OPTION, false ) ) {
			add_option( GEDU_SEARCH_BACKUP_OPTION, gedu_search_build_backup(), '', false );
		}

		$changed       = 0;
		$aliases_added = 0;
		foreach ( gedu_search_get_migration_rows() as $row ) {
			if ( $row['merged'] !== $row['current'] ) {
				update_post_meta( $row['id'], GEDU_SEARCH_ALIASES_META, $row['merged'] );
				++$changed;
				$aliases_added += count( $row['additions'] );
			}
		}

		$current_synonyms = (string) get_option( GEDU_SEARCH_SYNONYMS_OPTION, '' );
		$merged_synonyms  = gedu_search_merge_synonym_text( $current_synonyms );
		update_option( GEDU_SEARCH_SYNONYMS_OPTION, $merged_synonyms, false );
		update_option( 'gedushop_search_migration_version', '1.1.0', false );
		gedu_search_clear_index();

		wp_safe_redirect(
			add_query_arg(
				array(
					'page'          => 'gedushop-product-search',
					'migrated'      => 1,
					'products'      => $changed,
					'aliases_added' => $aliases_added,
				),
				admin_url( 'admin.php' )
			)
		);
		exit;
	}
);

add_action(
	'admin_menu',
	function () {
		add_submenu_page(
			'woocommerce',
			'GeduShop Product Search',
			'Product Search',
			'manage_woocommerce',
			'gedushop-product-search',
			'gedu_search_render_settings_page'
		);
	}
);

function gedu_search_render_settings_page() {
	if ( ! current_user_can( 'manage_woocommerce' ) ) {
		return;
	}
	$synonyms       = get_option( GEDU_SEARCH_SYNONYMS_OPTION, gedu_search_default_synonyms() );
	$migration_rows = gedu_search_get_migration_rows();
	$pending_rows   = array_values(
		array_filter(
			$migration_rows,
			function ( $row ) {
				return ! empty( $row['additions'] );
			}
		)
	);
	$pending_aliases = array_sum(
		array_map(
			function ( $row ) {
				return count( $row['additions'] );
			},
			$pending_rows
		)
	);
	$synonyms_pending = gedu_search_merge_synonym_text( $synonyms ) !== trim( (string) $synonyms );
	$backup_url = wp_nonce_url(
		admin_url( 'admin-post.php?action=gedushop_export_search_backup' ),
		'gedushop_export_search_backup'
	);
	?>
	<div class="wrap">
		<h1>GeduShop Product Search</h1>
		<p>The index automatically uses product titles, SKUs, categories, tags, brands, attributes and curated search aliases. Description text only improves the rank of an already relevant product.</p>
		<?php if ( isset( $_GET['updated'] ) ) : // phpcs:ignore WordPress.Security.NonceVerification.Recommended ?>
			<div class="notice notice-success is-dismissible"><p>Search settings saved. The index will rebuild on the next search.</p></div>
		<?php endif; ?>
		<?php if ( isset( $_GET['migrated'] ) ) : // phpcs:ignore WordPress.Security.NonceVerification.Recommended ?>
			<div class="notice notice-success is-dismissible"><p>
				<?php
				printf(
					/* translators: 1: products changed, 2: aliases added. */
					esc_html__( 'Migration complete: %1$d products updated and %2$d aliases added. The search index will rebuild automatically.', 'gedushop-product-search' ),
					isset( $_GET['products'] ) ? absint( $_GET['products'] ) : 0,
					isset( $_GET['aliases_added'] ) ? absint( $_GET['aliases_added'] ) : 0
				);
				?>
			</p></div>
		<?php endif; ?>

		<div class="card" style="max-width:none;padding:20px;margin-top:20px">
			<h2 style="margin-top:0">English, Bangla &amp; Banglish catalogue migration</h2>
			<p>This additive migration never removes existing aliases. A pre-migration backup is saved automatically, and running it again does not create duplicates. The same curated rules are also applied in the index for future products.</p>
			<p><strong><?php echo esc_html( count( $migration_rows ) ); ?></strong> published products analysed; <strong><?php echo esc_html( count( $pending_rows ) ); ?></strong> products have <strong><?php echo esc_html( $pending_aliases ); ?></strong> aliases ready to add. Global synonym update: <strong><?php echo $synonyms_pending ? 'pending' : 'up to date'; ?></strong>.</p>
			<p>
				<a class="button" href="<?php echo esc_url( $backup_url ); ?>">Download current search-data backup</a>
			</p>
			<?php if ( ! empty( $pending_rows ) || $synonyms_pending ) : ?>
				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="margin:16px 0">
					<input type="hidden" name="action" value="gedushop_apply_search_migration" />
					<?php wp_nonce_field( 'gedushop_apply_search_migration' ); ?>
					<?php submit_button( 'Apply safe catalogue migration', 'primary', 'submit', false ); ?>
				</form>
				<?php if ( ! empty( $pending_rows ) ) : ?>
				<details>
					<summary style="cursor:pointer"><strong>Preview product aliases</strong></summary>
					<table class="widefat striped" style="margin-top:12px">
						<thead><tr><th style="width:75px">Product ID</th><th style="width:32%">Product</th><th>Aliases to add</th></tr></thead>
						<tbody>
						<?php foreach ( $pending_rows as $row ) : ?>
							<tr>
								<td><?php echo esc_html( $row['id'] ); ?></td>
								<td><?php echo esc_html( $row['name'] ); ?></td>
								<td><?php echo esc_html( implode( ', ', $row['additions'] ) ); ?></td>
							</tr>
						<?php endforeach; ?>
						</tbody>
					</table>
				</details>
				<?php endif; ?>
			<?php else : ?>
				<p><strong>Catalogue migration is up to date.</strong></p>
			<?php endif; ?>
		</div>

		<h2>Global synonym dictionary</h2>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="gedushop_save_product_search" />
			<?php wp_nonce_field( 'gedushop_product_search' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="gedushop_search_synonyms">Synonyms</label></th>
					<td>
						<textarea class="large-text code" rows="16" id="gedushop_search_synonyms" name="synonyms"><?php echo esc_textarea( $synonyms ); ?></textarea>
						<p class="description">One comma-separated equivalent group per line. English, Bangla and Banglish can be mixed. Lines beginning with # are ignored.</p>
					</td>
				</tr>
			</table>
			<?php submit_button( 'Save and rebuild index' ); ?>
		</form>
	</div>
	<?php
}

add_action(
	'admin_post_gedushop_save_product_search',
	function () {
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_die( 'You do not have permission to change product search settings.' );
		}
		check_admin_referer( 'gedushop_product_search' );
		$synonyms = isset( $_POST['synonyms'] ) ? sanitize_textarea_field( wp_unslash( $_POST['synonyms'] ) ) : '';
		update_option( GEDU_SEARCH_SYNONYMS_OPTION, $synonyms, false );
		gedu_search_clear_index();
		wp_safe_redirect( admin_url( 'admin.php?page=gedushop-product-search&updated=1' ) );
		exit;
	}
);
