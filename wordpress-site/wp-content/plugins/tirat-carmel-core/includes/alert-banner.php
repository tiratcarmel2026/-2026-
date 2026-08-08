<?php
/**
 * באנר חירום צף בראש האתר בכל העמודים - להפעלה ידנית ע"י צוות העירייה
 * בזמן אירוע חירום (למשל התרעות פיקוד העורף, מזג אוויר קיצוני וכו').
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function tc_render_emergency_banner() {
	if ( ! tc_core_get_option( 'emergency_banner_enabled' ) ) {
		return;
	}
	$message = tc_core_get_option( 'emergency_banner_message' );
	if ( ! $message ) {
		return;
	}
	$link       = tc_core_get_option( 'emergency_banner_link' );
	$link_label = tc_core_get_option( 'emergency_banner_link_label', 'לפרטים נוספים' );
	?>
	<div class="tc-emergency-banner" role="alert" id="tc-emergency-banner">
		<div class="tc-container tc-emergency-banner__inner">
			<span class="tc-emergency-banner__icon" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 2 20h20L12 3Z" stroke-linejoin="round"/><path d="M12 10v4" stroke-linecap="round"/><circle cx="12" cy="17" r="0.8" fill="currentColor" stroke="none"/></svg>
			</span>
			<span class="tc-emergency-banner__text"><?php echo esc_html( $message ); ?></span>
			<?php if ( $link ) : ?>
				<a class="tc-emergency-banner__link" href="<?php echo esc_url( $link ); ?>"><?php echo esc_html( $link_label ); ?></a>
			<?php endif; ?>
			<button type="button" class="tc-emergency-banner__close" id="tc-emergency-banner-close" aria-label="<?php esc_attr_e( 'סגירת הודעת החירום', 'tirat-carmel' ); ?>">×</button>
		</div>
	</div>
	<script>
		(function () {
			var KEY = 'tc-emergency-banner-dismissed';
			var banner = document.getElementById('tc-emergency-banner');
			if (!banner) return;
			try {
				if (sessionStorage.getItem(KEY) === '1') { banner.remove(); return; }
			} catch (e) {}
			var closeBtn = document.getElementById('tc-emergency-banner-close');
			if (closeBtn) {
				closeBtn.addEventListener('click', function () {
					banner.remove();
					try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
				});
			}
		})();
	</script>
	<?php
}

function tc_core_emergency_banner_css() {
	if ( ! tc_core_get_option( 'emergency_banner_enabled' ) ) {
		return;
	}
	?>
	<style>
		.tc-emergency-banner { background: #e2483c; color: #fff; }
		.tc-emergency-banner__inner { display: flex; align-items: center; gap: 12px; padding: 10px 20px; flex-wrap: wrap; }
		.tc-emergency-banner__icon { width: 20px; height: 20px; flex-shrink: 0; }
		.tc-emergency-banner__icon svg { width: 100%; height: 100%; }
		.tc-emergency-banner__text { font-weight: 700; flex: 1; min-width: 200px; }
		.tc-emergency-banner__link { text-decoration: underline; font-weight: 700; white-space: nowrap; }
		.tc-emergency-banner__close { background: transparent; border: none; color: #fff; font-size: 1.3rem; line-height: 1; padding: 0 4px; }
	</style>
	<?php
}
add_action( 'wp_head', 'tc_core_emergency_banner_css' );
