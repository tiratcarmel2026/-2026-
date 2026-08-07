<?php
/**
 * תפריט ניהול עליון: "עיריית טירת כרמל" - נקודת כניסה לכל הגדרות האתר.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function tc_core_register_admin_menu() {
	add_menu_page(
		__( 'עיריית טירת כרמל', 'tirat-carmel' ),
		__( 'עיריית טירת כרמל', 'tirat-carmel' ),
		'manage_options',
		'tc-core-settings',
		'tc_core_render_settings_page',
		'dashicons-building',
		3
	);
}
add_action( 'admin_menu', 'tc_core_register_admin_menu' );
