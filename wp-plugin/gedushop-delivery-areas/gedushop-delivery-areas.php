<?php
/**
 * Plugin Name: GeduShop Delivery Areas
 * Description: Charges the outlying areas of the Dhaka district the outside-Dhaka delivery rate -- only Dhaka Sadar is inside the city.
 * Version:     1.0.0
 * Author:      GeduShop
 * Requires PHP: 7.4
 *
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS
 *
 * WooCommerce picks a shipping zone from country + state, and nothing else.
 * The Dhaka district is one state code, BD-13, so Savar, Dhamrai, Keraniganj,
 * Nawabganj and Dohar all land in the "Dhaka" zone and take the inside-city
 * rate -- while in fact they cost what any other district costs to reach.
 *
 * Dhaka Sadar is the city. Nothing else is: the inside-Dhaka rate is for the
 * one pair district = Dhaka, area = Dhaka Sadar, and every other combination --
 * including a Dhaka address with no area on it -- is charged as outside Dhaka.
 * ---------------------------------------------------------------------------
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** The Dhaka district's WooCommerce state code. */
define( 'GEDU_DHAKA_STATE', 'BD-13' );

/**
 * The only area that is inside the city. Compared lower-cased and trimmed, so
 * "dhaka sadar" typed in wp-admin counts, but "Dhaka" on its own does not --
 * an address that does not say Dhaka Sadar is not treated as if it did.
 */
define( 'GEDU_DHAKA_INSIDE_AREA', 'dhaka sadar' );

/**
 * Stand-in state for the outlying upazilas, used only while shipping is priced.
 *
 * Any district but Dhaka falls to the outside-Dhaka zone; Gazipur is the
 * neighbour. Nothing outside zone matching ever sees this value.
 */
define( 'GEDU_DHAKA_OUTSIDE_STATE', 'BD-18' );

/**
 * Send the outlying areas through the outside-Dhaka zone.
 *
 * Rewriting the package's destination rather than repricing the rate that came
 * back: the outside-Dhaka zone already holds the right cost and the same
 * free-delivery threshold, so the charge stays in the one place the shop owner
 * edits it. Only the shipping package is touched -- the order still records the
 * address the customer actually gave.
 */
add_filter(
	'woocommerce_cart_shipping_packages',
	function ( $packages ) {
		foreach ( $packages as $key => $package ) {
			$destination = isset( $package['destination'] ) ? $package['destination'] : array();
			if ( GEDU_DHAKA_STATE !== ( isset( $destination['state'] ) ? $destination['state'] : '' ) ) {
				continue;
			}

			$city = strtolower( trim( isset( $destination['city'] ) ? $destination['city'] : '' ) );
			if ( GEDU_DHAKA_INSIDE_AREA === $city ) {
				continue;
			}

			$packages[ $key ]['destination']['state'] = GEDU_DHAKA_OUTSIDE_STATE;
		}

		return $packages;
	}
);
