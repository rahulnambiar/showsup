<?php
/**
 * Generates and deploys llms.txt to the site root.
 *
 * The file is accessible at https://yoursite.com/llms.txt
 * via a rewrite rule (preferred) or direct file write.
 */

defined( 'ABSPATH' ) || exit;

class ShowsUp_LLMsTxt {

	const OPT_DEPLOYED    = 'showsup_llmstxt_deployed';
	const OPT_CONTENT     = 'showsup_llmstxt_content';
	const OPT_DEPLOYED_AT = 'showsup_llmstxt_deployed_at';

	public function __construct() {
		add_action( 'init',              array( $this, 'register_rewrite' ) );
		add_filter( 'query_vars',        array( $this, 'add_query_var' ) );
		add_action( 'template_redirect', array( $this, 'serve_llmstxt' ) );
	}

	// ── Rewrite / Serve ───────────────────────────────────────────────────────

	public function register_rewrite(): void {
		add_rewrite_rule( '^llms\.txt$', 'index.php?showsup_llmstxt=1', 'top' );
	}

	public function add_query_var( array $vars ): array {
		$vars[] = 'showsup_llmstxt';
		return $vars;
	}

	/** Serve llms.txt content through WordPress rewrite (no file write needed). */
	public function serve_llmstxt(): void {
		if ( ! get_query_var( 'showsup_llmstxt' ) ) {
			return;
		}

		$content = get_option( self::OPT_CONTENT, '' );
		if ( empty( $content ) ) {
			$content = $this->build_content();
		}

		header( 'Content-Type: text/plain; charset=utf-8' );
		header( 'Cache-Control: public, max-age=86400' );
		echo esc_textarea( $content );
		exit;
	}

	// ── Generator ─────────────────────────────────────────────────────────────

	/**
	 * Generate llms.txt content from site structure + scan data.
	 * Optionally enrich with ShowsUp API fixes.
	 */
	public function build_content( ?array $scan_result = null ): string {
		$brand       = get_bloginfo( 'name' );
		$description = get_bloginfo( 'description' );
		$url         = home_url();
		$settings    = get_option( 'showsup_settings', array() );
		$category    = $settings['category'] ?? 'Other';

		// Use scan data if available
		if ( null === $scan_result ) {
			$scan_result = get_option( ShowsUp_Scanner::OPT_RESULTS );
		}

		// ── Header ────────────────────────────────────────────────────────────
		$lines = array(
			"# {$brand}",
			'',
			"> {$description}",
			'',
			"- URL: {$url}",
			"- Category: {$category}",
		);

		// Add score if available
		if ( ! empty( $scan_result['overall_score'] ) ) {
			$lines[] = "- AI Visibility Score: {$scan_result['overall_score']}/100";
		}

		$lines[] = '';

		// ── Pages ─────────────────────────────────────────────────────────────
		$pages = get_pages( array(
			'post_status' => 'publish',
			'sort_column' => 'menu_order',
			'number'      => 50,
		) );

		if ( ! empty( $pages ) ) {
			$lines[] = '## Pages';
			$lines[] = '';
			foreach ( $pages as $page ) {
				$title   = $page->post_title;
				$excerpt = wp_trim_words( $page->post_content, 15, '...' );
				$link    = get_permalink( $page );
				$lines[] = "- [{$title}]({$link}): {$excerpt}";
			}
			$lines[] = '';
		}

		// ── Recent posts ──────────────────────────────────────────────────────
		$posts = get_posts( array(
			'posts_per_page' => 20,
			'post_status'    => 'publish',
			'orderby'        => 'date',
			'order'          => 'DESC',
		) );

		if ( ! empty( $posts ) ) {
			$lines[] = '## Recent Posts';
			$lines[] = '';
			foreach ( $posts as $post ) {
				$title   = $post->post_title;
				$excerpt = has_excerpt( $post ) ? get_the_excerpt( $post ) : wp_trim_words( $post->post_content, 15, '...' );
				$link    = get_permalink( $post );
				$lines[] = "- [{$title}]({$link}): {$excerpt}";
			}
			$lines[] = '';
		}

		// ── Categories ────────────────────────────────────────────────────────
		$cats = get_categories( array( 'hide_empty' => true, 'number' => 20 ) );
		if ( ! empty( $cats ) ) {
			$lines[] = '## Categories';
			$lines[] = '';
			foreach ( $cats as $cat ) {
				$link    = get_category_link( $cat->term_id );
				$lines[] = "- [{$cat->name}]({$link}): {$cat->description}";
			}
			$lines[] = '';
		}

		// ── Scan-derived gap queries (from ShowsUp) ───────────────────────────
		if ( ! empty( $scan_result['recommendations'] ) ) {
			$lines[] = '## What We Help With';
			$lines[] = '';
			foreach ( array_slice( $scan_result['recommendations'], 0, 10 ) as $rec ) {
				$lines[] = '- ' . ( $rec['title'] ?? '' );
			}
			$lines[] = '';
		}

		return implode( "\n", $lines );
	}

	/**
	 * Build content, store it, and write the physical file as a fallback.
	 */
	public function generate_and_deploy( ?array $scan_result = null ): bool {
		$content = $this->build_content( $scan_result );

		// Store content in option (served via rewrite rule)
		update_option( self::OPT_CONTENT,     $content );
		update_option( self::OPT_DEPLOYED,    true );
		update_option( self::OPT_DEPLOYED_AT, time() );

		// Also attempt to write a physical file (fallback for edge caches)
		$file = ABSPATH . 'llms.txt';
		if ( is_writable( ABSPATH ) || ( file_exists( $file ) && is_writable( $file ) ) ) {
			file_put_contents( $file, $content ); // phpcs:ignore
		}

		// Flush rewrite rules so route is active immediately
		flush_rewrite_rules();

		return true;
	}

	/** Returns current deploy status. */
	public function is_deployed(): bool {
		return (bool) get_option( self::OPT_DEPLOYED, false );
	}

	/** Returns the stored llms.txt content. */
	public function get_content(): string {
		return get_option( self::OPT_CONTENT, '' );
	}

	/** Returns human-readable "Deployed X ago" label. */
	public function deployed_label(): string {
		$ts = (int) get_option( self::OPT_DEPLOYED_AT, 0 );
		if ( ! $ts ) {
			return __( 'Not deployed', 'showsup' );
		}
		return sprintf( __( 'Deployed %s ago', 'showsup' ), human_time_diff( $ts ) );
	}
}
