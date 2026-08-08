<?php
/**
 * סוג תוכן מותאם: מחלקות ואנשי קשר (Departments).
 * מדריך מחלקות העירייה - שם, מנהל/ת, טלפון, מייל ושעות קבלת קהל.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function tc_core_register_department_cpt() {
	$labels = array(
		'name'          => __( 'מחלקות ואנשי קשר', 'tirat-carmel' ),
		'singular_name' => __( 'מחלקה', 'tirat-carmel' ),
		'add_new_item'  => __( 'הוספת מחלקה חדשה', 'tirat-carmel' ),
		'edit_item'     => __( 'עריכת מחלקה', 'tirat-carmel' ),
		'new_item'      => __( 'מחלקה חדשה', 'tirat-carmel' ),
		'view_item'     => __( 'צפייה במחלקה', 'tirat-carmel' ),
		'search_items'  => __( 'חיפוש מחלקות', 'tirat-carmel' ),
		'not_found'     => __( 'לא נמצאו מחלקות', 'tirat-carmel' ),
		'all_items'     => __( 'כל המחלקות', 'tirat-carmel' ),
		'menu_name'     => __( 'מחלקות ואנשי קשר', 'tirat-carmel' ),
	);

	register_post_type( 'department', array(
		'labels'        => $labels,
		'public'        => true,
		'has_archive'   => 'departments',
		'rewrite'       => array( 'slug' => 'departments', 'with_front' => false ),
		'menu_icon'     => 'dashicons-groups',
		'menu_position' => 27,
		'supports'      => array( 'title', 'editor', 'thumbnail', 'revisions' ),
		'show_in_rest'  => true,
		'rest_base'     => 'departments',
	) );
}
add_action( 'init', 'tc_core_register_department_cpt' );

function tc_core_register_department_metabox() {
	add_meta_box( 'tc_department_details', __( 'פרטי המחלקה', 'tirat-carmel' ), 'tc_core_render_department_metabox', 'department', 'normal', 'high' );
}
add_action( 'add_meta_boxes', 'tc_core_register_department_metabox' );

function tc_core_render_department_metabox( $post ) {
	wp_nonce_field( 'tc_department_save', 'tc_department_nonce' );
	$manager = get_post_meta( $post->ID, 'tc_department_manager', true );
	$phone   = get_post_meta( $post->ID, 'tc_department_phone', true );
	$email   = get_post_meta( $post->ID, 'tc_department_email', true );
	$hours   = get_post_meta( $post->ID, 'tc_department_hours', true );
	$room    = get_post_meta( $post->ID, 'tc_department_room', true );
	?>
	<p>
		<label for="tc_department_manager"><strong><?php esc_html_e( 'שם מנהל/ת המחלקה', 'tirat-carmel' ); ?></strong></label><br>
		<input type="text" class="widefat" id="tc_department_manager" name="tc_department_manager" value="<?php echo esc_attr( $manager ); ?>">
	</p>
	<p>
		<label for="tc_department_phone"><strong><?php esc_html_e( 'טלפון', 'tirat-carmel' ); ?></strong></label><br>
		<input type="text" class="widefat" id="tc_department_phone" name="tc_department_phone" value="<?php echo esc_attr( $phone ); ?>">
	</p>
	<p>
		<label for="tc_department_email"><strong><?php esc_html_e( 'דוא"ל', 'tirat-carmel' ); ?></strong></label><br>
		<input type="email" class="widefat" id="tc_department_email" name="tc_department_email" value="<?php echo esc_attr( $email ); ?>">
	</p>
	<p>
		<label for="tc_department_hours"><strong><?php esc_html_e( 'שעות קבלת קהל', 'tirat-carmel' ); ?></strong></label><br>
		<input type="text" class="widefat" id="tc_department_hours" name="tc_department_hours" value="<?php echo esc_attr( $hours ); ?>" placeholder="<?php esc_attr_e( 'א׳-ה׳ 08:00-16:00', 'tirat-carmel' ); ?>">
	</p>
	<p>
		<label for="tc_department_room"><strong><?php esc_html_e( 'מיקום / חדר בבניין העירייה', 'tirat-carmel' ); ?></strong></label><br>
		<input type="text" class="widefat" id="tc_department_room" name="tc_department_room" value="<?php echo esc_attr( $room ); ?>">
	</p>
	<?php
}

function tc_core_save_department_meta( $post_id ) {
	if ( ! isset( $_POST['tc_department_nonce'] ) || ! wp_verify_nonce( $_POST['tc_department_nonce'], 'tc_department_save' ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	$fields = array(
		'tc_department_manager' => 'sanitize_text_field',
		'tc_department_phone'   => 'sanitize_text_field',
		'tc_department_email'   => 'sanitize_email',
		'tc_department_hours'   => 'sanitize_text_field',
		'tc_department_room'    => 'sanitize_text_field',
	);
	foreach ( $fields as $field => $sanitizer ) {
		if ( isset( $_POST[ $field ] ) ) {
			update_post_meta( $post_id, $field, call_user_func( $sanitizer, wp_unslash( $_POST[ $field ] ) ) );
		}
	}
}
add_action( 'save_post_department', 'tc_core_save_department_meta' );

function tc_core_register_department_rest_fields() {
	$fields = array( 'tc_department_manager', 'tc_department_phone', 'tc_department_email', 'tc_department_hours', 'tc_department_room' );
	foreach ( $fields as $field ) {
		register_rest_field( 'department', $field, array(
			'get_callback' => function ( $object ) use ( $field ) {
				return get_post_meta( $object['id'], $field, true );
			},
			'schema'       => null,
		) );
	}
}
add_action( 'rest_api_init', 'tc_core_register_department_rest_fields' );
