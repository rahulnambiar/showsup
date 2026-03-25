<?php
/**
 * Injects structured schema markup into the site <head>.
 * Handles Organization, FAQ (from scan gaps), and WooCommerce Product schemas.
 */

defined( 'ABSPATH' ) || exit;

class ShowsUp_Schema {

	public function __construct() {
		add_action( 'wp_head', array( $this, 'inject_schema' ) );
	}

	// ── Public ────────────────────────────────────────────────────────────────

	public function inject_schema(): void {
		$settings = get_option( 'showsup_settings', array() );
		if ( ! empty( $settings['disable_schema'] ) ) {
			return;
		}

		$schemas = array();

		// Organization — always on front page / everywhere
		$org = $this->build_organization();
		if ( $org ) {
			$schemas[] = $org;
		}

		// FAQ — on pages that have FAQ content or on front page if scan has gap queries
		if ( is_singular() || is_front_page() ) {
			$faq = $this->build_faq();
			if ( $faq ) {
				$schemas[] = $faq;
			}
		}

		// WooCommerce Product — on product pages
		if ( $this->is_woo_product() ) {
			$product = $this->build_product();
			if ( $product ) {
				$schemas[] = $product;
			}
		}

		foreach ( $schemas as $schema ) {
			echo '<script type="application/ld+json">' . wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>' . "\n"; // phpcs:ignore
		}
	}

	// ── Builders ──────────────────────────────────────────────────────────────

	private function build_organization(): ?array {
		$settings = get_option( 'showsup_settings', array() );
		$name     = $settings['brand_name'] ?? get_bloginfo( 'name' );
		$url      = home_url();
		$logo_url = $this->get_site_logo_url();

		$schema = array(
			'@context' => 'https://schema.org',
			'@type'    => 'Organization',
			'name'     => $name,
			'url'      => $url,
		);

		if ( $logo_url ) {
			$schema['logo'] = array(
				'@type' => 'ImageObject',
				'url'   => $logo_url,
			);
		}

		// Description from site tagline
		$description = get_bloginfo( 'description' );
		if ( $description ) {
			$schema['description'] = $description;
		}

		// Social / sameAs from settings
		$social = array();
		foreach ( array( 'twitter_url', 'linkedin_url', 'facebook_url', 'instagram_url' ) as $key ) {
			if ( ! empty( $settings[ $key ] ) ) {
				$social[] = esc_url( $settings[ $key ] );
			}
		}
		if ( ! empty( $social ) ) {
			$schema['sameAs'] = $social;
		}

		// Contact point if phone set
		if ( ! empty( $settings['contact_phone'] ) ) {
			$schema['contactPoint'] = array(
				'@type'       => 'ContactPoint',
				'telephone'   => sanitize_text_field( $settings['contact_phone'] ),
				'contactType' => 'customer service',
			);
		}

		return $schema;
	}

	private function build_faq(): ?array {
		$items = array();

		// 1. Try FAQ blocks/shortcodes on this specific page
		if ( is_singular() ) {
			$post_id    = get_the_ID();
			$post_items = $this->extract_page_faq( $post_id );
			$items      = array_merge( $items, $post_items );
		}

		// 2. Augment with gap queries from scan (on front page or if page has < 3 FAQ items)
		if ( is_front_page() || count( $items ) < 3 ) {
			$scan_result = get_option( ShowsUp_Scanner::OPT_RESULTS );
			if ( ! empty( $scan_result['recommendations'] ) ) {
				foreach ( array_slice( $scan_result['recommendations'], 0, 8 ) as $rec ) {
					$q = $rec['query'] ?? $rec['title'] ?? '';
					$a = $rec['description'] ?? $rec['fix'] ?? '';
					if ( $q && $a ) {
						$items[] = array( 'q' => $q, 'a' => $a );
					}
				}
			}
		}

		if ( empty( $items ) ) {
			return null;
		}

		$entities = array();
		foreach ( $items as $item ) {
			$entities[] = array(
				'@type'          => 'Question',
				'name'           => wp_strip_all_tags( $item['q'] ),
				'acceptedAnswer' => array(
					'@type' => 'Answer',
					'text'  => wp_strip_all_tags( $item['a'] ),
				),
			);
		}

		return array(
			'@context'   => 'https://schema.org',
			'@type'      => 'FAQPage',
			'mainEntity' => $entities,
		);
	}

