<?php
/**
 * Plugin Name: GeduShop Auto Deploy
 * Description: Rebuilds the storefront when the catalogue changes, so a product published here appears on gedushop.com in minutes instead of waiting for the three-hourly rebuild.
 * Version:     1.0.0
 * Author:      GeduShop
 *
 * The storefront is a static export deployed by GitHub Actions: listing pages
 * fetch live from the Store API, but a product's own page is an HTML file
 * written at build time. A product published here therefore shows up in /shop
 * straight away and has no page of its own until the next build.
 *
 * That workflow already rebuilds every three hours, and already listens for a
 * repository_dispatch of type "rebuild". This plugin sends that dispatch the
 * moment the catalogue changes, turning "within three hours" into "within a
 * few minutes".
 *
 * @package GeduShop
 */

defined( 'ABSPATH' ) || exit;

define( 'GEDU_DEPLOY_REPO_OPTION', 'gedu_deploy_repo' );
define( 'GEDU_DEPLOY_TOKEN_OPTION', 'gedu_deploy_token' );
define( 'GEDU_DEPLOY_LOG_OPTION', 'gedu_deploy_last' );
define( 'GEDU_DEPLOY_EVENT', 'gedu_deploy_run' );

/** The event_type the deploy workflow listens for. */
define( 'GEDU_DEPLOY_DISPATCH_TYPE', 'rebuild' );

/**
 * How long to wait before asking for a build.
 *
 * Not a delay for its own sake: saving one product touches it several times in
 * a row — the post, then the price, then the stock — and publishing a combo
 * touches its components too. Each of those would otherwise start its own
 * build. Everything inside this window collapses into one.
 */
define( 'GEDU_DEPLOY_DEBOUNCE', 180 );

function gedu_deploy_configured() {
	return get_option( GEDU_DEPLOY_REPO_OPTION ) && get_option( GEDU_DEPLOY_TOKEN_OPTION );
}

/* ===========================================================================
 * Triggering
 * ======================================================================== */

/** Queue a build, unless one is already queued. */
function gedu_deploy_queue( $reason = '' ) {
	if ( ! gedu_deploy_configured() ) {
		return;
	}
	if ( wp_next_scheduled( GEDU_DEPLOY_EVENT ) ) {
		return;
	}
	wp_schedule_single_event( time() + GEDU_DEPLOY_DEBOUNCE, GEDU_DEPLOY_EVENT );
	update_option(
		GEDU_DEPLOY_LOG_OPTION,
		array(
			'state'  => 'queued',
			'reason' => $reason,
			'at'     => time(),
		),
		false
	);
}

/**
 * A product appeared, changed, or went away.
 *
 * Every save of a published product counts, not only the moment it is first
 * published. Renaming one changes its slug, and the old page would otherwise
 * keep standing while the new address has none.
 */
add_action(
	'transition_post_status',
	function ( $new_status, $old_status, $post ) {
		if ( 'product' !== $post->post_type ) {
			return;
		}
		// Autosaves and revisions are not the catalogue changing.
		if ( wp_is_post_autosave( $post ) || wp_is_post_revision( $post ) ) {
			return;
		}
		// A draft edited into another draft changes nothing that is published,
		// and somebody working through a batch of drafts should not be
		// rebuilding the site between each one.
		if ( 'publish' !== $new_status && 'publish' !== $old_status ) {
			return;
		}
		gedu_deploy_queue( sprintf( '%s (%s to %s)', $post->post_title, $old_status, $new_status ) );
	},
	10,
	3
);

add_action(
	'before_delete_post',
	function ( $post_id ) {
		if ( 'product' === get_post_type( $post_id ) ) {
			gedu_deploy_queue( 'a product was deleted' );
		}
	}
);

/* ===========================================================================
 * Asking GitHub for a build
 * ======================================================================== */

/**
 * POST a repository_dispatch.
 *
 * Returns a short human sentence describing what happened, which is what the
 * settings screen shows. A 204 is success; GitHub returns no body for it.
 */
