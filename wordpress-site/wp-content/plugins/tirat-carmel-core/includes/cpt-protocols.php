<?php
/**
 * סוג תוכן מותאם: פרוטוקולים ושקיפות (Protocols / Transparency).
 * לפרסום פרוטוקולי ישיבות מועצה, תקציב, דוחות כספיים ושכר בכירים -
 * כנדרש בחוק חופש המידע ותקנות חובת הגילוי לרשויות מקומיות.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function tc_core_protocol_type_options() {
	return array(
		'council'  => __( 'פרוטוקול ישיבת מועצה', 'tirat-carmel' ),
		'budget'   => __( 'תקציב עירייה', 'tirat-carmel' ),
		'finance'  => __( 'דוח כספי', 'tirat-carmel' ),
		'salaries' => __( 'שכר בכירים', 'tirat-carmel' ),
		'other'    => __( 'מסמך שקיפות אחר', 'tirat-carmel' ),
	);
}

function tc_core_register_protocol_cpt() {
	$labels = array(
		'name'          => __( 'פרוטוקולים ושקיפות', 'tirat-carmel' ),
		'singular_name' => __( 'מסמך שקיפות', 'tirat-carmel' ),
		'add_new_item'  => __( 'הוספת מסמך שקיפות חדש', 'tirat-carmel' ),
		'edit_item'     => __( 'עריכת מסמך שקיפות', 'tirat-carmel' ),
		'new_item'      => __( 'מסמך שקיפות חדש', 'tirat-carmel' ),
		'view_item'     => __( 'צפייה במסמך', 'tirat-carmel' ),
		'search_items'  => __( 'חיפוש מסמכים', 'tirat-carmel' ),
		'not_found'     => __( 'לא נמצאו מסמכים', 'tirat-carmel' ),
		'all_items'     => __( 'כל המסמכים', 'tirat-carmel' ),
		'menu_name'     => __( 'פרוטוקולים ושקיפות', 'tirat-carmel' ),
	);

	register_post_type( 'protocol', array(
		'labels'        => $labels,
		'public'        => true,
		'has_archive'   => 'transparency',
		'rewrite'       => array( 'slug' => 'transparency', 'with_front' => false ),
		'menu_icon'     => 'dashicons-media-spreadsheet',
		'menu_position' => 28,
		'supports'      => array( 'title', 'editor', 'excerpt', 'revisions', 'author' ),
		'show_in_rest'  => true,
		'rest_base'     => 'protocols',
	) );
}
add_action( 'init', 'tc_core_register_protocol_cpt' );

function tc_core_register_protocol_metabox() {
	add_meta_box( 'tc_protocol_details', __( 'פרטי המסמך', 'tirat-carmel' ), 'tc_core_render_protocol_metabox', 'protocol', 'normal', 'high' );
}
add_action( 'add_meta_boxes', 'tc_core_register_protocol_metabox' );

function tc_core_render_protocol_metabox( $post ) {
	wp_nonce_field( 'tc_protocol_save', 'tc_protocol_nonce' );
	$type   = get_post_meta( $post->ID, 'tc_protocol_type', true ) ?: 'council';
	$date   = get_post_meta( $post->ID, 'tc_protocol_date', true );
	$number = get_post_meta( $post->ID, 'tc_protocol_number', true );
	?>
	<p>
		<label for="tc_protocol_type"><strong><?php esc_html_e( 'סוג מסמך', 'tirat-carmel' ); ?></strong></label><br>
		<select id="tc_protocol_type" name="tc_protocol_type">
			<?php foreach ( tc_core_protocol_type_options() as $key => $label ) : ?>
				<option value="<?php echo esc_attr( $key ); ?>" <?php selected( $type, $key ); ?>><?php echo esc_html( $label ); ?></option>
			<?php endforeach; ?>
		</select>
	</p>
	<p>
		<label for="tc_protocol_date"><strong><?php esc_html_e( 'תאריך הישיבה / המסמך', 'tirat-carmel' ); ?></strong></label><br>
		<input type="date" id="tc_protocol_date" name="tc_protocol_date" value="<?php echo esc_attr( $date ); ?>">
	</p>
	<p>
		<label for="tc_protocol_number"><strong><?php esc_html_e( 'מספר ישיבה / מסמך (אופציונלי)', 'tirat-carmel' ); ?></strong></label><br>
		<input type="text" class="widefat" id="tc_protocol_number" name="tc_protocol_number" value="<?php echo esc_attr( $number ); ?>">
	</p>
	<p class="description"><?php esc_html_e( 'ניתן לצרף את קובץ הפרוטוקול/המסמך בתיבת "קבצים מצורפים" למטה.', 'tirat-carmel' ); ?></p>
	<?php
}

function tc_core_save_protocol_meta( $post_id ) {
	if ( ! isset( $_POST['tc_protocol_nonce'] ) || ! wp_verify_nonce( $_POST['tc_protocol_nonce'], 'tc_protocol_save' ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	$fields = array(
		'tc_protocol_type'   => 'sanitize_key',
		'tc_protocol_date'   => 'sanitize_text_field',
		'tc_protocol_number' => 'sanitize_text_field',
	);
	foreach ( $fields as $field => $sanitizer ) {
		if ( isset( $_POST[ $field ] ) ) {
			update_post_meta( $post_id, $field, call_user_func( $sanitizer, wp_unslash( $_POST[ $field ] ) ) );
		}
	}
}
add_action( 'save_post_protocol', 'tc_core_save_protocol_meta' );

function tc_core_register_protocol_rest_fields() {
	$fields = array( 'tc_protocol_type', 'tc_protocol_date', 'tc_protocol_number', 'tc_attachments' );
	foreach ( $fields as $field ) {
		register_rest_field( 'protocol', $field, array(
			'get_callback' => function ( $object ) use ( $field ) {
				return get_post_meta( $object['id'], $field, true );
			},
			'schema'       => null,
		) );
	}
}
add_action( 'rest_api_init', 'tc_core_register_protocol_rest_fields' );

function tc_core_protocol_type_label( $post_id ) {
	$type = get_post_meta( $post_id, 'tc_protocol_type', true ) ?: 'council';
	$options = tc_core_protocol_type_options();
	return $options[ $type ] ?? $options['other'];
}
