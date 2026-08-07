<?php
/**
 * ווידג'ט נגישות צף - תואם להנחיות תקן ישראלי 5568 (מבוסס WCAG 2.0 רמה AA).
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div id="tc-accessibility-widget">
	<button type="button" id="tc-a11y-toggle" aria-haspopup="dialog" aria-expanded="false" aria-controls="tc-a11y-panel">
		<?php tc_icon( 'accessibility' ); ?>
		<span class="screen-reader-text"><?php esc_html_e( 'תפריט נגישות', 'tirat-carmel' ); ?></span>
	</button>

	<div id="tc-a11y-panel" role="dialog" aria-modal="false" aria-label="<?php esc_attr_e( 'תפריט נגישות', 'tirat-carmel' ); ?>" hidden>
		<div class="tc-a11y-panel__header">
			<h2><?php esc_html_e( 'הגדרות נגישות', 'tirat-carmel' ); ?></h2>
			<button type="button" id="tc-a11y-close" aria-label="<?php esc_attr_e( 'סגירת תפריט נגישות', 'tirat-carmel' ); ?>">×</button>
		</div>

		<div class="tc-a11y-panel__body">
			<div class="tc-a11y-group" role="group" aria-label="<?php esc_attr_e( 'גודל טקסט', 'tirat-carmel' ); ?>">
				<span class="tc-a11y-group__label"><?php esc_html_e( 'גודל טקסט', 'tirat-carmel' ); ?></span>
				<div class="tc-a11y-group__buttons">
					<button type="button" data-a11y-action="font-dec" aria-label="<?php esc_attr_e( 'הקטנת טקסט', 'tirat-carmel' ); ?>">A-</button>
					<button type="button" data-a11y-action="font-reset" aria-label="<?php esc_attr_e( 'איפוס גודל טקסט', 'tirat-carmel' ); ?>">A</button>
					<button type="button" data-a11y-action="font-inc" aria-label="<?php esc_attr_e( 'הגדלת טקסט', 'tirat-carmel' ); ?>">A+</button>
				</div>
			</div>

			<button type="button" class="tc-a11y-toggle-btn" data-a11y-toggle="contrast"><?php esc_html_e( 'ניגודיות גבוהה', 'tirat-carmel' ); ?></button>
			<button type="button" class="tc-a11y-toggle-btn" data-a11y-toggle="dark"><?php esc_html_e( 'מצב כהה', 'tirat-carmel' ); ?></button>
			<button type="button" class="tc-a11y-toggle-btn" data-a11y-toggle="grayscale"><?php esc_html_e( 'גווני אפור', 'tirat-carmel' ); ?></button>
			<button type="button" class="tc-a11y-toggle-btn" data-a11y-toggle="underline-links"><?php esc_html_e( 'הדגשת קישורים', 'tirat-carmel' ); ?></button>
			<button type="button" class="tc-a11y-toggle-btn" data-a11y-toggle="readable-font"><?php esc_html_e( 'גופן קריא (דיסלקציה)', 'tirat-carmel' ); ?></button>
			<button type="button" class="tc-a11y-toggle-btn" data-a11y-toggle="big-cursor"><?php esc_html_e( 'סמן גדול', 'tirat-carmel' ); ?></button>
			<button type="button" class="tc-a11y-toggle-btn" data-a11y-toggle="stop-animations"><?php esc_html_e( 'עצירת אנימציות', 'tirat-carmel' ); ?></button>
			<button type="button" class="tc-a11y-toggle-btn" data-a11y-toggle="reading-guide"><?php esc_html_e( 'קו קריאה', 'tirat-carmel' ); ?></button>
			<button type="button" class="tc-a11y-toggle-btn" data-a11y-toggle="highlight-headings"><?php esc_html_e( 'הדגשת כותרות', 'tirat-carmel' ); ?></button>

			<button type="button" id="tc-a11y-reset" class="tc-a11y-reset-btn"><?php esc_html_e( 'איפוס כל ההגדרות', 'tirat-carmel' ); ?></button>
		</div>

		<div class="tc-a11y-panel__footer">
			<a href="<?php echo esc_url( tc_option( 'accessibility_page_url', home_url( '/accessibility/' ) ) ); ?>"><?php esc_html_e( 'הצהרת נגישות מלאה', 'tirat-carmel' ); ?></a>
			<a href="tel:106"><?php esc_html_e( 'דיווח על בעיית נגישות: מוקד 106', 'tirat-carmel' ); ?></a>
		</div>
	</div>
	<div id="tc-a11y-reading-guide" hidden></div>
</div>
