<?php
/**
 * Admin view: Overview tab.
 *
 * Available vars (set in ShowsUp_Admin::render_page):
 * @var ShowsUp_Scanner  $scanner
 * @var ShowsUp_LLMsTxt  $llmstxt
 * @var array            $settings
 * @var ShowsUp_Admin    $this
 */

defined( 'ABSPATH' ) || exit;

$score   = $scanner->get_score();
$results = $scanner->get_results();
$api     = new ShowsUp_API();
$configured = $api->is_configured();
?>

<div class="showsup-dashboard">

	<?php if ( ! $configured ) : ?>
	<div class="showsup-notice showsup-notice--warning">
		<strong><?php esc_html_e( 'API token required', 'showsup' ); ?></strong> —
		<?php printf(
			/* translators: %s: link to settings tab */
			esc_html__( 'Add your ShowsUp API token in %s to start scanning.', 'showsup' ),
			'<a href="' . esc_url( admin_url( 'admin.php?page=showsup&tab=settings' ) ) . '">' . esc_html__( 'Settings', 'showsup' ) . '</a>'
		); ?>
	</div>
	<?php endif; ?>

	<!-- Scan CTA -->
	<div class="showsup-card showsup-card--scan">
		<div class="showsup-card__body">
			<div class="showsup-scan-info">
				<?php if ( null !== $score ) : ?>
					<div class="showsup-big-score-wrap">
						<span class="showsup-big-score showsup-score--<?php echo esc_attr( $this->score_class( $score ) ); ?>">
							<?php echo esc_html( $score ); ?>
						</span>
						<span class="showsup-out-of">/100</span>
					</div>
					<p class="showsup-last-scan-time">
						<?php esc_html_e( 'Last scanned:', 'showsup' ); ?>
						<strong><?php echo esc_html( $scanner->last_scanned_label() ); ?></strong>
					</p>
				<?php else : ?>
					<p><?php esc_html_e( 'No scan yet. Discover how ChatGPT, Claude & Gemini talk about your brand.', 'showsup' ); ?></p>
				<?php endif; ?>
			</div>
			<div class="showsup-scan-actions">
				<button id="showsup-run-scan" class="button button-primary showsup-btn-scan" <?php disabled( ! $configured ); ?>>
					<?php echo null !== $score ? esc_html__( 'Re-scan Now', 'showsup' ) : esc_html__( 'Run First Scan', 'showsup' ); ?>
				</button>
				<span id="showsup-scan-status" class="showsup-scan-status"></span>
			</div>
		</div>
	</div>

	<?php if ( $results ) : ?>

	<!-- Platform Scores -->
	<?php if ( ! empty( $results['platforms'] ) ) : ?>
	<div class="showsup-card">
		<h2><?php esc_html_e( 'Platform Scores', 'showsup' ); ?></h2>
		<div class="showsup-platforms">
			<?php foreach ( $results['platforms'] as $platform => $data ) :
				$pscore = is_array( $data ) ? ( $data['score'] ?? 0 ) : (int) $data;
			?>
				<div class="showsup-platform">
					<span class="showsup-platform__name"><?php echo esc_html( ucfirst( $platform ) ); ?></span>
					<div class="showsup-bar-wrap">
						<div class="showsup-bar showsup-bar--<?php echo esc_attr( $this->score_class( $pscore ) ); ?>"
							 style="width:<?php echo esc_attr( $pscore ); ?>%"></div>
					</div>
					<span class="showsup-platform__score"><?php echo esc_html( $pscore ); ?>/100</span>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
	<?php endif; ?>

	<!-- llms.txt Status -->
	<div class="showsup-card">
		<h2><?php esc_html_e( 'llms.txt', 'showsup' ); ?></h2>
		<div class="showsup-llmstxt-status">
			<div class="showsup-llmstxt-meta">
				<?php if ( $llmstxt->is_deployed() ) : ?>
					<span class="showsup-badge showsup-badge--green"><?php esc_html_e( 'Active', 'showsup' ); ?></span>
					<span class="showsup-llmstxt-url">
						<a href="<?php echo esc_url( home_url( '/llms.txt' ) ); ?>" target="_blank" rel="noopener">
							<?php echo esc_html( home_url( '/llms.txt' ) ); ?>
						</a>
					</span>
					<span class="showsup-llmstxt-time"><?php echo esc_html( $llmstxt->deployed_label() ); ?></span>
				<?php else : ?>
					<span class="showsup-badge showsup-badge--gray"><?php esc_html_e( 'Not deployed', 'showsup' ); ?></span>
					<p><?php esc_html_e( 'Deploy llms.txt to help AI crawlers understand your site.', 'showsup' ); ?></p>
				<?php endif; ?>
			</div>
			<button id="showsup-deploy-llmstxt" class="button">
				<?php echo $llmstxt->is_deployed() ? esc_html__( 'Redeploy', 'showsup' ) : esc_html__( 'Deploy llms.txt', 'showsup' ); ?>
			</button>
		</div>
		<?php if ( $llmstxt->is_deployed() ) : ?>
		<details class="showsup-llmstxt-preview">
			<summary><?php esc_html_e( 'Preview content', 'showsup' ); ?></summary>
			<pre><?php echo esc_html( $llmstxt->get_content() ); ?></pre>
		</details>
		<?php endif; ?>
	</div>

	<!-- Top Recommendations -->
	<?php if ( ! empty( $results['recommendations'] ) ) : ?>
	<div class="showsup-card">
		<h2>
			<?php esc_html_e( 'Top Improvements', 'showsup' ); ?>
			<a href="<?php echo esc_url( admin_url( 'admin.php?page=showsup&tab=fixes' ) ); ?>" class="showsup-see-all">
				<?php esc_html_e( 'See all fixes →', 'showsup' ); ?>
			</a>
		</h2>
		<ul class="showsup-recs-list">
			<?php foreach ( array_slice( $results['recommendations'], 0, 5 ) as $rec ) : ?>
				<li class="showsup-rec-item">
					<span class="showsup-rec__title"><?php echo esc_html( $rec['title'] ?? '' ); ?></span>
					<?php if ( ! empty( $rec['impact'] ) ) : ?>
						<span class="showsup-badge showsup-badge--<?php echo $rec['impact'] === 'high' ? 'red' : ( $rec['impact'] === 'medium' ? 'amber' : 'gray' ); ?>">
							<?php echo esc_html( ucfirst( $rec['impact'] ) ); ?>
						</span>
					<?php endif; ?>
				</li>
			<?php endforeach; ?>
		</ul>
	</div>
	<?php endif; ?>

	<?php else : ?>
	<!-- No results yet -->
	<div class="showsup-card showsup-card--empty">
		<p><?php esc_html_e( 'Run your first scan to see how AI models describe your brand.', 'showsup' ); ?></p>
	</div>
	<?php endif; ?>

</div>
