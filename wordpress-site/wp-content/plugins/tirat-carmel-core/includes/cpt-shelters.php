<?php
/**
 * סוג תוכן מותאם: מקלטים ציבוריים (Shelters), ומפה אינטראקטיבית להצגתם.
 * המפה מבוססת על Leaflet.js (קוד פתוח, ללא צורך במפתח API כלשהו) עם
 * אריחי OpenStreetMap - טעונה מקומית מהתוסף, לא תלויה בשירות חיצוני בתשלום.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function tc_core_register_shelter_cpt() {
	$labels = array(
		'name'          => __( 'מקלטים ציבוריים', 'tirat-carmel' ),
		'singular_name' => __( 'מקלט', 'tirat-carmel' ),
		'add_new_item'  => __( 'הוספת מקלט חדש', 'tirat-carmel' ),
		'edit_item'     => __( 'עריכת מקלט', 'tirat-carmel' ),
		'new_item'      => __( 'מקלט חדש', 'tirat-carmel' ),
		'search_items'  => __( 'חיפוש מקלטים', 'tirat-carmel' ),
		'not_found'     => __( 'לא נמצאו מקלטים', 'tirat-carmel' ),
		'all_items'     => __( 'כל המקלטים', 'tirat-carmel' ),
		'menu_name'     => __( 'מקלטים ציבוריים', 'tirat-carmel' ),
	);

	register_post_type( 'shelter', array(
		'labels'        => $labels,
		'public'        => true,
		'has_archive'   => false,
		'publicly_queryable' => false,
		'rewrite'       => false,
		'menu_icon'     => 'dashicons-shield',
		'menu_position' => 29,
		'supports'      => array( 'title' ),
		'show_in_rest'  => true,
		'rest_base'     => 'shelters',
	) );
}
add_action( 'init', 'tc_core_register_shelter_cpt' );

function tc_core_register_shelter_metabox() {
	add_meta_box( 'tc_shelter_details', __( 'פרטי המקלט', 'tirat-carmel' ), 'tc_core_render_shelter_metabox', 'shelter', 'normal', 'high' );
}
add_action( 'add_meta_boxes', 'tc_core_register_shelter_metabox' );

function tc_core_render_shelter_metabox( $post ) {
	wp_nonce_field( 'tc_shelter_save', 'tc_shelter_nonce' );
	$lat        = get_post_meta( $post->ID, 'tc_shelter_lat', true );
	$lng        = get_post_meta( $post->ID, 'tc_shelter_lng', true );
	$address    = get_post_meta( $post->ID, 'tc_shelter_address', true );
	$capacity   = get_post_meta( $post->ID, 'tc_shelter_capacity', true );
	$accessible = get_post_meta( $post->ID, 'tc_shelter_accessible', true );
	$notes      = get_post_meta( $post->ID, 'tc_shelter_notes', true );
	?>
	<p class="description"><?php esc_html_e( 'כותרת הפוסט = שם/מספר המקלט לזיהוי (למשל "מקלט ציבורי - רח\' הרצל 6").', 'tirat-carmel' ); ?></p>
	<p>
		<label for="tc_shelter_address"><strong><?php esc_html_e( 'כתובת', 'tirat-carmel' ); ?></strong></label><br>
		<input type="text" class="widefat" id="tc_shelter_address" name="tc_shelter_address" value="<?php echo esc_attr( $address ); ?>">
	</p>
	<p>
		<label for="tc_shelter_lat"><strong><?php esc_html_e( 'קו רוחב (Latitude)', 'tirat-carmel' ); ?></strong></label><br>
		<input type="text" inputmode="decimal" id="tc_shelter_lat" name="tc_shelter_lat" value="<?php echo esc_attr( $lat ); ?>" placeholder="32.7623">
	</p>
	<p>
		<label for="tc_shelter_lng"><strong><?php esc_html_e( 'קו אורך (Longitude)', 'tirat-carmel' ); ?></strong></label><br>
		<input type="text" inputmode="decimal" id="tc_shelter_lng" name="tc_shelter_lng" value="<?php echo esc_attr( $lng ); ?>" placeholder="34.9718">
	</p>
	<p class="description">
		<?php esc_html_e( 'לאיתור קואורדינטות: פתחו את Google Maps, לחצו לחיצה ימנית על המיקום המדויק והעתיקו את שני המספרים המוצגים.', 'tirat-carmel' ); ?>
	</p>
	<p>
		<label for="tc_shelter_capacity"><strong><?php esc_html_e( 'קיבולת (מספר אנשים משוער)', 'tirat-carmel' ); ?></strong></label><br>
		<input type="number" min="0" id="tc_shelter_capacity" name="tc_shelter_capacity" value="<?php echo esc_attr( $capacity ); ?>">
	</p>
	<p>
		<label><input type="checkbox" name="tc_shelter_accessible" value="1" <?php checked( $accessible, '1' ); ?>> <?php esc_html_e( 'נגיש לאנשים עם מוגבלות', 'tirat-carmel' ); ?></label>
	</p>
	<p>
		<label for="tc_shelter_notes"><strong><?php esc_html_e( 'הערות נוספות', 'tirat-carmel' ); ?></strong></label><br>
		<textarea class="widefat" rows="2" id="tc_shelter_notes" name="tc_shelter_notes"><?php echo esc_textarea( $notes ); ?></textarea>
	</p>
	<?php
}

function tc_core_save_shelter_meta( $post_id ) {
	if ( ! isset( $_POST['tc_shelter_nonce'] ) || ! wp_verify_nonce( $_POST['tc_shelter_nonce'], 'tc_shelter_save' ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	$fields = array(
		'tc_shelter_lat'      => 'sanitize_text_field',
		'tc_shelter_lng'      => 'sanitize_text_field',
		'tc_shelter_address'  => 'sanitize_text_field',
		'tc_shelter_capacity' => 'absint',
		'tc_shelter_notes'    => 'sanitize_textarea_field',
	);
	foreach ( $fields as $field => $sanitizer ) {
		if ( isset( $_POST[ $field ] ) ) {
			update_post_meta( $post_id, $field, call_user_func( $sanitizer, wp_unslash( $_POST[ $field ] ) ) );
		}
	}
	update_post_meta( $post_id, 'tc_shelter_accessible', isset( $_POST['tc_shelter_accessible'] ) ? '1' : '' );
}
add_action( 'save_post_shelter', 'tc_core_save_shelter_meta' );

function tc_core_register_shelter_rest_fields() {
	$fields = array( 'tc_shelter_lat', 'tc_shelter_lng', 'tc_shelter_address', 'tc_shelter_capacity', 'tc_shelter_accessible', 'tc_shelter_notes' );
	foreach ( $fields as $field ) {
		register_rest_field( 'shelter', $field, array(
			'get_callback' => function ( $object ) use ( $field ) {
				return get_post_meta( $object['id'], $field, true );
			},
			'schema'       => null,
		) );
	}
}
add_action( 'rest_api_init', 'tc_core_register_shelter_rest_fields' );

/**
 * REST endpoint ציבורי ומצומצם למפת המקלטים - רק השדות הדרושים למפה,
 * כדי לא לחשוף שדות תוכן מיותרים ולהקטין את גודל התגובה.
 */
