<?php
/**
 * בוט ניווט צף - עוזר לתושבים למצוא את הדף הנכון באתר (מכרזים, תשלומים, אירועים וכו').
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div id="tc-chatbot-widget">
	<button type="button" id="tc-chatbot-toggle" aria-haspopup="dialog" aria-expanded="false" aria-controls="tc-chatbot-panel">
		<?php tc_icon( 'chat' ); ?>
		<span class="screen-reader-text"><?php esc_html_e( 'פתיחת בוט הניווט', 'tirat-carmel' ); ?></span>
	</button>

	<div id="tc-chatbot-panel" role="dialog" aria-modal="false" aria-label="<?php esc_attr_e( 'בוט ניווט', 'tirat-carmel' ); ?>" hidden>
		<div class="tc-chatbot__header">
			<div>
				<strong><?php esc_html_e( 'עוזר הניווט של העירייה', 'tirat-carmel' ); ?></strong>
				<span><?php esc_html_e( 'שאלו אותי לאן ללכת באתר', 'tirat-carmel' ); ?></span>
			</div>
			<button type="button" id="tc-chatbot-close" aria-label="<?php esc_attr_e( 'סגירת בוט הניווט', 'tirat-carmel' ); ?>">×</button>
		</div>

		<div class="tc-chatbot__messages" id="tc-chatbot-messages" role="log" aria-live="polite"></div>

		<div class="tc-chatbot__quick-replies" id="tc-chatbot-quick-replies"></div>

		<form class="tc-chatbot__form" id="tc-chatbot-form">
			<label class="screen-reader-text" for="tc-chatbot-input"><?php esc_html_e( 'הקלידו שאלה', 'tirat-carmel' ); ?></label>
			<input type="text" id="tc-chatbot-input" autocomplete="off" placeholder="<?php esc_attr_e( 'לדוגמה: איך משלמים ארנונה?', 'tirat-carmel' ); ?>">
			<button type="submit"><?php esc_html_e( 'שליחה', 'tirat-carmel' ); ?></button>
		</form>
	</div>
</div>
