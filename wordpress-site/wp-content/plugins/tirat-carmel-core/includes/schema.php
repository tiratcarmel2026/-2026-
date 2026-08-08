<?php
/**
 * נתונים מובנים (Schema.org JSON-LD) עבור מנועי חיפוש - מסייע ל-Google
 * להציג את פרטי העירייה (טלפון, כתובת, שעות) ישירות בתוצאות החיפוש.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function tc_core_output_schema_org() {
	if ( ! is_front_page() ) {
		return;
	}

	$logo_id  = get_theme_mod( 'custom_logo' );
	$logo_url = $logo_id ? wp_get_attachment_image_url( $logo_id, 'full' ) : ( get_template_directory_uri() . '/assets/img/logo-tirat-carmel.png' );

	$data = array(
		'@context'  => 'https://schema.org',
		'@type'     => 'GovernmentOrganization',
		'name'      => get_bloginfo( 'name' ) ?: 'עיריית טירת כרמל',
		'url'       => home_url( '/' ),
		'logo'      => $logo_url,
		'telephone' => tc_core_get_option( 'phone' ),
		'address'   => array(
			'@type'           => 'PostalAddress',
			'streetAddress'   => tc_core_get_option( 'address' ),
			'addressLocality' => 'טירת כרמל',
			'addressCountry'  => 'IL',
		),
	);

	$socials = array_filter( array(
		tc_core_get_option( 'social_facebook' ),
		tc_core_get_option( 'social_instagram' ),
		tc_core_get_option( 'social_youtube' ),
	) );
	if ( $socials ) {
		$data['sameAs'] = array_values( $socials );
	}

	echo '<script type="application/ld+json">' . wp_json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . '</script>' . "\n";
}
add_action( 'wp_head', 'tc_core_output_schema_org' );
