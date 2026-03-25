<?php
/**
 * Admin UI: dashboard widget, 3-tab admin page, AJAX handlers.
 */

defined( 'ABSPATH' ) || exit;

class ShowsUp_Admin {

	public function __construct() {
		// Admin menu + pages
		add_action( 'admin_menu',            array( $this, 'add_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );

		// Dashboard widget
		add_action( 'wp_dashboard_setup', array( $this, 'register_dashboard_widget' ) );

		// Settings
		add_action( 'admin_init', array( $this, 'register_settings' ) );

		// AJAX handlers (logged-in users only)
		add_action( 'wp_ajax_showsup_trigger_scan',    array( $this, 'ajax_trigger_scan' ) );
		add_action( 'wp_ajax_showsup_get_status',      array( $this, 'ajax_get_status' ) );
		add_action( 'wp_ajax_showsup_deploy_llmstxt',  array( $this, 'ajax_deploy_llmstxt' ) );
		add_action( 'wp_ajax_showsup_get_fixes',       array( $this, 'ajax_get_fixes' ) );
		add_action( 'wp_ajax_showsup_save_settings',   array( $this, 'ajax_save_settings' ) );
		add_action( 'wp_ajax_showsup_apply_fix',       array( $this, 'ajax_apply_fix' ) );
	}

	// ── Admin Menu ────────────────────────────────────────────────────────────

	public function add_menu(): void {
		add_menu_page(
			__( 'ShowsUp — AI Visibility', 'showsup' ),
			__( 'ShowsUp', 'showsup' ),
			'manage_options',
			'showsup',
			array( $this, 'render_page' ),
			'data:image/svg+xml;base64,' . base64_encode( '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>' ),
			80
		);
	}

	public function render_page(): void {
		$tab = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'overview'; // phpcs:ignore
		$scanner  = new ShowsUp_Scanner();
		$llmstxt  = new ShowsUp_LLMsTxt();
		$settings = get_option( 'showsup_settings', array() );

		?>
		<div class="wrap showsup-wrap">
			<div class="showsup-header">
				<h1><span class="showsup-logo">ShowsUp</span> <span class="showsup-tagline">AI Visibility</span></h1>
				<?php $score = $scanner->get_score(); ?>
				<?php if ( null !== $score ) : ?>
					<div class="showsup-header-score">
						<span class="showsup-score showsup-score--<?php echo esc_attr( $this->score_class( $score ) ); ?>">
							<?php echo esc_html( $score ); ?>/100
						</span>
						<span class="showsup-score-label"><?php esc_html_e( 'AI Visibility Score', 'showsup' ); ?></span>
					</div>
				<?php endif; ?>
			</div>

			<nav class="showsup-nav-tab-wrapper nav-tab-wrapper">
				<?php foreach ( array(
					'overview' => __( 'Overview', 'showsup' ),
					'fixes'    => __( 'AI Fixes', 'showsup' ),
					'settings' => __( 'Settings', 'showsup' ),
				) as $slug => $label ) : ?>
					<a href="<?php echo esc_url( admin_url( 'admin.php?page=showsup&tab=' . $slug ) ); ?>"
					   class="nav-tab <?php echo $tab === $slug ? 'nav-tab-active' : ''; ?>">
						<?php echo esc_html( $label ); ?>
					</a>
				<?php endforeach; ?>
			</nav>

			<div class="showsup-tab-content">
				<?php
				switch ( $tab ) {
					case 'fixes':
						include SHOWSUP_PLUGIN_DIR . 'admin/views/fixes.php';
						break;
					case 'settings':
						include SHOWSUP_PLUGIN_DIR . 'admin/views/settings.php';
						break;
					default:
						include SHOWSUP_PLUGIN_DIR . 'admin/views/dashboard.php';
						break;
				}
				?>
			</div>
		</div>
		<?php
	}

	// ── Assets ────────────────────────────────────────────────────────────────

	public function enqueue_assets( string $hook ): void {
		if ( strpos( $hook, 'showsup' ) === false ) {
			return;
		}

		wp_enqueue_style(
			'showsup-admin',
			SHOWSUP_PLUGIN_URL . 'admin/css/showsup-admin.css',
			array(),
			SHOWSUP_VERSION
		);

		wp_enqueue_script(
			'showsup-admin',
			SHOWSUP_PLUGIN_URL . 'admin/js/showsup-admin.js',
			array( 'jquery' ),
			SHOWSUP_VERSION,
			true
		);

		wp_localize_script( 'showsup-admin', 'ShowsUpAdmin', array(
			'ajaxUrl' => admin_url( 'admin-ajax.php' ),
			'nonce'   => wp_create_nonce( 'showsup_admin' ),
			'i18n'    => array(
				'scanning'     => __( 'Scanning…', 'showsup' ),
				'scanComplete' => __( 'Scan complete!', 'showsup' ),
				'scanError'    => __( 'Scan failed. Please try again.', 'showsup' ),
				'deploying'    => __( 'Deploying…', 'showsup' ),
				'deployed'     => __( 'Deployed!', 'showsup' ),
				'saving'       => __( 'Saving…', 'showsup' ),
				'saved'        => __( 'Settings saved!', 'showsup' ),
			),
		) );
	}

	// ── Dashboard Widget ──────────────────────────────────────────────────────

	public function register_dashboard_widget(): void {
		wp_add_dashboard_widget(
			'showsup_widget',
			__( 'ShowsUp — AI Visibility Score', 'showsup' ),
			array( $this, 'render_dashboard_widget' )
		);
	}

	public function render_dashboard_widget(): void {
		$scanner = new ShowsUp_Scanner();
		$score   = $scanner->get_score();
		$results = $scanner->get_results();
		$llmstxt = new ShowsUp_LLMsTxt();

		?>
		<div class="showsup-widget">
			<?php if ( null === $score ) : ?>
				<p><?php esc_html_e( 'No scan yet. Run your first AI visibility scan to see how ChatGPT, Claude & Gemini describe your brand.', 'showsup' ); ?></p>
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=showsup' ) ); ?>" class="button button-primary">
					<?php esc_html_e( 'Run First Scan', 'showsup' ); ?>
				</a>
			<?php else : ?>
				<div class="showsup-widget-score">
					<span class="showsup-big-score showsup-score--<?php echo esc_attr( $this->score_class( $score ) ); ?>">
						<?php echo esc_html( $score ); ?>
					</span>
					<span class="showsup-out-of">/100</span>
				</div>
				<p class="showsup-last-scan">
					<?php echo esc_html( $scanner->last_scanned_label() ); ?>
				</p>
				<?php if ( ! empty( $results['recommendations'] ) ) : ?>
					<p class="showsup-recs">
						<strong><?php echo esc_html( count( $results['recommendations'] ) ); ?></strong>
						<?php esc_html_e( 'improvement opportunities found', 'showsup' ); ?>
					</p>
				<?php endif; ?>
				<p>
					<strong><?php esc_html_e( 'llms.txt:', 'showsup' ); ?></strong>
					<?php if ( $llmstxt->is_deployed() ) : ?>
						<span class="showsup-badge showsup-badge--green"><?php esc_html_e( 'Deployed', 'showsup' ); ?></span>
					<?php else : ?>
						<span class="showsup-badge showsup-badge--gray"><?php esc_html_e( 'Not deployed', 'showsup' ); ?></span>
					<?php endif; ?>
				</p>
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=showsup' ) ); ?>" class="button">
					<?php esc_html_e( 'View Full Report', 'showsup' ); ?>
				</a>
			<?php endif; ?>
		</div>
		<?php
	}

	// ── Settings Registration ─────────────────────────────────────────────────

	public function register_settings(): void {
		register_setting( 'showsup_settings_group', 'showsup_settings', array(
			'sanitize_callback' => array( $this, 'sanitize_settings' ),
		) );
	}

	public function sanitize_settings( $input ): array {
		$clean = array();

		$text_fields = array( 'api_token', 'brand_name', 'category', 'cloud_url', 'contact_phone', 'twitter_url', 'linkedin_url', 'facebook_url', 'instagram_url' );
		foreach ( $text_fields as $field ) {
			if ( isset( $input[ $field ] ) ) {
				$clean[ $field ] = sanitize_text_field( $input[ $field ] );
			}
		}

		// Regions array
		if ( isset( $input['regions'] ) && is_array( $input['regions'] ) ) {
			$allowed_regions    = array( 'global', 'us', 'uk', 'eu', 'au', 'ca', 'in', 'sg' );
			$clean['regions']   = array_intersect( $input['regions'], $allowed_regions );
		}

		// Scan depth
		$allowed_depths     = array( 'quick', 'standard', 'deep' );
		$clean['scan_depth'] = in_array( $input['scan_depth'] ?? '', $allowed_depths, true )
			? $input['scan_depth']
			: 'standard';

		// Booleans
		foreach ( array( 'email_notifications', 'disable_schema', 'self_host_mode' ) as $bool ) {
			$clean[ $bool ] = ! empty( $input[ $bool ] );
		}

		return $clean;
	}

	// ── AJAX: Scan ────────────────────────────────────────────────────────────

	public function ajax_trigger_scan(): void {
		$this->verify_nonce();

		$scanner = new ShowsUp_Scanner();
		$result  = $scanner->trigger_scan();

		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array( 'message' => $result->get_error_message() ) );
		}

		// Also redeploy llms.txt with fresh data
		$llmstxt = new ShowsUp_LLMsTxt();
		$llmstxt->generate_and_deploy( $result );

		wp_send_json_success( array(
			'score'      => $result['overall_score'] ?? null,
			'last_scan'  => $scanner->last_scanned_label(),
			'rec_count'  => count( $result['recommendations'] ?? array() ),
		) );
	}

