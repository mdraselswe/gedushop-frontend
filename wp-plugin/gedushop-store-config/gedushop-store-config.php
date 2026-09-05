<?php
/**
 * Plugin Name: GeduShop Store Configuration
 * Description: One screen for delivery charges and the free-delivery threshold, with a public read-only endpoint for the headless storefront.
 * Version:     1.1.1
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

		wp_safe_redirect( admin_url( 'admin.php?page=gedushop-store-settings&updated=1' ) );
		exit;
	}
);