function gedu_deploy_dispatch() {
	$repo  = get_option( GEDU_DEPLOY_REPO_OPTION );
	$token = get_option( GEDU_DEPLOY_TOKEN_OPTION );
	if ( ! $repo || ! $token ) {
		return array( 'failed', 'not configured' );
	}

	$response = wp_remote_post(
		'https://api.github.com/repos/' . $repo . '/dispatches',
		array(
			'timeout' => 20,
			'headers' => array(
				'Accept'               => 'application/vnd.github+json',
				'Authorization'        => 'Bearer ' . $token,
				'X-GitHub-Api-Version' => '2022-11-28',
				'Content-Type'         => 'application/json',
				'User-Agent'           => 'GeduShop-Auto-Deploy',
			),
			'body'    => wp_json_encode( array( 'event_type' => GEDU_DEPLOY_DISPATCH_TYPE ) ),
		)
	);

	if ( is_wp_error( $response ) ) {
		return array( 'failed', $response->get_error_message() );
	}

	$code = (int) wp_remote_retrieve_response_code( $response );
	if ( 204 === $code ) {
		return array( 'sent', 'GitHub accepted it' );
	}
	// 401/403 is a bad or under-scoped token, 404 is usually the repo name (a
	// private repo the token cannot see returns 404, not 403). Say the number
	// rather than guessing, but say enough to start looking.
	$body    = wp_remote_retrieve_body( $response );
	$decoded = json_decode( $body, true );
	$message = isset( $decoded['message'] ) ? $decoded['message'] : '';
	return array( 'failed', trim( 'HTTP ' . $code . ' ' . $message ) );
}

add_action(
	GEDU_DEPLOY_EVENT,
	function () {
		$previous            = get_option( GEDU_DEPLOY_LOG_OPTION, array() );
		list( $state, $detail ) = gedu_deploy_dispatch();
		update_option(
			GEDU_DEPLOY_LOG_OPTION,
			array(
				'state'  => $state,
				'reason' => isset( $previous['reason'] ) ? $previous['reason'] : '',
				'detail' => $detail,
				'at'     => time(),
			),
			false
		);
	}
);

/* ===========================================================================
 * Settings
 * ======================================================================== */

add_action(
	'admin_menu',
	function () {
		add_options_page(
			__( 'GeduShop Auto Deploy', 'gedushop-deploy' ),
			__( 'GeduShop Deploy', 'gedushop-deploy' ),
			'manage_options',
			'gedushop-deploy',
			'gedu_deploy_settings_page'
		);
	}
);

add_action(
	'admin_init',
	function () {
		register_setting(
			'gedu_deploy',
			GEDU_DEPLOY_REPO_OPTION,
			array(
				'type'              => 'string',
				'sanitize_callback' => function ( $value ) {
					$value = trim( (string) $value );
					// owner/repo, nothing else. A pasted full URL would 404
					// every time with nothing to explain why.
					return preg_match( '#^[\w.-]+/[\w.-]+$#', $value ) ? $value : '';
				},
				'default'           => '',
			)
		);
		register_setting(
			'gedu_deploy',
			GEDU_DEPLOY_TOKEN_OPTION,
			array(
				'type'              => 'string',
				'sanitize_callback' => function ( $value ) {
					$value = trim( (string) $value );
					// An unchanged password field posts back the mask, which
					// must not be saved over the real token.
					if ( '' !== $value && false !== strpos( $value, '•' ) ) {
						return get_option( GEDU_DEPLOY_TOKEN_OPTION );
					}
					return sanitize_text_field( $value );
				},
				'default'           => '',
			)
		);
	}
);