	public function ajax_get_status(): void {
		$this->verify_nonce();

		$scanner = new ShowsUp_Scanner();
		wp_send_json_success( array(
			'status'    => $scanner->get_status(),
			'score'     => $scanner->get_score(),
			'last_scan' => $scanner->last_scanned_label(),
		) );
	}

	// ── AJAX: llms.txt ────────────────────────────────────────────────────────

	public function ajax_deploy_llmstxt(): void {
		$this->verify_nonce();

		$llmstxt = new ShowsUp_LLMsTxt();
		$ok      = $llmstxt->generate_and_deploy();

		if ( $ok ) {
			wp_send_json_success( array( 'label' => $llmstxt->deployed_label() ) );
		} else {
			wp_send_json_error( array( 'message' => __( 'Could not deploy llms.txt.', 'showsup' ) ) );
		}
	}

	// ── AJAX: Fixes ───────────────────────────────────────────────────────────

	public function ajax_get_fixes(): void {
		$this->verify_nonce();

		$api    = new ShowsUp_API();
		$result = get_option( ShowsUp_Scanner::OPT_RESULTS );
		if ( empty( $result ) ) {
			wp_send_json_error( array( 'message' => __( 'No scan results yet.', 'showsup' ) ) );
		}

		$settings = get_option( 'showsup_settings', array() );
		$fixes    = $api->generate_fixes( array(
			'brand'    => $settings['brand_name'] ?? get_bloginfo( 'name' ),
			'url'      => home_url(),
			'category' => $settings['category'] ?? 'Other',
			'scan_id'  => get_option( ShowsUp_Scanner::OPT_SCAN_ID, '' ),
		) );

		if ( is_wp_error( $fixes ) ) {
			wp_send_json_error( array( 'message' => $fixes->get_error_message() ) );
		}

		wp_send_json_success( $fixes );
	}