	private function build_product(): ?array {
		if ( ! function_exists( 'wc_get_product' ) ) {
			return null;
		}

		$product = wc_get_product( get_the_ID() );
		if ( ! $product ) {
			return null;
		}

		$schema = array(
			'@context'    => 'https://schema.org',
			'@type'       => 'Product',
			'name'        => $product->get_name(),
			'description' => wp_strip_all_tags( $product->get_short_description() ?: $product->get_description() ),
			'url'         => get_permalink(),
		);

		// SKU
		$sku = $product->get_sku();
		if ( $sku ) {
			$schema['sku'] = $sku;
		}

		// Image
		$img_id = $product->get_image_id();
		if ( $img_id ) {
			$schema['image'] = wp_get_attachment_url( $img_id );
		}

		// Brand from settings
		$settings = get_option( 'showsup_settings', array() );
		$brand    = $settings['brand_name'] ?? get_bloginfo( 'name' );
		if ( $brand ) {
			$schema['brand'] = array( '@type' => 'Brand', 'name' => $brand );
		}

		// Offers
		$price = $product->get_price();
		if ( $price !== '' ) {
			$offer = array(
				'@type'         => 'Offer',
				'price'         => $price,
				'priceCurrency' => get_woocommerce_currency(),
				'availability'  => $product->is_in_stock()
					? 'https://schema.org/InStock'
					: 'https://schema.org/OutOfStock',
				'url'           => get_permalink(),
			);
			$schema['offers'] = $offer;
		}

		// Aggregate rating
		$rating_count = $product->get_rating_count();
		$avg_rating   = $product->get_average_rating();
		if ( $rating_count > 0 && $avg_rating > 0 ) {
			$schema['aggregateRating'] = array(
				'@type'       => 'AggregateRating',
				'ratingValue' => $avg_rating,
				'reviewCount' => $rating_count,
			);
		}

		return $schema;
	}

	// ── Helpers ───────────────────────────────────────────────────────────────

	private function get_site_logo_url(): string {
		// WordPress 5.5+ custom_logo
		$logo_id = get_theme_mod( 'custom_logo' );
		if ( $logo_id ) {
			$src = wp_get_attachment_image_url( $logo_id, 'full' );
			if ( $src ) {
				return $src;
			}
		}

		// Fallback: site icon
		$icon_id = get_option( 'site_icon' );
		if ( $icon_id ) {
			$src = wp_get_attachment_image_url( $icon_id, 'full' );
			if ( $src ) {
				return $src;
			}
		}

		return '';
	}

	/**
	 * Extract FAQ Q&A pairs from Gutenberg FAQ blocks or a custom meta field.
	 */
	private function extract_page_faq( int $post_id ): array {
		$items = array();
		$post  = get_post( $post_id );
		if ( ! $post ) {
			return $items;
		}

		// Parse Gutenberg blocks for core/faq-type or common FAQ block patterns
		if ( function_exists( 'parse_blocks' ) ) {
			$blocks = parse_blocks( $post->post_content );
			$items  = array_merge( $items, $this->extract_faq_from_blocks( $blocks ) );
		}

		// Meta field fallback: _showsup_faq (JSON array of {q, a})
		$meta = get_post_meta( $post_id, '_showsup_faq', true );
		if ( $meta && is_array( $meta ) ) {
			$items = array_merge( $items, $meta );
		}

		return $items;
	}

	private function extract_faq_from_blocks( array $blocks ): array {
		$items = array();
		foreach ( $blocks as $block ) {
			$name = $block['blockName'] ?? '';

			// Common FAQ block names
			if ( in_array( $name, array(
				'yoast/faq-block',
				'rank-math/faq-block',
				'otter-blocks/faq',
				'generateblocks/accordion',
			), true ) ) {
				$q = wp_strip_all_tags( $block['attrs']['question'] ?? '' );
				$a = wp_strip_all_tags( $block['attrs']['answer'] ?? '' );
				if ( $q && $a ) {
					$items[] = array( 'q' => $q, 'a' => $a );
				}
				// Some blocks nest Q/A in innerBlocks
				foreach ( $block['innerBlocks'] ?? array() as $inner ) {
					$q = wp_strip_all_tags( $inner['attrs']['question'] ?? '' );
					$a = wp_strip_all_tags( $inner['attrs']['answer'] ?? '' );
					if ( $q && $a ) {
						$items[] = array( 'q' => $q, 'a' => $a );
					}
				}
			}

			// Recurse into inner blocks
			if ( ! empty( $block['innerBlocks'] ) ) {
				$items = array_merge( $items, $this->extract_faq_from_blocks( $block['innerBlocks'] ) );
			}
		}
		return $items;
	}

	private function is_woo_product(): bool {
		return is_singular( 'product' ) && class_exists( 'WooCommerce' );
	}
}
