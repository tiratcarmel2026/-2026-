<?php
/**
 * הגדרות תצוגה לעמוד פנימי בודד: כותרת משנה מתחת לכותרת הראשית, והצגה/הסתרה של סרגל צד.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function tc_core_register_page_options_metabox() {
	add_meta_box( 'tc_page_options', __( 'הגדרות תצוגת העמוד', 'tirat-carmel' ), 'tc_core_render_page_options_metabox', 'page', 'side', 'default' );
}
add_action( 'add_meta_boxes', 'tc_core_register_page_options_metabox' );

function tc_core_render_page_options_metabox( $post ) {
	wp_nonce_field( 'tc_page_options_save', 'tc_page_options_nonce' );
	$subtitle = get_post_meta( $post->ID, 'tc_page_subtitle', true );
	$hide_sidebar = get_post_meta( $post->ID, 'tc_hide_sidebar', true );
	?>
	<p>
		<label for="tc_page_subtitle"><strong><?php esc_html_e( 'כותרת משנה (מתחת לכותרת הראשית)', 'tirat-carmel' ); ?></strong></label><br>
		<input type="text" class="widefat" id="tc_page_subtitle" name="tc_page_subtitle" value="<?php echo esc_attr( $subtitle ); ?>">
	</p>
	<p>
		<label><input type="checkbox" name="tc_hide_sidebar" value="1" <?php checked( $hide_sidebar, '1' ); ?>> <?php esc_html_e( 'הסתרת סרגל צד בעמוד זה', 'tirat-carmel' ); ?></label>
	</p>
	<?php
}

function tc_core_save_page_options( $post_id ) {
	if ( ! isset( $_POST['tc_page_options_nonce'] ) || ! wp_verify_nonce( $_POST['tc_page_options_nonce'], 'tc_page_options_save' ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	update_post_meta( $post_id, 'tc_page_subtitle', isset( $_POST['tc_page_subtitle'] ) ? sanitize_text_field( wp_unslash( $_POST['tc_page_subtitle'] ) ) : '' );
	update_post_meta( $post_id, 'tc_hide_sidebar', isset( $_POST['tc_hide_sidebar'] ) ? '1' : '' );
}
add_action( 'save_post_page', 'tc_core_save_page_options' );
