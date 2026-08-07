<?php
/**
 * סוג תוכן מותאם: מכרזים (Tenders).
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function tc_core_register_tender_cpt() {
	$labels = array(
		'name'               => __( 'מכרזים', 'tirat-carmel' ),
		'singular_name'      => __( 'מכרז', 'tirat-carmel' ),
		'add_new_item'       => __( 'הוספת מכרז חדש', 'tirat-carmel' ),
		'edit_item'          => __( 'עריכת מכרז', 'tirat-carmel' ),
		'new_item'           => __( 'מכרז חדש', 'tirat-carmel' ),
		'view_item'          => __( 'צפייה במכרז', 'tirat-carmel' ),
		'search_items'       => __( 'חיפוש מכרזים', 'tirat-carmel' ),
		'not_found'          => __( 'לא נמצאו מכרזים', 'tirat-carmel' ),
		'all_items'          => __( 'כל המכרזים', 'tirat-carmel' ),
		'menu_name'          => __( 'מכרזים', 'tirat-carmel' ),
	);

	register_post_type( 'tender', array(
		'labels'        => $labels,
		'public'        => true,
		'has_archive'   => 'tenders',
		'rewrite'       => array( 'slug' => 'tenders', 'with_front' => false ),
		'menu_icon'     => 'dashicons-media-document',
		'menu_position' => 25,
		'supports'      => array( 'title', 'editor', 'excerpt', 'revisions', 'author' ),
		'show_in_rest'  => true,
		'rest_base'     => 'tenders',
	) );
}
add_action( 'init', 'tc_core_register_tender_cpt' );

function tc_core_tender_status_options() {
	return array(
		'auto'      => __( 'אוטומטי (לפי תאריך הגשה אחרון)', 'tirat-carmel' ),
		'cancelled' => __( 'בוטל', 'tirat-carmel' ),
	);
}

function tc_core_register_tender_metabox() {
	add_meta_box( 'tc_tender_details', __( 'פרטי המכרז', 'tirat-carmel' ), 'tc_core_render_tender_metabox', 'tender', 'normal', 'high' );
}
add_action( 'add_meta_boxes', 'tc_core_register_tender_metabox' );

function tc_core_render_tender_metabox( $post ) {
	wp_nonce_field( 'tc_tender_save', 'tc_tender_nonce' );
	$number   = get_post_meta( $post->ID, 'tc_tender_number', true );
	$publish  = get_post_meta( $post->ID, 'tc_tender_publish_date', true );
	$deadline = get_post_meta( $post->ID, 'tc_tender_deadline', true );
	$contact  = get_post_meta( $post->ID, 'tc_tender_contact', true );
	$status   = get_post_meta( $post->ID, 'tc_tender_status', true ) ?: 'auto';
	?>
	<p>
		<label for="tc_tender_number"><strong><?php esc_html_e( 'מספר מכרז', 'tirat-carmel' ); ?></strong></label><br>
		<input type="text" class="widefat" id="tc_tender_number" name="tc_tender_number" value="<?php echo esc_attr( $number ); ?>">
	</p>
	<p>
		<label for="tc_tender_publish_date"><strong><?php esc_html_e( 'תאריך פרסום', 'tirat-carmel' ); ?></strong></label><br>
		<input type="date" id="tc_tender_publish_date" name="tc_tender_publish_date" value="<?php echo esc_attr( $publish ); ?>">
	</p>
	<p>
		<label for="tc_tender_deadline"><strong><?php esc_html_e( 'מועד אחרון להגשה', 'tirat-carmel' ); ?></strong></label><br>
		<input type="date" id="tc_tender_deadline" name="tc_tender_deadline" value="<?php echo esc_attr( $deadline ); ?>">
	</p>
	<p>
		<label for="tc_tender_contact"><strong><?php esc_html_e( 'איש/ת קשר', 'tirat-carmel' ); ?></strong></label><br>
		<input type="text" class="widefat" id="tc_tender_contact" name="tc_tender_contact" value="<?php echo esc_attr( $contact ); ?>" placeholder="<?php esc_attr_e( 'שם, טלפון או מייל', 'tirat-carmel' ); ?>">
	</p>
	<p>
		<label for="tc_tender_status"><strong><?php esc_html_e( 'סטטוס', 'tirat-carmel' ); ?></strong></label><br>
		<select id="tc_tender_status" name="tc_tender_status">
			<?php foreach ( tc_core_tender_status_options() as $key => $label ) : ?>
				<option value="<?php echo esc_attr( $key ); ?>" <?php selected( $status, $key ); ?>><?php echo esc_html( $label ); ?></option>
			<?php endforeach; ?>
		</select>
		<span class="description"><?php esc_html_e( 'במצב אוטומטי, המכרז יסומן "סגור" אוטומטית אחרי מועד ההגשה האחרון.', 'tirat-carmel' ); ?></span>
	</p>
	<?php
}

function tc_core_save_tender_meta( $post_id ) {
	if ( ! isset( $_POST['tc_tender_nonce'] ) || ! wp_verify_nonce( $_POST['tc_tender_nonce'], 'tc_tender_save' ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	$fields = array(
		'tc_tender_number'       => 'sanitize_text_field',
		'tc_tender_publish_date' => 'sanitize_text_field',
		'tc_tender_deadline'     => 'sanitize_text_field',
		'tc_tender_contact'      => 'sanitize_text_field',
		'tc_tender_status'       => 'sanitize_text_field',
	);
	foreach ( $fields as $field => $sanitizer ) {
		if ( isset( $_POST[ $field ] ) ) {
			update_post_meta( $post_id, $field, call_user_func( $sanitizer, wp_unslash( $_POST[ $field ] ) ) );
		}
	}
}
add_action( 'save_post_tender', 'tc_core_save_tender_meta' );

/**
 * חשיפת שדות המכרז ב-REST API כדי שאפליקציה נייטיבית עתידית תוכל לצרוך אותם.
 */
function tc_core_register_tender_rest_fields() {
	$fields = array( 'tc_tender_number', 'tc_tender_publish_date', 'tc_tender_deadline', 'tc_tender_contact', 'tc_tender_status', 'tc_attachments' );
	foreach ( $fields as $field ) {
		register_rest_field( 'tender', $field, array(
			'get_callback' => function ( $object ) use ( $field ) {
				return get_post_meta( $object['id'], $field, true );
			},
			'schema'       => null,
		) );
	}
}
add_action( 'rest_api_init', 'tc_core_register_tender_rest_fields' );