function gedu_deploy_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	// A "build now" button, for when somebody wants the site rebuilt without
	// pretending to edit a product.
	if (
		isset( $_POST['gedu_deploy_now'], $_POST['gedu_deploy_nonce'] )
		&& wp_verify_nonce( sanitize_key( wp_unslash( $_POST['gedu_deploy_nonce'] ) ), 'gedu_deploy_now' )
	) {
		wp_clear_scheduled_hook( GEDU_DEPLOY_EVENT );
		list( $state, $detail ) = gedu_deploy_dispatch();
		update_option(
			GEDU_DEPLOY_LOG_OPTION,
			array(
				'state'  => $state,
				'reason' => 'asked for by hand',
				'detail' => $detail,
				'at'     => time(),
			),
			false
		);
		printf(
			'<div class="notice notice-%s"><p>%s</p></div>',
			'sent' === $state ? 'success' : 'error',
			esc_html( ucfirst( $state ) . ' — ' . $detail )
		);
	}

	$last   = get_option( GEDU_DEPLOY_LOG_OPTION, array() );
	$queued = wp_next_scheduled( GEDU_DEPLOY_EVENT );
	$ready  = gedu_deploy_configured();
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'GeduShop Auto Deploy', 'gedushop-deploy' ); ?></h1>
		<p>
			<?php esc_html_e( 'The storefront is a static site built by GitHub Actions. A product published here has no page of its own until the next build. Filling this in asks for that build straight away, instead of waiting for the three-hourly one.', 'gedushop-deploy' ); ?>
		</p>

		<form method="post" action="options.php">
			<?php settings_fields( 'gedu_deploy' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row">
						<label for="gedu-deploy-repo"><?php esc_html_e( 'Repository', 'gedushop-deploy' ); ?></label>
					</th>
					<td>
						<input
							type="text"
							id="gedu-deploy-repo"
							name="<?php echo esc_attr( GEDU_DEPLOY_REPO_OPTION ); ?>"
							value="<?php echo esc_attr( get_option( GEDU_DEPLOY_REPO_OPTION ) ); ?>"
							class="regular-text code"
							placeholder="owner/repo"
						/>
						<p class="description">
							<?php esc_html_e( 'Just owner/repo — for example mdraselswe/gedushop-frontend. Not the full URL.', 'gedushop-deploy' ); ?>
						</p>
					</td>
				</tr>
				<tr>
					<th scope="row">
						<label for="gedu-deploy-token"><?php esc_html_e( 'GitHub token', 'gedushop-deploy' ); ?></label>
					</th>
					<td>
						<input
							type="password"
							id="gedu-deploy-token"
							name="<?php echo esc_attr( GEDU_DEPLOY_TOKEN_OPTION ); ?>"
							value="<?php echo get_option( GEDU_DEPLOY_TOKEN_OPTION ) ? '••••••••••••' : ''; ?>"
							class="regular-text code"
							autocomplete="off"
						/>
						<p class="description">
							<?php esc_html_e( 'A fine-grained personal access token limited to this one repository, with Contents: read and write. Treat it as a password.', 'gedushop-deploy' ); ?>
						</p>
					</td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>

		<h2><?php esc_html_e( 'Status', 'gedushop-deploy' ); ?></h2>
		<table class="widefat striped" style="max-width:44rem">
			<tbody>
				<tr>
					<td><?php esc_html_e( 'Auto-deploy', 'gedushop-deploy' ); ?></td>
					<td><?php echo $ready ? esc_html__( 'On', 'gedushop-deploy' ) : esc_html__( 'Off, fill in both fields above', 'gedushop-deploy' ); ?></td>
				</tr>
				<tr>
					<td><?php esc_html_e( 'Build waiting', 'gedushop-deploy' ); ?></td>
					<td>
						<?php
						echo $queued
							? esc_html( sprintf( /* translators: %s: human readable time */ __( 'yes, in about %s', 'gedushop-deploy' ), human_time_diff( time(), $queued ) ) )
							: esc_html__( 'no', 'gedushop-deploy' );
						?>
					</td>
				</tr>
				<tr>
					<td><?php esc_html_e( 'Last result', 'gedushop-deploy' ); ?></td>
					<td>
						<?php
						if ( empty( $last['at'] ) ) {
							esc_html_e( 'never run', 'gedushop-deploy' );
						} else {
							echo esc_html(
								sprintf(
									'%s (%s), %s ago%s',
									isset( $last['state'] ) ? $last['state'] : '',
									isset( $last['detail'] ) ? $last['detail'] : '',
									human_time_diff( (int) $last['at'], time() ),
									! empty( $last['reason'] ) ? ' — ' . $last['reason'] : ''
								)
							);
						}
						?>
					</td>
				</tr>
			</tbody>
		</table>

		<form method="post" style="margin-top:1rem">
			<?php wp_nonce_field( 'gedu_deploy_now', 'gedu_deploy_nonce' ); ?>
			<button type="submit" name="gedu_deploy_now" value="1" class="button button-secondary" <?php disabled( ! $ready ); ?>>
				<?php esc_html_e( 'Build the site now', 'gedushop-deploy' ); ?>
			</button>
		</form>
	</div>
	<?php
}

register_deactivation_hook(
	__FILE__,
	function () {
		wp_clear_scheduled_hook( GEDU_DEPLOY_EVENT );
	}
);
