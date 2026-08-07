<?php
/**
 * נקודות קצה מותאמות ב-REST API - עבור בוט הניווט וכל אפליקציה נייטיבית עתידית
 * שתצרוך את תוכן האתר (מכרזים, אירועים, כרטיסי שירות).
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function tc_core_register_rest_routes() {
	register_rest_route( 'tirat-carmel/v1', '/chatbot-intents', array(
		'methods'             => 'GET',
		'callback'            => 'tc_core_rest_get_chatbot_intents',
		'permission_callback' => '__return_true',
	) );

	register_rest_route( 'tirat-carmel/v1', '/service-cards', array(
		'methods'             => 'GET',
		'callback'            => 'tc_core_rest_get_service_cards',
		'permission_callback' => '__return_true',
	) );

	register_rest_route( 'tirat-carmel/v1', '/site-settings', array(
		'methods'             => 'GET',
		'callback'            => 'tc_core_rest_get_site_settings',
		'permission_callback' => '__return_true',
	) );
}
add_action( 'rest_api_init', 'tc_core_register_rest_routes' );

function tc_core_rest_get_chatbot_intents() {
	return rest_ensure_response( function_exists( 'tc_core_get_chatbot_intents' ) ? tc_core_get_chatbot_intents() : array() );
}

function tc_core_rest_get_service_cards() {
	return rest_ensure_response( function_exists( 'tc_get_service_cards' ) ? tc_get_service_cards() : array() );
}

function tc_core_rest_get_site_settings() {
	$s = tc_core_get_settings();
	unset( $s['email'] ); // לא לחשוף מייל גולמי ב-API ציבורי ללא צורך.
	return rest_ensure_response( $s );
}
