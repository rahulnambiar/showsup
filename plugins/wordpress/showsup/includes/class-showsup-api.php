<?php
/**
 * ShowsUp Cloud API client.
 * Wraps all HTTP calls to the ShowsUp REST API v1.
 */

defined( 'ABSPATH' ) || exit;

class ShowsUp_API {

	/** @var string */
	private $base_url;

	/** @var string */
	private $token;

	public function __construct() {
		$settings        = get_option( 'showsup_settings', array() );
		$this->base_url  = rtrim( $settings['cloud_url'] ?? SHOWSUP_CLOUD_URL, '/' );
		$this->token     = $settings['api_token'] ?? '';
	}

	// ── Public methods ─────────────────────────────────────────────────────────

	/** Returns true if a token is configured. */
	public function is_configured(): bool {
		return ! empty( $this->token );
	}

	/**
	 * Trigger a scan for the current site.
	 * Returns the full scan result or WP_Error.
	 *
	 * @param array $args  brand, category, niche, competitors, regions, depth
	 * @return array|WP_Error
	 */
	public function scan( array $args ) {
		return $this->post( '/api/v1/scan', $args );
	}

	/**
	 * Get the latest scan score for a domain.
	 *
	 * @param string $domain
	 * @return array|WP_Error
	 */
	public function get_score( string $domain ) {
		return $this->get( '/api/v1/score', array( 'domain' => $domain ) );
	}

	/**
	 * Get full scan details.
	 *
	 * @param string $scan_id
	 * @return array|WP_Error
	 */
	public function get_scan( string $scan_id ) {
		return $this->get( "/api/v1/scan/{$scan_id}" );
	}

	/**
	 * Generate fixes for a scan.
	 *
	 * @param array $args  brand, url, category, etc.
	 * @return array|WP_Error
	 */
	public function generate_fixes( array $args ) {
		return $this->post( '/api/v1/fix', $args );
	}

	/**
	 * Chat with AI Analyst about a scan.
	 *
	 * @param string $domain
	 * @param array  $messages  [{role, content}, ...]
	 * @param bool   $stream
	 * @return array|WP_Error
	 */
	public function chat( string $domain, array $messages, bool $stream = false ) {
		return $this->post( '/api/v1/chat', array(
			'domain'   => $domain,
			'messages' => $messages,
			'stream'   => $stream,
		) );
	}

	// ── HTTP helpers ──────────────────────────────────────────────────────────

	private function headers(): array {
		return array(
			'Authorization' => 'Bearer ' . $this->token,
			'Content-Type'  => 'application/json',
			'User-Agent'    => 'ShowsUp-WP/' . SHOWSUP_VERSION,
		);
	}

	/**
	 * @return array|WP_Error
	 */
	private function get( string $path, array $params = array() ) {
		$url = add_query_arg( $params, $this->base_url . $path );
		$res = wp_remote_get( $url, array(
			'headers' => $this->headers(),
			'timeout' => 30,
		) );
		return $this->parse( $res );
	}

	/**
	 * @return array|WP_Error
	 */
	private function post( string $path, array $body = array() ) {
		$res = wp_remote_post( $this->base_url . $path, array(
			'headers' => $this->headers(),
			'body'    => wp_json_encode( $body ),
			'timeout' => 120,
		) );
		return $this->parse( $res );
	}

	/**
	 * @param array|WP_Error $res
	 * @return array|WP_Error
	 */
	private function parse( $res ) {
		if ( is_wp_error( $res ) ) {
			return $res;
		}

		$code = wp_remote_retrieve_response_code( $res );
		$body = json_decode( wp_remote_retrieve_body( $res ), true );

		if ( $code === 401 ) {
			return new WP_Error( 'unauthorized', __( 'Invalid API token. Check your ShowsUp settings.', 'showsup' ) );
		}
		if ( $code === 402 ) {
			return new WP_Error( 'tokens', __( 'Insufficient tokens. Top up at showsup.co.', 'showsup' ) );
		}
		if ( $code >= 400 ) {
			$msg = $body['error'] ?? __( 'API error', 'showsup' );
			return new WP_Error( 'api_error', $msg );
		}

		return $body ?? array();
	}
}