function tc_core_register_shelters_map_route() {
	register_rest_route( 'tirat-carmel/v1', '/shelters', array(
		'methods'             => 'GET',
		'callback'            => 'tc_core_rest_get_shelters_map',
		'permission_callback' => '__return_true',
	) );
}
add_action( 'rest_api_init', 'tc_core_register_shelters_map_route' );

function tc_core_rest_get_shelters_map() {
	$posts = get_posts( array(
		'post_type'      => 'shelter',
		'posts_per_page' => -1,
		'post_status'    => 'publish',
	) );

	$items = array();
	foreach ( $posts as $post ) {
		$lat = get_post_meta( $post->ID, 'tc_shelter_lat', true );
		$lng = get_post_meta( $post->ID, 'tc_shelter_lng', true );
		if ( '' === $lat || '' === $lng ) {
			continue;
		}
		$items[] = array(
			'title'      => get_the_title( $post ),
			'lat'        => (float) $lat,
			'lng'        => (float) $lng,
			'address'    => get_post_meta( $post->ID, 'tc_shelter_address', true ),
			'capacity'   => get_post_meta( $post->ID, 'tc_shelter_capacity', true ),
			'accessible' => (bool) get_post_meta( $post->ID, 'tc_shelter_accessible', true ),
			'notes'      => get_post_meta( $post->ID, 'tc_shelter_notes', true ),
		);
	}

	return rest_ensure_response( $items );
}

