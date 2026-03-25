<?php
/**
 * Admin view: Settings tab.
 */

defined( 'ABSPATH' ) || exit;

$auto_freq = get_option( 'showsup_auto_scan_freq', 'weekly' );

$categories = array(
	'SaaS', 'E-commerce', 'Agency', 'Healthcare', 'Finance', 'Education',
	'Real Estate', 'Legal', 'Restaurant', 'Retail', 'Technology', 'Other',
);

$regions = array(
	'global' => __( 'Global', 'showsup' ),
	'us'     => __( 'United States', 'showsup' ),
	'uk'     => __( 'United Kingdom', 'showsup' ),
	'eu'     => __( 'Europe', 'showsup' ),
	'au'     => __( 'Australia', 'showsup' ),
	'ca'     => __( 'Canada', 'showsup' ),
	'in'     => __( 'India', 'showsup' ),
	'sg'     => __( 'Singapore', 'showsup' ),
);

$sel_regions = $settings['regions'] ?? array( 'global' );
?>

<div class="showsup-settings">
	<form id="showsup-settings-form">

		<!-- API -->
		<div class="showsup-card">
			<h2><?php esc_html_e( 'API Connection', 'showsup' ); ?></h2>
			<table class="form-table">
				<tr>
					<th><label for="showsup_api_token"><?php esc_html_e( 'API Token', 'showsup' ); ?></label></th>
					<td>
						<input type="password" id="showsup_api_token" name="settings[api_token]"
							   value="<?php echo esc_attr( $settings['api_token'] ?? '' ); ?>"
							   class="regular-text" autocomplete="off" />
						<p class="description">
							<?php printf(
								/* translators: %s: link to showsup.co */
								esc_html__( 'Get your API token at %s', 'showsup' ),
								'<a href="https://showsup.co" target="_blank" rel="noopener">showsup.co</a>'
							); ?>
						</p>
					</td>
				</tr>
				<tr>
					<th><label for="showsup_cloud_url"><?php esc_html_e( 'Cloud URL', 'showsup' ); ?></label></th>
					<td>
						<input type="url" id="showsup_cloud_url" name="settings[cloud_url]"
							   value="<?php echo esc_attr( $settings['cloud_url'] ?? SHOWSUP_CLOUD_URL ); ?>"
							   class="regular-text" placeholder="https://showsup.co" />
						<p class="description"><?php esc_html_e( 'Leave default unless you self-host ShowsUp.', 'showsup' ); ?></p>
					</td>
				</tr>
			</table>
		</div>

		<!-- Brand -->
		<div class="showsup-card">
			<h2><?php esc_html_e( 'Brand & Scanning', 'showsup' ); ?></h2>
			<table class="form-table">
				<tr>
					<th><label for="showsup_brand_name"><?php esc_html_e( 'Brand Name', 'showsup' ); ?></label></th>
					<td>
						<input type="text" id="showsup_brand_name" name="settings[brand_name]"
							   value="<?php echo esc_attr( $settings['brand_name'] ?? get_bloginfo( 'name' ) ); ?>"
							   class="regular-text" />
					</td>
				</tr>
				<tr>
					<th><label for="showsup_category"><?php esc_html_e( 'Category', 'showsup' ); ?></label></th>
					<td>
						<select id="showsup_category" name="settings[category]">
							<?php foreach ( $categories as $cat ) : ?>
								<option value="<?php echo esc_attr( $cat ); ?>" <?php selected( ( $settings['category'] ?? 'Other' ), $cat ); ?>>
									<?php echo esc_html( $cat ); ?>
								</option>
							<?php endforeach; ?>
						</select>
					</td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'Regions', 'showsup' ); ?></th>
					<td>
						<?php foreach ( $regions as $code => $label ) : ?>
							<label style="display:inline-block;margin-right:12px;margin-bottom:6px;">
								<input type="checkbox" name="settings[regions][]" value="<?php echo esc_attr( $code ); ?>"
									   <?php checked( in_array( $code, $sel_regions, true ) ); ?> />
								<?php echo esc_html( $label ); ?>
							</label>
						<?php endforeach; ?>
					</td>
				</tr>
				<tr>
					<th><label for="showsup_scan_depth"><?php esc_html_e( 'Scan Depth', 'showsup' ); ?></label></th>
					<td>
						<select id="showsup_scan_depth" name="settings[scan_depth]">
							<option value="quick"    <?php selected( $settings['scan_depth'] ?? 'standard', 'quick' ); ?>><?php esc_html_e( 'Quick', 'showsup' ); ?></option>
							<option value="standard" <?php selected( $settings['scan_depth'] ?? 'standard', 'standard' ); ?>><?php esc_html_e( 'Standard', 'showsup' ); ?></option>
							<option value="deep"     <?php selected( $settings['scan_depth'] ?? 'standard', 'deep' ); ?>><?php esc_html_e( 'Deep', 'showsup' ); ?></option>
						</select>
					</td>
				</tr>
			</table>
		</div>

		<!-- Automation -->
		<div class="showsup-card">
			<h2><?php esc_html_e( 'Automation', 'showsup' ); ?></h2>
			<table class="form-table">
				<tr>
					<th><label for="showsup_auto_scan_freq"><?php esc_html_e( 'Auto-scan Frequency', 'showsup' ); ?></label></th>
					<td>
						<select id="showsup_auto_scan_freq" name="settings[auto_scan_freq]">
							<option value="off"        <?php selected( $auto_freq, 'off' ); ?>><?php esc_html_e( 'Off', 'showsup' ); ?></option>
							<option value="daily"      <?php selected( $auto_freq, 'daily' ); ?>><?php esc_html_e( 'Daily', 'showsup' ); ?></option>
							<option value="weekly"     <?php selected( $auto_freq, 'weekly' ); ?>><?php esc_html_e( 'Weekly', 'showsup' ); ?></option>
							<option value="monthly"    <?php selected( $auto_freq, 'monthly' ); ?>><?php esc_html_e( 'Monthly', 'showsup' ); ?></option>
						</select>
					</td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'Email Notifications', 'showsup' ); ?></th>
					<td>
						<label>
							<input type="checkbox" name="settings[email_notifications]" value="1"
								   <?php checked( ! empty( $settings['email_notifications'] ) ); ?> />
							<?php esc_html_e( 'Send scan results to admin email', 'showsup' ); ?>
						</label>
					</td>
				</tr>
			</table>
		</div>

		<!-- Schema -->
		<div class="showsup-card">
			<h2><?php esc_html_e( 'Schema Markup', 'showsup' ); ?></h2>
			<table class="form-table">
				<tr>
					<th><?php esc_html_e( 'Schema Injection', 'showsup' ); ?></th>
					<td>
						<label>
							<input type="checkbox" name="settings[disable_schema]" value="1"
								   <?php checked( ! empty( $settings['disable_schema'] ) ); ?> />
							<?php esc_html_e( 'Disable automatic schema injection (use if another plugin handles schema)', 'showsup' ); ?>
						</label>
					</td>
				</tr>
			</table>
		</div>

		<!-- Social Links (for Organization schema sameAs) -->
		<div class="showsup-card">
			<h2><?php esc_html_e( 'Social Profiles', 'showsup' ); ?></h2>
			<p class="description"><?php esc_html_e( 'Used in Organization schema sameAs for AI model context.', 'showsup' ); ?></p>
			<table class="form-table">
				<?php foreach ( array(
					'twitter_url'   => 'Twitter / X',
					'linkedin_url'  => 'LinkedIn',
					'facebook_url'  => 'Facebook',
					'instagram_url' => 'Instagram',
				) as $key => $label ) : ?>
				<tr>
					<th><label><?php echo esc_html( $label ); ?></label></th>
					<td>
						<input type="url" name="settings[<?php echo esc_attr( $key ); ?>]"
							   value="<?php echo esc_attr( $settings[ $key ] ?? '' ); ?>"
							   class="regular-text" placeholder="https://" />
					</td>
				</tr>
				<?php endforeach; ?>
			</table>
		</div>

		<p>
			<button type="submit" id="showsup-save-settings" class="button button-primary">
				<?php esc_html_e( 'Save Settings', 'showsup' ); ?>
			</button>
			<span id="showsup-settings-status" class="showsup-settings-status"></span>
		</p>

	</form>
</div>
