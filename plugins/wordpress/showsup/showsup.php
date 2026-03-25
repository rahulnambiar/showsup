<?php
/**
 * Plugin Name: ShowsUp — AI Visibility & AEO Agent
 * Plugin URI:  https://showsup.co
 * Description: Scan AI visibility across ChatGPT, Claude & Gemini. Auto-deploy llms.txt, inject schema markup, and get actionable fixes to improve how AI describes your brand.
 * Version:     1.0.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author:      ShowsUp
 * Author URI:  https://showsup.co
 * License:     MIT
 * Text Domain: showsup
 * Domain Path: /languages
 */

defined( 'ABSPATH' ) || exit;

// ── Constants ──────────────────────────────────────────────────────────────────

define( 'SHOWSUP_VERSION',  '1.0.0' );
define( 'SHOWSUP_PLUGIN_FILE', __FILE__ );
define( 'SHOWSUP_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'SHOWSUP_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'SHOWSUP_CLOUD_URL',  'https://showsup.co' );

// ── Includes ───────────────────────────────────────────────────────────────────

require_once SHOWSUP_PLUGIN_DIR . 'includes/class-showsup-api.php';
require_once SHOWSUP_PLUGIN_DIR . 'includes/class-showsup-scanner.php';
require_once SHOWSUP_PLUGIN_DIR . 'includes/class-showsup-llmstxt.php';
require_once SHOWSUP_PLUGIN_DIR . 'includes/class-showsup-schema.php';
require_once SHOWSUP_PLUGIN_DIR . 'includes/class-showsup-admin.php';

// ── Boot ───────────────────────────────────────────────────────────────────────

function showsup_init() {
	new ShowsUp_Admin();
	new ShowsUp_Schema();
	new ShowsUp_LLMsTxt();
}
add_action( 'plugins_loaded', 'showsup_init' );

// ── Activation / Deactivation ─────────────────────────────────────────────────

register_activation_hook( __FILE__, 'showsup_activate' );
function showsup_activate() {
	// Schedule weekly auto-scan
	if ( ! wp_next_scheduled( 'showsup_auto_scan' ) ) {
		$freq = get_option( 'showsup_auto_scan_freq', 'weekly' );
		if ( 'off' !== $freq ) {
			wp_schedule_event( time(), $freq, 'showsup_auto_scan' );
		}
	}
	// Schedule weekly llms.txt refresh
	if ( ! wp_next_scheduled( 'showsup_refresh_llmstxt' ) ) {
		wp_schedule_event( time(), 'weekly', 'showsup_refresh_llmstxt' );
	}

	// Flush rewrite rules so /llms.txt route resolves
	flush_rewrite_rules();
}

register_deactivation_hook( __FILE__, 'showsup_deactivate' );
function showsup_deactivate() {
	wp_clear_scheduled_hook( 'showsup_auto_scan' );
	wp_clear_scheduled_hook( 'showsup_refresh_llmstxt' );
	flush_rewrite_rules();
}

// ── REST API (for Gutenberg sidebar) ──────────────────────────────────────────

add_action( 'rest_api_init', 'showsup_register_rest_routes' );
function showsup_register_rest_routes() {
	register_rest_route( 'showsup/v1', '/status', array(
		'methods'             => 'GET',
		'callback'            => 'showsup_rest_status',
		'permission_callback' => function () { return current_user_can( 'edit_posts' ); },
	) );

	register_rest_route( 'showsup/v1', '/scan', array(
		'methods'             => 'POST',
		'callback'            => 'showsup_rest_scan',
		'permission_callback' => function () { return current_user_can( 'manage_options' ); },
	) );

	register_rest_route( 'showsup/v1', '/llmstxt/deploy', array(
		'methods'             => 'POST',
		'callback'            => 'showsup_rest_deploy_llmstxt',
		'permission_callback' => function () { return current_user_can( 'manage_options' ); },
	) );
}

function showsup_rest_status(): WP_REST_Response {
	$scanner = new ShowsUp_Scanner();
	$llmstxt = new ShowsUp_LLMsTxt();
	$ts      = (int) get_option( ShowsUp_LLMsTxt::OPT_DEPLOYED_AT, 0 );
	return new WP_REST_Response( array(
		'score'              => $scanner->get_score(),
		'last_scan'          => $scanner->last_scanned_label(),
		'scan_status'        => $scanner->get_status(),
		'llmstxt_deployed'   => $llmstxt->is_deployed(),
		'llmstxt_deployed_at' => $ts ? human_time_diff( $ts ) . ' ago' : '',
	), 200 );
}

function showsup_rest_scan(): WP_REST_Response|WP_Error {
	$scanner = new ShowsUp_Scanner();
	$result  = $scanner->trigger_scan();
	if ( is_wp_error( $result ) ) {
		return new WP_REST_Response( array( 'message' => $result->get_error_message() ), 400 );
	}
	$llmstxt = new ShowsUp_LLMsTxt();
	$llmstxt->generate_and_deploy( $result );
	return new WP_REST_Response( array(
		'score'     => $result['overall_score'] ?? null,
		'last_scan' => $scanner->last_scanned_label(),
	), 200 );
}

function showsup_rest_deploy_llmstxt(): WP_REST_Response {
	$llmstxt = new ShowsUp_LLMsTxt();
	$llmstxt->generate_and_deploy();
	$ts = (int) get_option( ShowsUp_LLMsTxt::OPT_DEPLOYED_AT, 0 );
	return new WP_REST_Response( array(
		'deployed'    => true,
		'deployed_at' => $ts ? human_time_diff( $ts ) . ' ago' : '',
	), 200 );
}

// ── Gutenberg block editor sidebar ────────────────────────────────────────────

add_action( 'enqueue_block_editor_assets', 'showsup_enqueue_editor_assets' );
function showsup_enqueue_editor_assets() {
	if ( ! current_user_can( 'edit_posts' ) ) {
		return;
	}
	wp_enqueue_script(
		'showsup-editor-sidebar',
		SHOWSUP_PLUGIN_URL . 'blocks/editor-sidebar.js',
		array( 'wp-plugins', 'wp-edit-post', 'wp-element', 'wp-components', 'wp-api-fetch', 'wp-i18n' ),
		SHOWSUP_VERSION,
		true
	);
}

// ── Cron handlers ─────────────────────────────────────────────────────────────

add_action( 'showsup_auto_scan', 'showsup_run_auto_scan' );
function showsup_run_auto_scan() {
	$scanner = new ShowsUp_Scanner();
	$scanner->trigger_scan();
}

add_action( 'showsup_refresh_llmstxt', 'showsup_run_llmstxt_refresh' );
function showsup_run_llmstxt_refresh() {
	$llms = new ShowsUp_LLMsTxt();
	$llms->generate_and_deploy();
}
