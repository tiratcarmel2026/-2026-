<?php
/**
 * טופס "הישארו מעודכנים" בפוטר - רישום למייל עדכונים.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function tc_core_newsletter_shortcode() {
	ob_start();
	$success = isset( $_GET['tc_newsletter'] ) && 'success' === $_GET['tc_newsletter'];
	?>
	<form class="tc-newsletter-form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
		<label class="screen-reader-text" for="tc-newsletter-email"><?php esc_html_e( 'כתובת דוא"ל לעדכונים', 'tirat-carmel' ); ?></label>
		<input type="email" id="tc-newsletter-email" name="tc_newsletter_email" placeholder="<?php esc_attr_e( 'כתובת דוא״ל', 'tirat-carmel' ); ?>" required>
		<input type="hidden" name="action" value="tc_newsletter_signup">
		<input type="hidden" name="tc_redirect" value="<?php echo esc_url( get_permalink() ?: home_url( '/' ) ); ?>">
		<?php wp_nonce_field( 'tc_newsletter_signup', 'tc_newsletter_nonce' ); ?>
		<button type="submit"><?php esc_html_e( 'הרשמה', 'tirat-carmel' ); ?></button>
	</form>
	<?php if ( $success ) : ?>
		<p role="status" style="color:#9ee08c;font-size:.85rem;margin-top:6px;"><?php esc_html_e( 'תודה שנרשמתם לעדכוני העירייה!', 'tirat-carmel' ); ?></p>
	<?php endif; ?>
	<?php
	return ob_get_clean();
}
add_shortcode( 'tc_newsletter_form', 'tc_core_newsletter_shortcode' );

function tc_core_handle_newsletter_signup() {
	if ( ! isset( $_POST['tc_newsletter_nonce'] ) || ! wp_verify_nonce( $_POST['tc_newsletter_nonce'], 'tc_newsletter_signup' ) ) {
		wp_die( esc_html__( 'בקשה לא תקינה.', 'tirat-carmel' ) );
	}

	$email = isset( $_POST['tc_newsletter_email'] ) ? sanitize_email( wp_unslash( $_POST['tc_newsletter_email'] ) ) : '';
	$redirect = isset( $_POST['tc_redirect'] ) ? esc_url_raw( wp_unslash( $_POST['tc_redirect'] ) ) : home_url( '/' );

	if ( is_email( $email ) ) {
		$subscribers = get_option( 'tc_core_newsletter_subscribers', array() );
		if ( ! in_array( $email, $subscribers, true ) ) {
			$subscribers[] = $email;
			update_option( 'tc_core_newsletter_subscribers', $subscribers );
		}
		$redirect = add_query_arg( 'tc_newsletter', 'success', $redirect );
	}

	wp_safe_redirect( $redirect );
	exit;
}
add_action( 'admin_post_tc_newsletter_signup', 'tc_core_handle_newsletter_signup' );
add_action( 'admin_post_nopriv_tc_newsletter_signup', 'tc_core_handle_newsletter_signup' );

/**
 * ייצוא רשימת הנרשמים ל-CSV מתוך מסך ההגדרות (לשימוש הצוות בלבד).
 */
function tc_core_register_newsletter_export_page() {
	add_submenu_page(
		'tc-core-settings',
		__( 'נרשמים לעדכונים', 'tirat-carmel' ),
		__( 'נרשמים לעדכונים', 'tirat-carmel' ),
		'manage_options',
		'tc-newsletter-subscribers',
		'tc_core_render_newsletter_subscribers_page'
	);
}
add_action( 'admin_menu', 'tc_core_register_newsletter_export_page' );

function tc_core_render_newsletter_subscribers_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$subscribers = get_option( 'tc_core_newsletter_subscribers', array() );
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'נרשמים לעדכוני העירייה', 'tirat-carmel' ); ?></h1>
		<p><?php printf( esc_html__( 'סה"כ %d נרשמים.', 'tirat-carmel' ), count( $subscribers ) ); ?></p>
		<textarea class="large-text code" rows="12" readonly><?php echo esc_textarea( implode( "\n", $subscribers ) ); ?></textarea>
		<p class="description"><?php esc_html_e( 'ניתן להעתיק את הרשימה ולייבא לכלי דיוור (למשל Mailchimp / SendGrid).', 'tirat-carmel' ); ?></p>
	</div>
	<?php
}
