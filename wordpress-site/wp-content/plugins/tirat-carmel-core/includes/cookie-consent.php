<?php
/**
 * הודעת עוגיות (Cookie Consent) בסיסית - נדרשת כי האתר משתמש ב-localStorage
 * להעדפות נגישות, ובאופן אופציונלי בהתראות Push ובכלי ניתוח (Google Analytics
 * וכדומה) שהעירייה עשויה להוסיף בעתיד.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function tc_render_cookie_consent() {
	if ( ! tc_core_get_option( 'cookie_consent_enabled' ) ) {
		return;
	}
	?>
	<div id="tc-cookie-consent" class="tc-cookie-consent" role="dialog" aria-label="<?php esc_attr_e( 'הודעה על שימוש בעוגיות', 'tirat-carmel' ); ?>" hidden>
		<div class="tc-cookie-consent__inner">
			<p>
				<?php esc_html_e( 'אתר העירייה משתמש בעוגיות (Cookies) לצורך תפעול האתר, שמירת העדפות נגישות והתראות. המשך גלישה מהווה הסכמה.', 'tirat-carmel' ); ?>
				<a href="<?php echo esc_url( tc_option( 'accessibility_page_url', '#' ) ); ?>"><?php esc_html_e( 'מדיניות פרטיות', 'tirat-carmel' ); ?></a>
			</p>
			<button type="button" id="tc-cookie-consent-accept" class="tc-btn tc-btn--primary"><?php esc_html_e( 'הבנתי', 'tirat-carmel' ); ?></button>
		</div>
	</div>
	<style>
		.tc-cookie-consent { position: fixed; inset: auto 0 0 0; z-index: 4000; background: #fff; border-top: 1px solid var(--tc-border,#e1e8ef); box-shadow: 0 -6px 24px rgba(2,63,138,0.12); }
		.tc-cookie-consent[hidden] { display: none; }
		.tc-cookie-consent__inner { max-width: var(--tc-container,1200px); margin: 0 auto; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
		.tc-cookie-consent__inner p { margin: 0; font-size: 0.88rem; flex: 1; min-width: 240px; }
		.tc-cookie-consent__inner a { color: var(--tc-teal,#00a9cc); font-weight: 700; }
	</style>
	<script>
		(function () {
			var KEY = 'tc-cookie-consent-accepted';
			var el = document.getElementById('tc-cookie-consent');
			if (!el) return;
			var accepted = false;
			try { accepted = window.localStorage.getItem(KEY) === '1'; } catch (e) {}
			if (!accepted) el.removeAttribute('hidden');
			var btn = document.getElementById('tc-cookie-consent-accept');
			if (btn) {
				btn.addEventListener('click', function () {
					el.setAttribute('hidden', '');
					try { window.localStorage.setItem(KEY, '1'); } catch (e) {}
				});
			}
		})();
	</script>
	<?php
}
