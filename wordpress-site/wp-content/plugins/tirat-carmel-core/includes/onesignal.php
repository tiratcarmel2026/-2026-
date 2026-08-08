<?php
/**
 * הודעות Push דרך OneSignal - הרשמת תושבים להתראות דחיפה בדפדפן/בנייד,
 * ושליחה אוטומטית כשמתפרסם מכרז/אירוע/כתבה חדשים (אופציונלי).
 *
 * הגדרה: עיריית טירת כרמל > הגדרות > "התראות Push (OneSignal)".
 * יש ליצור חשבון וחשבון אפליקציית Web Push בחינם ב-onesignal.com,
 * ולהעתיק את ה-App ID (ואת מפתח ה-REST API אם רוצים שליחה אוטומטית).
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function tc_core_onesignal_app_id() {
	return trim( (string) tc_core_get_option( 'onesignal_app_id', '' ) );
}

/**
 * טעינת ה-SDK של OneSignal רק אם הוגדר App ID (כדי לא לטעון סקריפט חיצוני סתם).
 */
function tc_core_enqueue_onesignal() {
	$app_id = tc_core_onesignal_app_id();
	if ( ! $app_id ) {
		return;
	}
	?>
	<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
	<script>
		window.OneSignalDeferred = window.OneSignalDeferred || [];
		OneSignalDeferred.push(function (OneSignal) {
			OneSignal.init({
				appId: <?php echo wp_json_encode( $app_id ); ?>,
				notifyButton: { enable: false },
				promptOptions: {}
			});
		});
	</script>
	<?php
}
add_action( 'wp_head', 'tc_core_enqueue_onesignal' );

/**
 * כפתור "הרשמה להתראות" ידני, לשימוש בכל מקום באתר (למשל בפוטר, ליד טופס
 * "הישארו מעודכנים"). מציג את חלון ההרשמה המובנה של OneSignal.
 */
function tc_core_onesignal_subscribe_button_shortcode( $atts ) {
	if ( ! tc_core_onesignal_app_id() ) {
		return '';
	}
	$atts = shortcode_atts( array( 'label' => 'הרשמה להתראות Push' ), $atts );
	ob_start();
	?>
	<button type="button" class="tc-btn tc-btn--outline tc-onesignal-subscribe" onclick="window.OneSignalDeferred=window.OneSignalDeferred||[];OneSignalDeferred.push(function(OneSignal){OneSignal.Slidedown.promptPush();});">
		<?php echo esc_html( $atts['label'] ); ?>
	</button>
	<?php
	return ob_get_clean();
}
add_shortcode( 'tc_push_subscribe_button', 'tc_core_onesignal_subscribe_button_shortcode' );

/**
 * שליחת התראת Push אוטומטית כשמכרז/אירוע/כתבה עוברים לסטטוס "פורסם".
 * דורש מפתח REST API (סודי!) שמוגדר במסך ההגדרות - לא נחשף לצד הציבורי.
 */
function tc_core_maybe_send_onesignal_notification( $new_status, $old_status, $post ) {
	if ( 'publish' !== $new_status || 'publish' === $old_status ) {
		return;
	}
	if ( ! in_array( $post->post_type, array( 'post', 'tender', 'tc_event' ), true ) ) {
		return;
	}
	if ( ! tc_core_get_option( 'onesignal_auto_notify' ) ) {
		return;
	}

	$app_id   = tc_core_onesignal_app_id();
	$rest_key = trim( (string) tc_core_get_option( 'onesignal_rest_api_key', '' ) );
	if ( ! $app_id || ! $rest_key ) {
		return;
	}

	$labels = array(
		'post'     => 'כתבה חדשה: ',
		'tender'   => 'מכרז חדש: ',
		'tc_event' => 'אירוע חדש: ',
	);

	$body = array(
		'app_id'            => $app_id,
		'included_segments' => array( 'Subscribed Users' ),
		'headings'          => array( 'he' => get_bloginfo( 'name' ) ?: 'עיריית טירת כרמל' ),
		'contents'          => array( 'he' => $labels[ $post->post_type ] . wp_strip_all_tags( get_the_title( $post ) ) ),
		'url'               => get_permalink( $post ),
	);

	wp_remote_post( 'https://onesignal.com/api/v1/notifications', array(
		'timeout' => 15,
		'headers' => array(
			'Content-Type'  => 'application/json; charset=utf-8',
			'Authorization' => 'Key ' . $rest_key,
		),
		'body'    => wp_json_encode( $body ),
	) );
}
add_action( 'transition_post_status', 'tc_core_maybe_send_onesignal_notification', 10, 3 );
