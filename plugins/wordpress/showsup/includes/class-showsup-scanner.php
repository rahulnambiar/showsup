<?php
/**
 * Handles scan triggers and result storage.
 */

defined( 'ABSPATH' ) || exit;

class ShowsUp_Scanner {

	/** Option keys */
	const OPT_RESULTS   = 'showsup_scan_results';
	const OPT_LAST_SCAN = 'showsup_last_scan';
	const OPT_SCAN_ID   = 'showsup_last_scan_id';
	const OPT_STATUS    = 'showsup_scan_status'; // 'idle' | 'scanning' | 'error'

	// ── Public ────────────────────────────────────────────────────────────────

	/**
	 * Trigger a scan and store results.
	 * Returns the scan data array or WP_Error.
	 *
	 * @return array|WP_Error
	 */
	public function trigger_scan(): array|WP_Error {
		update_option( self::OPT_STATUS, 'scanning' );

		$api  = new ShowsUp_API();
		if ( ! $api->is_configured() ) {
			update_option( self::OPT_STATUS, 'error' );
			return new WP_Error( 'no_token', __( 'No API token configured.', 'showsup' ) );
		}

		$settings = get_option( 'showsup_settings', array() );
		$domain   = $this->site_domain();
		$brand    = $settings['brand_name'] ?? get_bloginfo( 'name' );
		$category = $settings['category']   ?? 'Other';
		$regions  = $settings['regions']    ?? array( 'global' );
		$depth    = $settings['scan_depth'] ?? 'standard';

		$result = $api->scan( array(
			'brand'    => $brand,
			'url'      => home_url(),
			'category' => $category,
			'regions'  => $regions,
			'depth'    => $depth,
		) );

		if ( is_wp_error( $result ) ) {
			update_option( self::OPT_STATUS, 'error' );
			return $result;
		}

		// Store results
		update_option( self::OPT_RESULTS,   $result );
		update_option( self::OPT_LAST_SCAN, time() );
		update_option( self::OPT_STATUS,    'idle' );

		if ( ! empty( $result['scan_id'] ) ) {
			update_option( self::OPT_SCAN_ID, $result['scan_id'] );
		}

		// Email notification if enabled
		$this->maybe_send_notification( $result );

		return $result;
	}

	/** Returns the latest stored scan results or null. */
	public function get_results(): ?array {
		$r = get_option( self::OPT_RESULTS );
		return is_array( $r ) ? $r : null;
	}

	/** Returns the overall score, or null if no scan. */
	public function get_score(): ?int {
		$r = $this->get_results();
		return isset( $r['overall_score'] ) ? (int) $r['overall_score'] : null;
	}

	/** Returns human-readable "Last scanned X ago" string. */
	public function last_scanned_label(): string {
		$ts = (int) get_option( self::OPT_LAST_SCAN, 0 );
		if ( ! $ts ) {
			return __( 'Never', 'showsup' );
		}
		return human_time_diff( $ts ) . ' ' . __( 'ago', 'showsup' );
	}

	/** Returns the current scan status. */
	public function get_status(): string {
		return get_option( self::OPT_STATUS, 'idle' );
	}

	// ── Private ───────────────────────────────────────────────────────────────

	private function site_domain(): string {
		return wp_parse_url( home_url(), PHP_URL_HOST ) ?? '';
	}

	private function maybe_send_notification( array $result ): void {
		$settings = get_option( 'showsup_settings', array() );
		if ( empty( $settings['email_notifications'] ) ) {
			return;
		}

		$score = $result['overall_score'] ?? 0;
		$brand = get_bloginfo( 'name' );
		$admin = get_option( 'admin_email' );

		$subject = sprintf( __( '[ShowsUp] New scan results for %s — Score: %d/100', 'showsup' ), $brand, $score );
		$message = sprintf(
			__( "Your latest AI visibility scan for %s is complete.\n\nShowsUp Score: %d/100\n\nView full report: %s", 'showsup' ),
			$brand,
			$score,
			admin_url( 'admin.php?page=showsup' )
		);

		wp_mail( $admin, $subject, $message );
	}
}
