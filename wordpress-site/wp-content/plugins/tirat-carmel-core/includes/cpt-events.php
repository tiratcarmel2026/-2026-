<?php
/**
 * סוג תוכן מותאם: אירועים (Events).
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function tc_core_register_event_cpt() {
	$labels = array(
		'name'          => __( 'אירועים', 'tirat-carmel' ),
		'singular_name' => __( 'אירוע', 'tirat-carmel' ),
		'add_new_item'  => __( 'הוספת אירוע חדש', 'tirat-carmel' ),
		'edit_item'     => __( 'עריכת אירוע', 'tirat-carmel' ),
		'new_item'      => __( 'אירוע חדש', 'tirat-carmel' ),
		'view_item'     => __( 'צפייה באירוע', 'tirat-carmel' ),
		'search_items'  => __( 'חיפוש אירועים', 'tirat-carmel' ),
		'not_found'     => __( 'לא נמצאו אירועים', 'tirat-carmel' ),
		'all_items'     => __( 'כל האירועים', 'tirat-carmel' ),
		'menu_name'     => __( 'אירועים', 'tirat-carmel' ),
	);

	register_post_type( 'tc_event', array(
		'labels'        => $labels,
		'public'        => true,
		'has_archive'   => 'events',
		'rewrite'       => array( 'slug' => 'events', 'with_front' => false ),
		'menu_icon'     => 'dashicons-calendar-alt',
		'menu_position' => 26,
		'supports'      => array( 'title', 'editor', 'excerpt', 'thumbnail', 'revisions', 'author' ),
		'show_in_rest'  => true,
		'rest_base'     => 'events',
	) );
}
add_action( 'init', 'tc_core_register_event_cpt' );

function tc_core_register_event_metabox() {
	add_meta_box( 'tc_event_details', __( 'פרטי האירוע', 'tirat-carmel' ), 'tc_core_render_event_metabox', 'tc_event', 'normal', 'high' );
}
add_action( 'add_meta_boxes', 'tc_core_register_event_metabox' );

function tc_core_render_event_metabox( $post ) {
	wp_nonce_field( 'tc_event_save', 'tc_event_nonce' );
	$date     = get_post_meta( $post->ID, 'tc_event_date', true );
	$time     = get_post_meta( $post->ID, 'tc_event_time', true );
	$location = get_post_meta( $post->ID, 'tc_event_location', true );
	$link     = get_post_meta( $post->ID, 'tc_event_link', true );
	?>
	<p>
		<label for="tc_event_date"><strong><?php esc_html_e( 'תאריך האירוע', 'tirat-carmel' ); ?></strong></label><br>
		<input type="date" id="tc_event_date" name="tc_event_date" value="<?php echo esc_attr( $date ); ?>">
	</p>
	<p>
		<label for="tc_event_time"><strong><?php esc_html_e( 'שעה', 'tirat-carmel' ); ?></strong></label><br>
		<input type="time" id="tc_event_time" name="tc_event_time" value="<?php echo esc_attr( $time ); ?>">
	</p>
	<p>
		<label for="tc_event_location"><strong><?php esc_html_e( 'מיקום', 'tirat-carmel' ); ?></strong></label><br>
		<input type="text" class="widefat" id="tc_event_location" name="tc_event_location" value="<?php echo esc_attr( $location ); ?>" placeholder="<?php esc_attr_e( 'לדוגמה: חצר בית לדהים', 'tirat-carmel' ); ?>">
	</p>
	<p>
		<label for="tc_event_link"><strong><?php esc_html_e( 'קישור להרשמה / למידע נוסף (אופציונלי)', 'tirat-carmel' ); ?></strong></label><br>
		<input type="url" class="widefat" id="tc_event_link" name="tc_event_link" value="<?php echo esc_attr( $link ); ?>" placeholder="https://">
	</p>
	<?php
}

function tc_core_save_event_meta( $post_id ) {
	if ( ! isset( $_POST['tc_event_nonce'] ) || ! wp_verify_nonce( $_POST['tc_event_nonce'], 'tc_event_save' ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	if ( isset( $_POST['tc_event_date'] ) ) {
		update_post_meta( $post_id, 'tc_event_date', sanitize_text_field( wp_unslash( $_POST['tc_event_date'] ) ) );
	}
	if ( isset( $_POST['tc_event_time'] ) ) {
		update_post_meta( $post_id, 'tc_event_time', sanitize_text_field( wp_unslash( $_POST['tc_event_time'] ) ) );
	}
	if ( isset( $_POST['tc_event_location'] ) ) {
		update_post_meta( $post_id, 'tc_event_location', sanitize_text_field( wp_unslash( $_POST['tc_event_location'] ) ) );
	}
	if ( isset( $_POST['tc_event_link'] ) ) {
		update_post_meta( $post_id, 'tc_event_link', esc_url_raw( wp_unslash( $_POST['tc_event_link'] ) ) );
	}
}
add_action( 'save_post_tc_event', 'tc_core_save_event_meta' );

function tc_core_register_event_rest_fields() {
	$fields = array( 'tc_event_date', 'tc_event_time', 'tc_event_location', 'tc_event_link' );
	foreach ( $fields as $field ) {
		register_rest_field( 'tc_event', $field, array(
			'get_callback' => function ( $object ) use ( $field ) {
				return get_post_meta( $object['id'], $field, true );
			},
			'schema'       => null,
		) );
	}
}
add_action( 'rest_api_init', 'tc_core_register_event_rest_fields' );
