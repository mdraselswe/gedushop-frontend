<?php
/**
 * Plugin Name: GeduShop Security Bridge
 * Description: Rate limits public commerce endpoints, protects customer lookups, adds checkout idempotency, and reduces WordPress attack surface.
 * Version: 1.0.1
 * Requires PHP: 8.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const GEDU_SECURITY_VERSION = '1.0.1';

function gedu_security_request_key( WP_REST_Request $request ): string {
	$route = $request->get_route();
	$ip    = '';
	foreach ( array( 'HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR' ) as $server_key ) {
		if ( ! empty( $_SERVER[ $server_key ] ) ) {
			$ip = trim( explode( ',', sanitize_text_field( wp_unslash( $_SERVER[ $server_key ] ) ) )[0] );
			break;
		}
	}
	$parts = array( $route, 'ip:' . $ip );
	foreach ( array( 'phone', 'order_id', 'product_id', 'email' ) as $field ) {
		$value = (string) $request->get_param( $field );
		if ( '' !== $value ) {
			$parts[] = $field . ':' . strtolower( trim( $value ) );
		}
	}
	$billing = $request->get_param( 'billing_address' );
	if ( is_array( $billing ) && ! empty( $billing['phone'] ) ) {
		$parts[] = 'billing_phone:' . preg_replace( '/\D+/', '', (string) $billing['phone'] );
	}
	return hash_hmac( 'sha256', implode( '|', $parts ), wp_salt( 'nonce' ) );
}

function gedu_security_rate_limit( string $scope, string $identity, int $limit, int $window ): ?WP_Error {
	$bucket = (int) floor( time() / $window );
	$key    = 'gedu_rl_' . substr( hash( 'sha256', $scope . '|' . $identity . '|' . $bucket ), 0, 40 );
	$count  = (int) get_transient( $key ) + 1;
	set_transient( $key, $count, $window + 60 );

	if ( $count <= $limit ) {
		return null;
	}

	return new WP_Error(
		'gedu_rate_limited',
		'Too many attempts. Please wait and try again.',
		array( 'status' => 429 )
	);
}

function gedu_security_header( WP_REST_Request $request, string $name ): string {
	$value = trim( (string) $request->get_header( $name ) );
	return preg_match( '/^[A-Za-z0-9._:-]{16,128}$/', $value ) ? $value : '';
}

function gedu_security_order_token_hash( string $token ): string {
	return hash_hmac( 'sha256', $token, wp_salt( 'auth' ) );
}

function gedu_security_get_order_meta( int $order_id, string $key ) {
	if ( function_exists( 'wc_get_order' ) ) {
		$order = wc_get_order( $order_id );
		if ( $order ) {
			return $order->get_meta( $key, true );
		}
	}
	return get_post_meta( $order_id, $key, true );
}

function gedu_security_set_order_meta( int $order_id, string $key, $value ): void {
	if ( function_exists( 'wc_get_order' ) ) {
		$order = wc_get_order( $order_id );
		if ( $order ) {
			$order->update_meta_data( $key, $value );
			$order->save_meta_data();
			return;
		}
	}
	update_post_meta( $order_id, $key, $value );
}

function gedu_security_new_order_token( int $order_id ): string {
	$token = rtrim( strtr( base64_encode( random_bytes( 32 ) ), '+/', '-_' ), '=' );
	$hashes = gedu_security_get_order_meta( $order_id, '_gedu_access_token_hashes' );
	$hashes = is_array( $hashes ) ? $hashes : array();
	array_unshift( $hashes, gedu_security_order_token_hash( $token ) );
	gedu_security_set_order_meta( $order_id, '_gedu_access_token_hashes', array_slice( array_unique( $hashes ), 0, 5 ) );
	return $token;
}

function gedu_security_valid_order_token( int $order_id, string $token ): bool {
	if ( $order_id <= 0 || ! preg_match( '/^[A-Za-z0-9_-]{40,64}$/', $token ) ) {
		return false;
	}
	$wanted = gedu_security_order_token_hash( $token );
	$hashes = gedu_security_get_order_meta( $order_id, '_gedu_access_token_hashes' );
	$hashes = is_array( $hashes ) ? $hashes : array();
	$legacy = (string) gedu_security_get_order_meta( $order_id, '_gedu_access_token_hash' );
	if ( '' !== $legacy ) {
		$hashes[] = $legacy;
	}
	foreach ( $hashes as $stored ) {
		if ( is_string( $stored ) && hash_equals( $stored, $wanted ) ) {
			return true;
		}
	}
	return false;
}

/** Disable XML-RPC, including pingback and multicall discovery. */
add_filter( 'xmlrpc_enabled', '__return_false' );
add_filter( 'xmlrpc_methods', static fn(): array => array(), PHP_INT_MAX );
add_action(
	'init',
	static function (): void {
		if ( defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST ) {
			wp_die( 'XML-RPC is disabled.', 'Forbidden', array( 'response' => 403 ) );
		}
	},
	PHP_INT_MIN
);

