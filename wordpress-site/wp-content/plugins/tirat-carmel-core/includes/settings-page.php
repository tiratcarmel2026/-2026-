<?php
/**
 * עמוד הגדרות אתר כללי: טלפון, מייל, כתובת, רשתות חברתיות, טקסטים בפוטר.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function tc_core_render_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( isset( $_POST['tc_settings_nonce'] ) && wp_verify_nonce( $_POST['tc_settings_nonce'], 'tc_settings_save' ) ) {
		$fields = array(
			'phone', 'email', 'address', 'call_center_title', 'call_center_subtitle', 'footer_slogan',
			'social_facebook', 'social_instagram', 'social_youtube', 'social_whatsapp',
			'contact_page_url', 'accessibility_page_url',
		);
		$settings = tc_core_get_settings();
		foreach ( $fields as $field ) {
			if ( isset( $_POST[ $field ] ) ) {
				$value = wp_unslash( $_POST[ $field ] );
				$settings[ $field ] = in_array( $field, array( 'social_facebook', 'social_instagram', 'social_youtube', 'social_whatsapp', 'contact_page_url', 'accessibility_page_url' ), true )
					? esc_url_raw( $value )
					: sanitize_text_field( $value );
			}
		}
		update_option( 'tc_core_settings', $settings );
		echo '<div class="notice notice-success"><p>' . esc_html__( 'ההגדרות נשמרו בהצלחה.', 'tirat-carmel' ) . '</p></div>';
	}

	$s = tc_core_get_settings();
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'הגדרות אתר עיריית טירת כרמל', 'tirat-carmel' ); ?></h1>
		<p>
			<?php esc_html_e( 'כאן ניתן לערוך את הפרטים המופיעים בכל האתר: פוטר, פס יצירת קשר, כפתור 106 ורשתות חברתיות - בלי לגעת בקוד.', 'tirat-carmel' ); ?>
			<?php esc_html_e( 'ניהול תוכן נוסף:', 'tirat-carmel' ); ?>
			<a href="<?php echo esc_url( admin_url( 'admin.php?page=tc-service-cards' ) ); ?>"><?php esc_html_e( 'כרטיסי שירות', 'tirat-carmel' ); ?></a> ·
			<a href="<?php echo esc_url( admin_url( 'admin.php?page=tc-chatbot-intents' ) ); ?>"><?php esc_html_e( 'בוט ניווט', 'tirat-carmel' ); ?></a> ·
			<a href="<?php echo esc_url( admin_url( 'edit.php?post_type=tender' ) ); ?>"><?php esc_html_e( 'מכרזים', 'tirat-carmel' ); ?></a> ·
			<a href="<?php echo esc_url( admin_url( 'edit.php?post_type=tc_event' ) ); ?>"><?php esc_html_e( 'אירועים', 'tirat-carmel' ); ?></a> ·
			<a href="<?php echo esc_url( admin_url( 'customize.php' ) ); ?>"><?php esc_html_e( 'לוגו, תמונת רקע וצבעים (Customizer)', 'tirat-carmel' ); ?></a>
		</p>

		<form method="post">
			<?php wp_nonce_field( 'tc_settings_save', 'tc_settings_nonce' ); ?>
			<h2 class="title"><?php esc_html_e( 'פרטי קשר', 'tirat-carmel' ); ?></h2>
			<table class="form-table" role="presentation">
				<tr><th><label for="phone"><?php esc_html_e( 'טלפון', 'tirat-carmel' ); ?></label></th><td><input class="regular-text" type="text" id="phone" name="phone" value="<?php echo esc_attr( $s['phone'] ); ?>"></td></tr>
				<tr><th><label for="email"><?php esc_html_e( 'דוא"ל', 'tirat-carmel' ); ?></label></th><td><input class="regular-text" type="email" id="email" name="email" value="<?php echo esc_attr( $s['email'] ); ?>"></td></tr>
				<tr><th><label for="address"><?php esc_html_e( 'כתובת', 'tirat-carmel' ); ?></label></th><td><input class="regular-text" type="text" id="address" name="address" value="<?php echo esc_attr( $s['address'] ); ?>"></td></tr>
				<tr><th><label for="contact_page_url"><?php esc_html_e( 'קישור לעמוד "יצירת קשר"', 'tirat-carmel' ); ?></label></th><td><input class="regular-text" type="text" id="contact_page_url" name="contact_page_url" value="<?php echo esc_attr( $s['contact_page_url'] ); ?>" placeholder="/contact/"></td></tr>
				<tr><th><label for="accessibility_page_url"><?php esc_html_e( 'קישור לעמוד "הצהרת נגישות"', 'tirat-carmel' ); ?></label></th><td><input class="regular-text" type="text" id="accessibility_page_url" name="accessibility_page_url" value="<?php echo esc_attr( $s['accessibility_page_url'] ); ?>" placeholder="/accessibility/"></td></tr>
			</table>

			<h2 class="title"><?php esc_html_e( 'מוקד 106 ופוטר', 'tirat-carmel' ); ?></h2>
			<table class="form-table" role="presentation">
				<tr><th><label for="call_center_title"><?php esc_html_e( 'כותרת פס 106', 'tirat-carmel' ); ?></label></th><td><input class="regular-text" type="text" id="call_center_title" name="call_center_title" value="<?php echo esc_attr( $s['call_center_title'] ); ?>"></td></tr>
				<tr><th><label for="call_center_subtitle"><?php esc_html_e( 'כותרת משנה פס 106', 'tirat-carmel' ); ?></label></th><td><input class="regular-text" type="text" id="call_center_subtitle" name="call_center_subtitle" value="<?php echo esc_attr( $s['call_center_subtitle'] ); ?>"></td></tr>
				<tr><th><label for="footer_slogan"><?php esc_html_e( 'סלוגן בפוטר', 'tirat-carmel' ); ?></label></th><td><textarea class="large-text" rows="2" id="footer_slogan" name="footer_slogan"><?php echo esc_textarea( $s['footer_slogan'] ); ?></textarea></td></tr>
			</table>

			<h2 class="title"><?php esc_html_e( 'רשתות חברתיות', 'tirat-carmel' ); ?></h2>
			<table class="form-table" role="presentation">
				<tr><th><label for="social_facebook"><?php esc_html_e( 'פייסבוק', 'tirat-carmel' ); ?></label></th><td><input class="regular-text" type="url" id="social_facebook" name="social_facebook" value="<?php echo esc_attr( $s['social_facebook'] ); ?>" placeholder="https://facebook.com/..."></td></tr>
				<tr><th><label for="social_instagram"><?php esc_html_e( 'אינסטגרם', 'tirat-carmel' ); ?></label></th><td><input class="regular-text" type="url" id="social_instagram" name="social_instagram" value="<?php echo esc_attr( $s['social_instagram'] ); ?>" placeholder="https://instagram.com/..."></td></tr>
				<tr><th><label for="social_youtube"><?php esc_html_e( 'יוטיוב', 'tirat-carmel' ); ?></label></th><td><input class="regular-text" type="url" id="social_youtube" name="social_youtube" value="<?php echo esc_attr( $s['social_youtube'] ); ?>" placeholder="https://youtube.com/..."></td></tr>
				<tr><th><label for="social_whatsapp"><?php esc_html_e( 'וואטסאפ (קישור wa.me)', 'tirat-carmel' ); ?></label></th><td><input class="regular-text" type="url" id="social_whatsapp" name="social_whatsapp" value="<?php echo esc_attr( $s['social_whatsapp'] ); ?>" placeholder="https://wa.me/9724..."></td></tr>
			</table>

			<?php submit_button( __( 'שמירת הגדרות', 'tirat-carmel' ) ); ?>
		</form>
	</div>
	<?php
}
