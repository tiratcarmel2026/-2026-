<?php
/**
 * כפתור וואטסאפ צף - יצירת קשר מהירה עם מוקד/מוקדנית העירייה.
 * שדה נפרד מקישור הרשתות החברתיות בפוטר, כי כאן מדובר במספר טלפון לצ'אט ישיר.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function tc_core_whatsapp_number() {
	$number = trim( (string) tc_core_get_option( 'whatsapp_button_number', '' ) );
	return preg_replace( '/[^0-9]/', '', $number );
}

function tc_render_whatsapp_button() {
	$number = tc_core_whatsapp_number();
	if ( ! $number ) {
		return;
	}
	$url = 'https://wa.me/' . $number;
	?>
	<a href="<?php echo esc_url( $url ); ?>" id="tc-whatsapp-button" class="tc-whatsapp-button" target="_blank" rel="noopener noreferrer" aria-label="<?php esc_attr_e( 'פנייה בוואטסאפ לעירייה', 'tirat-carmel' ); ?>">
		<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Zm0 2a7 7 0 0 1 6 10.6l-.3.5.6 2.3-2.4-.6-.5.3A7 7 0 1 1 12 5Zm-3.4 3.2c-.2 0-.5.1-.7.4-.2.3-.9.9-.9 2.1s.9 2.5 1 2.6c.1.2 1.8 2.9 4.5 4 2.2.9 2.6.7 3.1.7.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.1.1-1.3-.1-.1-.3-.2-.6-.4-.3-.2-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.9 1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.5-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.6-.9-2.1-.2-.5-.4-.4-.6-.4Z"/></svg>
	</a>
	<style>
		.tc-whatsapp-button {
			position: fixed; bottom: 20px; right: 92px; z-index: 3400;
			width: 54px; height: 54px; border-radius: 50%;
			background: #25D366; color: #fff; display: flex; align-items: center; justify-content: center;
			box-shadow: 0 6px 20px rgba(0,0,0,0.25);
		}
		.tc-whatsapp-button svg { width: 28px; height: 28px; }
		.tc-whatsapp-button:hover { background: #1ebe5a; }
		@media (max-width: 480px) {
			.tc-whatsapp-button { bottom: 12px; right: 78px; width: 48px; height: 48px; }
			.tc-whatsapp-button svg { width: 24px; height: 24px; }
		}
	</style>
	<?php
}