add_filter(
	'rest_pre_dispatch',
	static function ( $result, WP_REST_Server $server, WP_REST_Request $request ) {
		$route  = $request->get_route();
		$method = strtoupper( $request->get_method() );

		/** Keep the endpoint available to authorised wp-admin screens only. */
		if ( preg_match( '#^/wp/v2/users(?:/|$)#', $route ) && ! current_user_can( 'list_users' ) ) {
			return new WP_Error( 'rest_no_route', 'No route was found matching the URL and request method.', array( 'status' => 404 ) );
		}

		if ( 'POST' === $method && '/wc/store/v1/checkout' === $route ) {
			$key = gedu_security_header( $request, 'x-gedu-idempotency-key' );
			if ( '' !== $key ) {
				$cache_key = 'gedu_checkout_' . substr( hash( 'sha256', $key ), 0, 40 );
				$cached    = get_transient( $cache_key );
				if ( is_array( $cached ) && isset( $cached['data'], $cached['status'] ) ) {
					$response = new WP_REST_Response( $cached['data'], (int) $cached['status'] );
					foreach ( (array) ( $cached['headers'] ?? array() ) as $name => $value ) {
						$response->header( $name, $value );
					}
					return $response;
				}
				$request->set_param( '_gedu_idempotency_cache_key', $cache_key );
			}
		}

		if ( 'POST' === $method && '/gedushop/v1/track' === $route ) {
			$order_id = absint( $request->get_param( 'order_id' ) );
			$token    = trim( (string) $request->get_param( 'access_token' ) );
			if ( '' !== $token && gedu_security_valid_order_token( $order_id, $token ) && function_exists( 'wc_get_order' ) ) {
				$order = wc_get_order( $order_id );
				if ( $order ) {
					$request->set_param( 'phone', $order->get_billing_phone() );
					$request->set_param( '_gedu_verified_access_token', $token );
				}
			}
		}

		$limits = array(
			'/gedushop/v1/track'           => array( 10, 10 * MINUTE_IN_SECONDS ),
			'/gedushop/v1/review'          => array( 5, HOUR_IN_SECONDS ),
			'/gedushop/v1/restock-request' => array( 8, HOUR_IN_SECONDS ),
			'/wc/store/v1/checkout'        => array( 10, 10 * MINUTE_IN_SECONDS ),
		);
		if ( 'POST' === $method && isset( $limits[ $route ] ) ) {
			list( $limit, $window ) = $limits[ $route ];
			$limited = gedu_security_rate_limit( $route, gedu_security_request_key( $request ), $limit, $window );
			if ( $limited ) {
				return $limited;
			}
		}

		if ( 'POST' === $method && '/gedushop/v1/review' === $route ) {
			$request->set_param( 'reviewer', sanitize_text_field( (string) $request->get_param( 'reviewer' ) ) );
			$request->set_param( 'email', sanitize_email( (string) $request->get_param( 'email' ) ) );
			$request->set_param( 'review', sanitize_textarea_field( (string) $request->get_param( 'review' ) ) );
			$photos = $request->get_param( 'photos' );
			if ( is_array( $photos ) ) {
				$photos = array_slice( $photos, 0, 3 );
				foreach ( $photos as $photo ) {
					if ( ! is_string( $photo ) || strlen( $photo ) > 3500000 || ! preg_match( '#^data:image/(?:jpeg|png|webp);base64,#', $photo ) ) {
						return new WP_Error( 'gedu_bad_review_photo', 'One of the review photos is not valid.', array( 'status' => 400 ) );
					}
					$binary = base64_decode( substr( $photo, strpos( $photo, ',' ) + 1 ), true );
					if ( false === $binary || strlen( $binary ) > 2500000 || false === @getimagesizefromstring( $binary ) ) {
						return new WP_Error( 'gedu_bad_review_photo', 'One of the review photos is not valid.', array( 'status' => 400 ) );
					}
				}
				$request->set_param( 'photos', $photos );
			}
		}

		return $result;
	},
	8,
	3
);

add_filter(
	'rest_post_dispatch',
	static function ( WP_HTTP_Response $response, WP_REST_Server $server, WP_REST_Request $request ): WP_HTTP_Response {
		$route  = $request->get_route();
		$status = $response->get_status();
		$data   = $response->get_data();

		if ( '/wc/store/v1/checkout' === $route && $status >= 200 && $status < 300 && is_array( $data ) ) {
			$order_id = absint( $data['order_id'] ?? 0 );
			if ( $order_id > 0 ) {
				$data['gedushop_access_token'] = gedu_security_new_order_token( $order_id );
				$response->set_data( $data );
			}

			$cache_key = (string) $request->get_param( '_gedu_idempotency_cache_key' );
			if ( str_starts_with( $cache_key, 'gedu_checkout_' ) ) {
				set_transient(
					$cache_key,
					array(
						'data'    => $response->get_data(),
						'status'  => $response->get_status(),
						'headers' => $response->get_headers(),
					),
					DAY_IN_SECONDS
				);
			}
		}

		if ( '/gedushop/v1/track' === $route && $status >= 200 && $status < 300 && is_array( $data ) ) {
			$order_id = absint( $data['id'] ?? $request->get_param( 'order_id' ) );
			$token    = (string) $request->get_param( '_gedu_verified_access_token' );
			if ( $order_id > 0 ) {
				$data['accessToken'] = '' !== $token ? $token : gedu_security_new_order_token( $order_id );
				$response->set_data( $data );
			}
		}

		if ( '/gedushop/v1/reviews' === $route && is_array( $data ) ) {
			foreach ( $data as &$review ) {
				if ( is_array( $review ) && isset( $review['review'] ) ) {
					$review['review'] = wp_kses_post( $review['review'] );
				}
			}
			unset( $review );
			$response->set_data( $data );
		}

		return $response;
	},
	20,
	3
);
