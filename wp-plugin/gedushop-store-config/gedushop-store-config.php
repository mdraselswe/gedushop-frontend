<?php
/**
 * Plugin Name: GeduShop Store Configuration
 * Description: One screen for delivery charges and the free-delivery threshold, with a public read-only endpoint for the headless storefront.
 * Version:     1.2.0
 * Author:      GeduShop
 * Requires PHP: 7.4
 * Requires Plugins: woocommerce
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const GEDU_STORE_SETTINGS_DEFAULTS = array(
	'inside_dhaka_charge'   => 80,
	'outside_dhaka_charge'  => 120,
	'free_delivery_minimum' => 1500,
);
const GEDU_STORE_POPUPS_OPTION = 'gedushop_route_popups';

function gedu_store_popup_defaults() {
	return array(
		'enabled'        => false,
		'title'          => '',
		'message'        => '',
		'route_patterns' => '',
		'cta_label'      => '',
		'cta_url'        => '',
		'frequency'      => 'once_per_session',
	);
}

function gedu_store_current_popups() {
	$saved    = get_option( GEDU_STORE_POPUPS_OPTION, array() );
	$defaults = gedu_store_popup_defaults();
	$popups   = array();

	for ( $i = 0; $i < 5; $i++ ) {
		$popup    = isset( $saved[ $i ] ) && is_array( $saved[ $i ] ) ? $saved[ $i ] : array();
		$popups[] = array_merge( $defaults, $popup );
	}

	return $popups;
}

function gedu_store_public_popups() {
	$public = array();
	foreach ( gedu_store_current_popups() as $index => $popup ) {
		$title   = trim( (string) $popup['title'] );
		$message = trim( (string) $popup['message'] );
		$routes  = array_values(
			array_filter(
				array_map(
					'trim',
					preg_split( '/\r\n|\r|\n/', (string) $popup['route_patterns'] )
				)
			)
		);

		if ( empty( $popup['enabled'] ) || '' === $title || '' === $message || empty( $routes ) ) {
			continue;
		}

		$frequency = in_array( $popup['frequency'], array( 'always', 'once_per_session', 'once_per_browser' ), true )
			? $popup['frequency']
			: 'once_per_session';
		$signature = md5( wp_json_encode( array( $title, $message, $routes, $popup['cta_label'], $popup['cta_url'], $frequency ) ) );

		$public[] = array(
			'id'        => 'popup_' . ( $index + 1 ) . '_' . substr( $signature, 0, 10 ),
			'title'     => $title,
			'message'   => $message,
			'routes'    => $routes,
			'ctaLabel'  => trim( (string) $popup['cta_label'] ),
			'ctaUrl'    => trim( (string) $popup['cta_url'] ),
			'frequency' => $frequency,
		);
	}

	return $public;
}

/** Return the relevant shipping methods, keyed by policy name. */
function gedu_store_shipping_methods() {
	$found = array();
	if ( ! class_exists( 'WC_Shipping_Zones' ) ) {
		return $found;
	}

	foreach ( WC_Shipping_Zones::get_zones() as $zone ) {
		$name = strtolower( trim( isset( $zone['zone_name'] ) ? $zone['zone_name'] : '' ) );
		$key  = 'dhaka' === $name ? 'inside' : ( 'outside dhaka' === $name ? 'outside' : '' );
		if ( ! $key ) {
			continue;
		}
		foreach ( isset( $zone['shipping_methods'] ) ? $zone['shipping_methods'] : array() as $method ) {
			if ( 'flat_rate' === $method->id ) {
				$found[ $key . '_flat' ] = $method;
			} elseif ( 'free_shipping' === $method->id ) {
				$found[ $key . '_free' ] = $method;
			}
		}
	}

	return $found;
}

function gedu_store_number( $value, $fallback ) {
	return is_numeric( $value ) ? max( 0, (float) $value ) : (float) $fallback;
}

function gedu_store_popup_url( $value ) {
	$url = trim( sanitize_text_field( $value ) );
	if ( '' === $url ) {
		return '';
	}
	if ( '/' === $url[0] ) {
		return $url;
	}
	return esc_url_raw( $url );
}

/** Read WooCommerce itself, so changes made in either admin screen cannot drift. */
function gedu_store_current_settings() {
	$values  = GEDU_STORE_SETTINGS_DEFAULTS;
	$methods = gedu_store_shipping_methods();

	if ( isset( $methods['inside_flat'] ) ) {
		$values['inside_dhaka_charge'] = gedu_store_number( $methods['inside_flat']->get_option( 'cost' ), $values['inside_dhaka_charge'] );
	}
	if ( isset( $methods['outside_flat'] ) ) {
		$values['outside_dhaka_charge'] = gedu_store_number( $methods['outside_flat']->get_option( 'cost' ), $values['outside_dhaka_charge'] );
	}
	foreach ( array( 'inside_free', 'outside_free' ) as $key ) {
		if ( isset( $methods[ $key ] ) ) {
			$values['free_delivery_minimum'] = gedu_store_number( $methods[ $key ]->get_option( 'min_amount' ), $values['free_delivery_minimum'] );
			break;
		}
	}

	return $values;
}

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'gedushop/v1',
			'/store-settings',
			array(
				'methods'             => 'GET',
				'callback'            => function () {
					$response = rest_ensure_response( gedu_store_current_settings() );
					$response->header( 'Cache-Control', 'no-store' );
					return $response;
				},
				'permission_callback' => '__return_true',
			)
		);
		register_rest_route(
			'gedushop/v1',
			'/popups',
			array(
				'methods'             => 'GET',
				'callback'            => function () {
					$response = rest_ensure_response( gedu_store_public_popups() );
					$response->header( 'Cache-Control', 'no-store' );
					return $response;
				},
				'permission_callback' => '__return_true',
			)
		);
	}
);

