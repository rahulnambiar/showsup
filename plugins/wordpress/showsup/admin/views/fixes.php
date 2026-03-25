<?php
/**
 * Admin view: AI Fixes tab.
 */

defined( 'ABSPATH' ) || exit;

$results = $scanner->get_results();
$api     = new ShowsUp_API();
?>

<div class="showsup-fixes">

	<?php if ( empty( $results ) ) : ?>
	<div class="showsup-card showsup-card--empty">
		<p><?php esc_html_e( 'Run a scan first to generate AI-powered fixes.', 'showsup' ); ?></p>
		<a href="<?php echo esc_url( admin_url( 'admin.php?page=showsup&tab=overview' ) ); ?>" class="button button-primary">
			<?php esc_html_e( '← Run Scan', 'showsup' ); ?>
		</a>
	</div>
	<?php else : ?>

	<div class="showsup-card">
		<div class="showsup-fixes-header">
			<h2><?php esc_html_e( 'AI-Generated Fixes', 'showsup' ); ?></h2>
			<button id="showsup-refresh-fixes" class="button" <?php disabled( ! $api->is_configured() ); ?>>
				<?php esc_html_e( 'Refresh Fixes', 'showsup' ); ?>
			</button>
		</div>

		<!-- Quick-apply actions -->
		<div class="showsup-quick-fixes">
			<h3><?php esc_html_e( 'Quick Apply', 'showsup' ); ?></h3>
			<div class="showsup-quick-fix-row">
				<div class="showsup-quick-fix">
					<div class="showsup-quick-fix__info">
						<strong><?php esc_html_e( 'llms.txt', 'showsup' ); ?></strong>
						<p><?php esc_html_e( 'Auto-generated file helping AI crawlers understand your content.', 'showsup' ); ?></p>
					</div>
					<button class="button showsup-apply-fix" data-fix-type="llmstxt">
						<?php esc_html_e( 'Deploy', 'showsup' ); ?>
					</button>
				</div>
				<div class="showsup-quick-fix">
					<div class="showsup-quick-fix__info">
						<strong><?php esc_html_e( 'Schema Markup', 'showsup' ); ?></strong>
						<p><?php esc_html_e( 'Organization, FAQ and Product structured data for AI models.', 'showsup' ); ?></p>
					</div>
					<button class="button showsup-apply-fix" data-fix-type="schema">
						<?php esc_html_e( 'Enable', 'showsup' ); ?>
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Recommendations table -->
	<?php if ( ! empty( $results['recommendations'] ) ) : ?>
	<div class="showsup-card">
		<h3><?php esc_html_e( 'Improvement Opportunities', 'showsup' ); ?></h3>
		<table class="widefat showsup-fixes-table">
			<thead>
				<tr>
					<th><?php esc_html_e( 'Issue', 'showsup' ); ?></th>
					<th><?php esc_html_e( 'Impact', 'showsup' ); ?></th>
					<th><?php esc_html_e( 'Platform', 'showsup' ); ?></th>
					<th><?php esc_html_e( 'Fix', 'showsup' ); ?></th>
				</tr>
			</thead>
			<tbody>
				<?php foreach ( $results['recommendations'] as $rec ) :
					$impact   = $rec['impact']   ?? 'low';
					$platform = $rec['platform'] ?? '';
					$title    = $rec['title']    ?? '';
					$fix      = $rec['fix']      ?? $rec['description'] ?? '';
				?>
				<tr>
					<td><strong><?php echo esc_html( $title ); ?></strong></td>
					<td>
						<span class="showsup-badge showsup-badge--<?php echo esc_attr( $impact === 'high' ? 'red' : ( $impact === 'medium' ? 'amber' : 'gray' ) ); ?>">
							<?php echo esc_html( ucfirst( $impact ) ); ?>
						</span>
					</td>
					<td><?php echo esc_html( $platform ); ?></td>
					<td class="showsup-fix-text"><?php echo esc_html( $fix ); ?></td>
				</tr>
				<?php endforeach; ?>
			</tbody>
		</table>
	</div>
	<?php endif; ?>

	<!-- Queries won / missed -->
	<?php if ( ! empty( $results['queries_won'] ) || ! empty( $results['queries_missed'] ) ) : ?>
	<div class="showsup-card showsup-card--queries">
		<div class="showsup-queries-grid">
			<?php if ( ! empty( $results['queries_won'] ) ) : ?>
			<div class="showsup-queries-col">
				<h3 class="showsup-queries-won"><?php esc_html_e( '✓ Queries You Win', 'showsup' ); ?></h3>
				<ul>
					<?php foreach ( array_slice( $results['queries_won'], 0, 10 ) as $q ) : ?>
						<li><?php echo esc_html( is_array( $q ) ? ( $q['query'] ?? '' ) : $q ); ?></li>
					<?php endforeach; ?>
				</ul>
			</div>
			<?php endif; ?>
			<?php if ( ! empty( $results['queries_missed'] ) ) : ?>
			<div class="showsup-queries-col">
				<h3 class="showsup-queries-missed"><?php esc_html_e( '✗ Queries You Miss', 'showsup' ); ?></h3>
				<ul>
					<?php foreach ( array_slice( $results['queries_missed'], 0, 10 ) as $q ) : ?>
						<li><?php echo esc_html( is_array( $q ) ? ( $q['query'] ?? '' ) : $q ); ?></li>
					<?php endforeach; ?>
				</ul>
			</div>
			<?php endif; ?>
		</div>
	</div>
	<?php endif; ?>

	<?php endif; ?>

</div>