	public function ajax_apply_fix(): void {
		$this->verify_nonce();

		$fix_type = sanitize_key( $_POST['fix_type'] ?? '' ); // phpcs:ignore
		$fix_data = $_POST['fix_data'] ?? array(); // phpcs:ignore

		switch ( $fix_type ) {
			case 'llmstxt':
				$llmstxt = new ShowsUp_LLMsTxt();
				$llmstxt->generate_and_deploy();
				wp_send_json_success( array( 'message' => __( 'llms.txt deployed.', 'showsup' ) ) );
				break;

			case 'schema':
				// Schema is auto-injected — just confirm it's enabled
				$settings                    = get_option( 'showsup_settings', array() );
				$settings['disable_schema']  = false;
				update_option( 'showsup_settings', $settings );
				wp_send_json_success( array( 'message' => __( 'Schema injection enabled.', 'showsup' ) ) );
				break;

			default:
				wp_send_json_error( array( 'message' => __( 'Unknown fix type.', 'showsup' ) ) );
		}
	}

	// ── AJAX: Settings ────────────────────────────────────────────────────────

	public function ajax_save_settings(): void {
		$this->verify_nonce();

		$input = $_POST['settings'] ?? array(); // phpcs:ignore
		if ( ! is_array( $input ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid data.', 'showsup' ) ) );
		}

		$clean = $this->sanitize_settings( $input );
		update_option( 'showsup_settings', $clean );

		// Update auto-scan schedule if frequency changed
		$freq = sanitize_key( $input['auto_scan_freq'] ?? 'weekly' );
		$this->update_cron_schedule( $freq );

		wp_send_json_success( array( 'message' => __( 'Settings saved.', 'showsup' ) ) );
	}

	// ── Helpers ───────────────────────────────────────────────────────────────

	private function verify_nonce(): void {
		if ( ! check_ajax_referer( 'showsup_admin', 'nonce', false ) || ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Unauthorized.', 'showsup' ) ), 403 );
		}
	}

	public function score_class( int $score ): string {
		if ( $score >= 70 ) return 'green';
		if ( $score >= 40 ) return 'amber';
		return 'red';
	}

	private function update_cron_schedule( string $freq ): void {
		update_option( 'showsup_auto_scan_freq', $freq );
		wp_clear_scheduled_hook( 'showsup_auto_scan' );
		if ( 'off' !== $freq ) {
			wp_schedule_event( time(), $freq, 'showsup_auto_scan' );
		}
	}
}
