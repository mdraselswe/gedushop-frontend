<?php
/**
 * Plugin Name: GeduShop Product Search
 * Description: Weighted multilingual product search for the headless storefront, with aliases, synonyms, typo tolerance, filters and relevance ranking.
 * Version:     1.0.1
 * Author:      GeduShop
 * Requires PHP: 7.4
 * Requires Plugins: woocommerce
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/search-algorithm.php';

const GEDU_SEARCH_ALIASES_META    = '_gedushop_search_aliases';
const GEDU_SEARCH_SYNONYMS_OPTION = 'gedushop_search_synonyms';
const GEDU_SEARCH_INDEX_TRANSIENT = 'gedushop_product_search_index_v1';

function gedu_search_default_synonyms() {
	return implode(
		"\n",
		array(
			'toy, toys, khelna, খেলনা',
			'educational toy, learning toy, শেখার খেলনা, shikhar khelna',
			'feeding set, dinner set, baby plate, food set, খাবার সেট, khabar set',
			'feeding bottle, milk bottle, baby bottle, দুধের বোতল, dudher botol',
			'stroller, pram, pushchair, baby cart, baby gari, বাচ্চার গাড়ি',
			'rattle, jhunjhuni, ঝুনঝুনি',
			'teether, teething toy, teeth toy, দাঁত ওঠার খেলনা',
			'diaper bag, mommy bag, mother bag, nappy bag',
			'bib, feeding bib, baby bib',
			'potty, toilet trainer, potty trainer',
			'pacifier, soother, dummy',
			'cot, crib, baby bed, বাচ্চার বিছানা',
		)
	);
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

		$index[] = array(
			'id'            => (int) $id,
			'title'         => gedu_search_normalize( $product->get_name() ),
			'sku'           => gedu_search_normalize( $product->get_sku() ),
			'aliases'       => gedu_search_normalize( $product->get_meta( GEDU_SEARCH_ALIASES_META, true ) ),
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
	$orderby  = sanitize_key( (string) $request->get_param( 'orderby' ) );
	$order    = 'asc' === strtolower( (string) $request->get_param( 'order' ) ) ? 'asc' : 'desc';
	$orderby  = in_array( $orderby, array( 'relevance', 'popularity', 'date', 'price', 'title' ), true ) ? $orderby : 'relevance';

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

		$record['_score'] = gedu_search_score_record( $record, $variants );
		if ( $record['_score'] > 0 ) {
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
				$data[] = $by_id[ $id ];
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
					'q'            => array( 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ),
					'page'         => array( 'default' => 1, 'sanitize_callback' => 'absint' ),
					'per_page'     => array( 'default' => 24, 'sanitize_callback' => 'absint' ),
					'category'     => array( 'default' => 0, 'sanitize_callback' => 'absint' ),
					'on_sale'      => array( 'default' => false, 'sanitize_callback' => 'rest_sanitize_boolean' ),
					'stock_status' => array( 'default' => '', 'sanitize_callback' => 'sanitize_key' ),
					'min_price'    => array( 'default' => 0, 'sanitize_callback' => 'absint' ),
					'max_price'    => array( 'default' => 0, 'sanitize_callback' => 'absint' ),
					'orderby'      => array( 'default' => 'relevance', 'sanitize_callback' => 'sanitize_key' ),
					'order'        => array( 'default' => 'desc', 'sanitize_callback' => 'sanitize_key' ),
				),
			)
		);
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
	$synonyms = get_option( GEDU_SEARCH_SYNONYMS_OPTION, gedu_search_default_synonyms() );
	?>
	<div class="wrap">
		<h1>GeduShop Product Search</h1>
		<p>The index automatically uses product titles, SKUs, categories, tags, brands, attributes, short descriptions and descriptions. Add product-specific terms under <strong>Product data &rarr; General &rarr; Search aliases</strong>.</p>
		<?php if ( isset( $_GET['updated'] ) ) : // phpcs:ignore WordPress.Security.NonceVerification.Recommended ?>
			<div class="notice notice-success is-dismissible"><p>Search settings saved. The index will rebuild on the next search.</p></div>
		<?php endif; ?>
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