add_action(
	'admin_menu',
	function () {
		add_submenu_page(
			'woocommerce',
			'GeduShop Settings',
			'GeduShop Settings',
			'manage_woocommerce',
			'gedushop-store-settings',
			'gedu_store_render_settings_page'
		);
	}
);

function gedu_store_render_settings_page() {
	if ( ! current_user_can( 'manage_woocommerce' ) ) {
		return;
	}
	$values = gedu_store_current_settings();
	$popups = gedu_store_current_popups();
	?>
	<div class="wrap">
		<h1>GeduShop Store Settings</h1>
		<p>These values update WooCommerce checkout and the public storefront together. Enter amounts in Bangladeshi Taka. Manage all coupons separately from Marketing &rarr; Coupons.</p>
		<?php if ( isset( $_GET['updated'] ) ) : // phpcs:ignore WordPress.Security.NonceVerification.Recommended ?>
			<div class="notice notice-success is-dismissible"><p>Store settings saved.</p></div>
		<?php endif; ?>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="gedushop_save_store_settings" />
			<?php wp_nonce_field( 'gedushop_store_settings' ); ?>
			<table class="form-table" role="presentation">
				<?php
				$fields = array(
					'inside_dhaka_charge'   => array( 'Inside Dhaka delivery charge', 'Normal delivery charge for the Dhaka shipping zone.' ),
					'outside_dhaka_charge'  => array( 'Outside Dhaka delivery charge', 'Normal delivery charge for the Outside Dhaka shipping zone.' ),
					'free_delivery_minimum' => array( 'Free delivery minimum', 'Applied to both Dhaka and Outside Dhaka.' ),
				);
				foreach ( $fields as $name => $field ) :
					?>
					<tr>
						<th scope="row"><label for="<?php echo esc_attr( $name ); ?>"><?php echo esc_html( $field[0] ); ?></label></th>
						<td>
							<input class="regular-text" type="number" min="0" step="0.01" id="<?php echo esc_attr( $name ); ?>" name="<?php echo esc_attr( $name ); ?>" value="<?php echo esc_attr( $values[ $name ] ); ?>" required />
							<p class="description"><?php echo esc_html( $field[1] ); ?></p>
						</td>
					</tr>
				<?php endforeach; ?>
			</table>
			<h2>Route popup modals</h2>
			<p class="description">Enable a popup only when you need it. Route patterns support exact paths like <code>/</code>, specific product paths like <code>/product/product-slug/</code>, wildcard groups like <code>/product/*</code>, and <code>*</code> for every page.</p>
			<?php foreach ( $popups as $index => $popup ) : ?>
				<div style="margin:16px 0;padding:16px;border:1px solid #dcdcde;border-radius:8px;background:#fff;">
					<h3 style="margin-top:0;"><?php echo esc_html( 'Popup ' . ( $index + 1 ) ); ?></h3>
					<table class="form-table" role="presentation">
						<tr>
							<th scope="row">Enabled</th>
							<td>
								<label>
									<input type="checkbox" name="popups[<?php echo esc_attr( $index ); ?>][enabled]" value="1" <?php checked( ! empty( $popup['enabled'] ) ); ?> />
									Show this popup when its route matches
								</label>
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="popup_<?php echo esc_attr( $index ); ?>_routes">Routes</label></th>
							<td>
								<textarea class="large-text code" rows="3" id="popup_<?php echo esc_attr( $index ); ?>_routes" name="popups[<?php echo esc_attr( $index ); ?>][route_patterns]" placeholder="/&#10;/product/*"><?php echo esc_textarea( $popup['route_patterns'] ); ?></textarea>
								<p class="description">One route pattern per line. First enabled matching popup is shown.</p>
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="popup_<?php echo esc_attr( $index ); ?>_title">Title</label></th>
							<td><input class="regular-text" type="text" id="popup_<?php echo esc_attr( $index ); ?>_title" name="popups[<?php echo esc_attr( $index ); ?>][title]" value="<?php echo esc_attr( $popup['title'] ); ?>" /></td>
						</tr>
						<tr>
							<th scope="row"><label for="popup_<?php echo esc_attr( $index ); ?>_message">Message</label></th>
							<td><textarea class="large-text" rows="4" id="popup_<?php echo esc_attr( $index ); ?>_message" name="popups[<?php echo esc_attr( $index ); ?>][message]"><?php echo esc_textarea( $popup['message'] ); ?></textarea></td>
						</tr>
						<tr>
							<th scope="row"><label for="popup_<?php echo esc_attr( $index ); ?>_cta_label">Button label</label></th>
							<td><input class="regular-text" type="text" id="popup_<?php echo esc_attr( $index ); ?>_cta_label" name="popups[<?php echo esc_attr( $index ); ?>][cta_label]" value="<?php echo esc_attr( $popup['cta_label'] ); ?>" placeholder="Shop now" /></td>
						</tr>
						<tr>
							<th scope="row"><label for="popup_<?php echo esc_attr( $index ); ?>_cta_url">Button URL</label></th>
							<td><input class="regular-text" type="text" id="popup_<?php echo esc_attr( $index ); ?>_cta_url" name="popups[<?php echo esc_attr( $index ); ?>][cta_url]" value="<?php echo esc_attr( $popup['cta_url'] ); ?>" placeholder="/shop/" /></td>
						</tr>
						<tr>
							<th scope="row"><label for="popup_<?php echo esc_attr( $index ); ?>_frequency">Frequency</label></th>
							<td>
								<select id="popup_<?php echo esc_attr( $index ); ?>_frequency" name="popups[<?php echo esc_attr( $index ); ?>][frequency]">
									<option value="always" <?php selected( $popup['frequency'], 'always' ); ?>>Every visit</option>
									<option value="once_per_session" <?php selected( $popup['frequency'], 'once_per_session' ); ?>>Once per browser session</option>
									<option value="once_per_browser" <?php selected( $popup['frequency'], 'once_per_browser' ); ?>>Once until content changes</option>
								</select>
							</td>
						</tr>
					</table>
				</div>
			<?php endforeach; ?>
			<?php submit_button( 'Save store settings' ); ?>
		</form>
	</div>
	<?php
}

add_action(
	'admin_post_gedushop_save_store_settings',
	function () {
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_die( 'You do not have permission to change store settings.' );
		}
		check_admin_referer( 'gedushop_store_settings' );

		$values = array();
		foreach ( GEDU_STORE_SETTINGS_DEFAULTS as $key => $fallback ) {
			$raw            = isset( $_POST[ $key ] ) ? wc_clean( wp_unslash( $_POST[ $key ] ) ) : $fallback;
			$values[ $key ] = gedu_store_number( $raw, $fallback );
		}

		$methods = gedu_store_shipping_methods();
		$updates = array(
			'inside_flat'  => array( 'cost', $values['inside_dhaka_charge'] ),
			'outside_flat' => array( 'cost', $values['outside_dhaka_charge'] ),
			'inside_free'  => array( 'min_amount', $values['free_delivery_minimum'] ),
			'outside_free' => array( 'min_amount', $values['free_delivery_minimum'] ),
		);
		foreach ( $updates as $key => $update ) {
			if ( ! isset( $methods[ $key ] ) ) {
				wp_die( esc_html( 'Required WooCommerce shipping method not found: ' . $key ) );
			}
			$option                  = get_option( $methods[ $key ]->get_instance_option_key(), array() );
			$option[ $update[0] ]    = wc_format_decimal( $update[1] );
			update_option( $methods[ $key ]->get_instance_option_key(), $option );
		}

		$popups = array();
		$posted = isset( $_POST['popups'] ) && is_array( $_POST['popups'] ) ? wp_unslash( $_POST['popups'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		for ( $i = 0; $i < 5; $i++ ) {
			$raw       = isset( $posted[ $i ] ) && is_array( $posted[ $i ] ) ? $posted[ $i ] : array();
			$frequency = isset( $raw['frequency'] ) ? sanitize_text_field( $raw['frequency'] ) : 'once_per_session';
			if ( ! in_array( $frequency, array( 'always', 'once_per_session', 'once_per_browser' ), true ) ) {
				$frequency = 'once_per_session';
			}
			$popups[] = array(
				'enabled'        => ! empty( $raw['enabled'] ),
				'title'          => isset( $raw['title'] ) ? sanitize_text_field( $raw['title'] ) : '',
				'message'        => isset( $raw['message'] ) ? sanitize_textarea_field( $raw['message'] ) : '',
				'route_patterns' => isset( $raw['route_patterns'] ) ? sanitize_textarea_field( $raw['route_patterns'] ) : '',
				'cta_label'      => isset( $raw['cta_label'] ) ? sanitize_text_field( $raw['cta_label'] ) : '',
				'cta_url'        => isset( $raw['cta_url'] ) ? gedu_store_popup_url( $raw['cta_url'] ) : '',
				'frequency'      => $frequency,
			);
		}
		update_option( GEDU_STORE_POPUPS_OPTION, $popups, false );

		wp_safe_redirect( admin_url( 'admin.php?page=gedushop-store-settings&updated=1' ) );
		exit;
	}
);
