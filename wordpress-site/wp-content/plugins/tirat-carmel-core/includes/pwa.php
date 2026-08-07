<?php
/**
 * מוכנות לאפליקציה נייטיבית: מניפסט Web App + Service Worker בסיסי (PWA).
 * זהו הבסיס להתקנה כ"אפליקציה" ממסך הבית, ולאריזה עתידית עם Capacitor/Median
 * לפרסום בחנויות האפליקציות (ראו README > "אפליקציה נייטיבית").
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function tc_core_register_pwa_rewrite() {
	add_rewrite_rule( '^manifest\.webmanifest$', 'index.php?tc_pwa_manifest=1', 'top' );
	add_rewrite_rule( '^sw\.js$', 'index.php?tc_pwa_sw=1', 'top' );
}
add_action( 'init', 'tc_core_register_pwa_rewrite' );

function tc_core_pwa_query_vars( $vars ) {
	$vars[] = 'tc_pwa_manifest';
	$vars[] = 'tc_pwa_sw';
	return $vars;
}
add_filter( 'query_vars', 'tc_core_pwa_query_vars' );

function tc_core_pwa_template_redirect() {
	if ( get_query_var( 'tc_pwa_manifest' ) ) {
		tc_core_output_manifest();
		exit;
	}
	if ( get_query_var( 'tc_pwa_sw' ) ) {
		tc_core_output_service_worker();
		exit;
	}
}
add_action( 'template_redirect', 'tc_core_pwa_template_redirect' );

function tc_core_output_manifest() {
	header( 'Content-Type: application/manifest+json; charset=utf-8' );

	$icon_id  = get_theme_mod( 'custom_logo' );
	$icon_url = $icon_id ? wp_get_attachment_image_url( $icon_id, 'full' ) : '';

	$manifest = array(
		'name'             => get_bloginfo( 'name' ) ?: 'עיריית טירת כרמל',
		'short_name'       => 'טירת כרמל',
		'description'      => get_bloginfo( 'description' ) ?: 'האתר הרשמי של עיריית טירת כרמל',
		'start_url'        => home_url( '/?utm_source=pwa' ),
		'scope'            => home_url( '/' ),
		'display'          => 'standalone',
		'orientation'      => 'portrait-primary',
		'lang'             => 'he',
		'dir'              => 'rtl',
		'background_color' => '#ffffff',
		'theme_color'      => '#0b3a63',
		'icons'            => array_filter( array(
			$icon_url ? array( 'src' => $icon_url, 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'any maskable' ) : null,
		) ),
	);

	echo wp_json_encode( $manifest );
}

function tc_core_output_service_worker() {
	header( 'Content-Type: application/javascript; charset=utf-8' );
	$version = TC_CORE_VERSION;
	?>
const CACHE_NAME = 'tirat-carmel-cache-<?php echo esc_js( $version ); ?>';
const OFFLINE_URLS = ['<?php echo esc_url( home_url( '/' ) ); ?>'];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS)).catch(() => {})
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => Promise.all(
			keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
		))
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;
	event.respondWith(
		fetch(event.request).catch(() => caches.match(event.request))
	);
});
	<?php
}

/**
 * תגיות meta לתמיכה ב-PWA / "הוספה למסך הבית".
 */
function tc_core_pwa_head_tags() {
	?>
	<link rel="apple-touch-icon" href="<?php echo esc_url( get_theme_mod( 'custom_logo' ) ? wp_get_attachment_image_url( get_theme_mod( 'custom_logo' ), 'full' ) : '' ); ?>">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
	<meta name="mobile-web-app-capable" content="yes">
	<script>
		if ('serviceWorker' in navigator) {
			window.addEventListener('load', function () {
				navigator.serviceWorker.register('<?php echo esc_url( home_url( '/sw.js' ) ); ?>').catch(function () {});
			});
		}
	</script>
	<?php
}
add_action( 'wp_head', 'tc_core_pwa_head_tags' );
