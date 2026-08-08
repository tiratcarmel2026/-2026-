<?php
/**
 * שכבת גישה אחידה להגדרות האתר (option: tc_core_settings).
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function tc_core_get_settings() {
	$defaults = array(
		'phone'               => '04-1234567',
		'email'               => 'info@tirat-carmel.muni.il',
		'address'             => 'רח׳ הרצל 6, טירת כרמל',
		'call_center_title'   => 'מוקד 106 לשירותך 24/7',
		'call_center_subtitle'=> 'לפניות, דיווחים ושירות לתושב',
		'footer_slogan'       => 'טירת כרמל – עיר מתקדמת, איכותית וקהילתית בין כרמל לים.',
		'social_facebook'     => '',
		'social_instagram'    => '',
		'social_youtube'      => '',
		'social_whatsapp'     => '',
		'contact_page_url'    => '',
		'accessibility_page_url' => '',
		'onesignal_app_id'        => '',
		'onesignal_rest_api_key'  => '',
		'onesignal_auto_notify'   => '',
		'whatsapp_button_number'  => '',
		'emergency_banner_enabled' => '',
		'emergency_banner_message' => 'הודעת חירום: מידע מעודכן זמין בעמוד החירום ובמוקד 106.',
		'emergency_banner_link'    => '',
		'emergency_banner_link_label' => 'לפרטים נוספים',
		'cookie_consent_enabled'  => '1',
		'emergency_page_alert_mode'  => '',
		'emergency_page_alert_color' => '#e2483c',
	);
	$saved = get_option( 'tc_core_settings', array() );
	return wp_parse_args( $saved, $defaults );
}

/**
 * פונקציית עזר גלובלית (נקראת גם מהתבנית) - tc_option() בתבנית משתמשת בזה.
 */
function tc_core_get_option( $key, $default = '' ) {
	$settings = tc_core_get_settings();
	return isset( $settings[ $key ] ) && '' !== $settings[ $key ] ? $settings[ $key ] : $default;
}
