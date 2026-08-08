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
		$url_fields = array( 'social_facebook', 'social_instagram', 'social_youtube', 'social_whatsapp', 'contact_page_url', 'accessibility_page_url', 'emergency_banner_link' );
		$text_fields = array(
			'phone', 'email', 'address', 'call_center_title', 'call_center_subtitle', 'footer_slogan',
			'onesignal_app_id', 'onesignal_rest_api_key', 'whatsapp_button_number',
			'emergency_banner_message', 'emergency_banner_link_label',
		);
		$checkbox_fields = array( 'onesignal_auto_notify', 'emergency_banner_enabled', 'cookie_consent_enabled' );

		$settings = tc_core_get_settings();
		foreach ( $text_fields as $field ) {
			if ( isset( $_POST[ $field ] ) ) {
				$settings[ $field ] = sanitize_text_field( wp_unslash( $_POST[ $field ] ) );
			}
		}
		foreach ( $url_fields as $field ) {
			if ( isset( $_POST[ $field ] ) ) {
				$settings[ $field ] = esc_url_raw( wp_unslash( $_POST[ $field ] ) );
			}
		}
		foreach ( $checkbox_fields as $field ) {
			$settings[ $field ] = isset( $_POST[ $field ] ) ? '1' : '';
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
				<tr><th><label for="social_whatsapp"><?php esc_html_e( 'וואטסאפ (קישור wa.me להצגה בפוטר)', 'tirat-carmel' ); ?></label></th><td><input class="regular-text" type="url" id="social_whatsapp" name="social_whatsapp" value="<?php echo esc_attr( $s['social_whatsapp'] ); ?>" placeholder="https://wa.me/9724..."></td></tr>
				<tr>
					<th><label for="whatsapp_button_number"><?php esc_html_e( 'מספר וואטסאפ לכפתור צף בכל האתר', 'tirat-carmel' ); ?></label></th>
					<td>
						<input class="regular-text" type="text" id="whatsapp_button_number" name="whatsapp_button_number" value="<?php echo esc_attr( $s['whatsapp_button_number'] ); ?>" placeholder="972501234567">
						<p class="description"><?php esc_html_e( 'מספר בפורמט בינלאומי ללא + או 0 מוביל (למשל 972501234567). השאירו ריק כדי להסתיר את הכפתור.', 'tirat-carmel' ); ?></p>
					</td>
				</tr>
			</table>

			<h2 class="title"><?php esc_html_e( 'התראות Push (OneSignal)', 'tirat-carmel' ); ?></h2>
			<p class="description">
				<?php esc_html_e( 'כדי לאפשר לתושבים להירשם להתראות דחיפה בדפדפן/בנייד, יש ליצור חשבון חינמי באתר', 'tirat-carmel' ); ?>
				<a href="https://onesignal.com" target="_blank" rel="noopener noreferrer">onesignal.com</a>,
				<?php esc_html_e( 'ליצור אפליקציית Web Push, ולהעתיק לכאן את ה-App ID. שליחה אוטומטית עם פרסום תוכן חדש דורשת גם את מפתח ה-REST API (סודי - לא לשתף).', 'tirat-carmel' ); ?>
			</p>
			<table class="form-table" role="presentation">
				<tr><th><label for="onesignal_app_id"><?php esc_html_e( 'OneSignal App ID', 'tirat-carmel' ); ?></label></th><td><input class="regular-text" type="text" id="onesignal_app_id" name="onesignal_app_id" value="<?php echo esc_attr( $s['onesignal_app_id'] ); ?>" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"></td></tr>
				<tr>
					<th><label for="onesignal_rest_api_key"><?php esc_html_e( 'OneSignal REST API Key (סודי)', 'tirat-carmel' ); ?></label></th>
					<td>
						<input class="regular-text" type="password" autocomplete="off" id="onesignal_rest_api_key" name="onesignal_rest_api_key" value="<?php echo esc_attr( $s['onesignal_rest_api_key'] ); ?>">
						<p class="description"><?php esc_html_e( 'נדרש רק אם רוצים שליחה אוטומטית של Push עם כל פרסום. לא נחשף בשום מקום בצד הציבורי של האתר.', 'tirat-carmel' ); ?></p>
					</td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'שליחה אוטומטית', 'tirat-carmel' ); ?></th>
					<td><label><input type="checkbox" name="onesignal_auto_notify" value="1" <?php checked( $s['onesignal_auto_notify'], '1' ); ?>> <?php esc_html_e( 'שליחת Push אוטומטית לכל מנוי בכל פרסום מכרז/אירוע/כתבה חדשים', 'tirat-carmel' ); ?></label></td>
				</tr>
			</table>
			<p class="description"><?php esc_html_e( 'ניתן גם להציג כפתור הרשמה ידני בכל עמוד/וידג\'ט באמצעות: [tc_push_subscribe_button]', 'tirat-carmel' ); ?></p>

			<h2 class="title"><?php esc_html_e( 'באנר חירום', 'tirat-carmel' ); ?></h2>
			<table class="form-table" role="presentation">
				<tr>
					<th><?php esc_html_e( 'הצגת באנר חירום', 'tirat-carmel' ); ?></th>
					<td><label><input type="checkbox" name="emergency_banner_enabled" value="1" <?php checked( $s['emergency_banner_enabled'], '1' ); ?>> <?php esc_html_e( 'הצג פס אדום קבוע בראש כל עמודי האתר (להפעלה בזמן אירוע חירום בלבד)', 'tirat-carmel' ); ?></label></td>
				</tr>
				<tr><th><label for="emergency_banner_message"><?php esc_html_e( 'נוסח ההודעה', 'tirat-carmel' ); ?></label></th><td><input class="large-text" type="text" id="emergency_banner_message" name="emergency_banner_message" value="<?php echo esc_attr( $s['emergency_banner_message'] ); ?>"></td></tr>
				<tr><th><label for="emergency_banner_link"><?php esc_html_e( 'קישור לפרטים נוספים (אופציונלי)', 'tirat-carmel' ); ?></label></th><td><input class="regular-text" type="url" id="emergency_banner_link" name="emergency_banner_link" value="<?php echo esc_attr( $s['emergency_banner_link'] ); ?>" placeholder="/emergency/"></td></tr>
				<tr><th><label for="emergency_banner_link_label"><?php esc_html_e( 'טקסט הקישור', 'tirat-carmel' ); ?></label></th><td><input class="regular-text" type="text" id="emergency_banner_link_label" name="emergency_banner_link_label" value="<?php echo esc_attr( $s['emergency_banner_link_label'] ); ?>"></td></tr>
			</table>

			<h2 class="title"><?php esc_html_e( 'פרטיות', 'tirat-carmel' ); ?></h2>
			<table class="form-table" role="presentation">
				<tr>
					<th><?php esc_html_e( 'הודעת עוגיות (Cookies)', 'tirat-carmel' ); ?></th>
					<td><label><input type="checkbox" name="cookie_consent_enabled" value="1" <?php checked( $s['cookie_consent_enabled'], '1' ); ?>> <?php esc_html_e( 'הצג הודעת עוגיות בתחתית האתר בביקור ראשון', 'tirat-carmel' ); ?></label></td>
				</tr>
			</table>

			<?php submit_button( __( 'שמירת הגדרות', 'tirat-carmel' ) ); ?>
		</form>
	</div>
	<?php
}
