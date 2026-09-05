<?php
/**
 * Plugin Name: GeduShop Headless SEO
 * Description: Keeps the WooCommerce backend out of search results; the public Next.js storefront is the only indexable site.
 * Version:     1.0.0
 * Author:      GeduShop
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The Store API, wp-admin, cron, webhooks and feeds do not render wp_head and
 * are not changed. Only public WordPress HTML receives these directives.
 */
add_filter(
	'wp_robots',
	function ( $robots ) {
		$robots['noindex'] = true;
		$robots['follow']  = true;
		unset( $robots['index'], $robots['nofollow'] );
		return $robots;
	},
	PHP_INT_MAX
);

/** Also cover crawlers that act on HTTP headers without parsing the page. */
add_action(
	'send_headers',
	function () {
		if ( is_admin() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
			return;
		}
		header( 'X-Robots-Tag: noindex, follow', true );
	}
);

/**
 * A backend sitemap advertises duplicate wp.gedushop.com URLs. The storefront
 * sitemap remains available at https://gedushop.com/sitemap.xml.
 */
add_filter( 'wp_sitemaps_enabled', '__return_false' );