/**
 * Shortcode: ‎[tc_shelter_map]‎ - מציג את מפת המקלטים בכל עמוד (למשל בעמוד "חירום").
 */
function tc_core_shelter_map_shortcode( $atts ) {
	$atts = shortcode_atts( array(
		'height' => '420px',
		'zoom'   => '13',
		'lat'    => '32.7623',
		'lng'    => '34.9718',
	), $atts );

	wp_enqueue_style( 'tc-leaflet', TC_CORE_URL . 'vendor/leaflet/leaflet.css', array(), '1.9.4' );
	wp_enqueue_script( 'tc-leaflet', TC_CORE_URL . 'vendor/leaflet/leaflet.js', array(), '1.9.4', true );
	wp_enqueue_script( 'tc-shelter-map', TC_CORE_URL . 'assets/js/shelter-map.js', array( 'tc-leaflet' ), TC_CORE_VERSION, true );
	wp_localize_script( 'tc-shelter-map', 'tcShelterMap', array(
		'restUrl'    => esc_url_raw( rest_url( 'tirat-carmel/v1/shelters' ) ),
		'iconsUrl'   => TC_CORE_URL . 'vendor/leaflet/images/',
		'centerLat'  => (float) $atts['lat'],
		'centerLng'  => (float) $atts['lng'],
		'zoom'       => (int) $atts['zoom'],
		'strings'    => array(
			'capacity'   => __( 'קיבולת', 'tirat-carmel' ),
			'accessible' => __( 'נגיש לאנשים עם מוגבלות', 'tirat-carmel' ),
			'loading'    => __( 'טוען מיקומי מקלטים…', 'tirat-carmel' ),
			'empty'      => __( 'טרם הוזנו מקלטים במערכת.', 'tirat-carmel' ),
		),
	) );

	$id = 'tc-shelter-map-' . wp_unique_id();
	return sprintf(
		'<div class="tc-shelter-map-wrap"><div id="%1$s" class="tc-shelter-map" style="height:%2$s;" role="application" aria-label="%3$s"></div><p id="%1$s-status" class="tc-shelter-map__status"></p></div>',
		esc_attr( $id ),
		esc_attr( $atts['height'] ),
		esc_attr__( 'מפת מקלטים ציבוריים', 'tirat-carmel' )
	);
}
add_shortcode( 'tc_shelter_map', 'tc_core_shelter_map_shortcode' );

function tc_core_shelter_map_styles() {
	?>
	<style>
		.tc-shelter-map-wrap { margin: 20px 0; }
		.tc-shelter-map { width: 100%; border-radius: var(--tc-radius, 14px); border: 1px solid var(--tc-border, #e1e8ef); z-index: 1; }
		.tc-shelter-map__status { font-size: 0.85rem; color: var(--tc-text-muted, #5b6b7c); margin-top: 8px; }
		.tc-shelter-popup h4 { margin: 0 0 4px; color: var(--tc-navy, #023f8a); }
		.tc-shelter-popup p { margin: 0 0 4px; font-size: 0.85rem; }
		.tc-shelter-popup .tc-shelter-popup__accessible { color: #3c8527; font-weight: 700; }
	</style>
	<?php
}
add_action( 'wp_head', 'tc_core_shelter_map_styles' );
