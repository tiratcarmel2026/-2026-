<?php
/**
 * Plugin Name: Tirat Carmel Core
 * Plugin URI: https://tirat-carmel.muni.il
 * Description: תוסף הליבה של אתר עיריית טירת כרמל - מכרזים, אירועים, כרטיסי שירות, הגדרות אתר, בוט ניווט וקבצים מצורפים. עובד יחד עם תבנית "עיריית טירת כרמל".
 * Version: 1.0.0
 * Requires at least: 6.4
 * Requires PHP: 8.0
 * Author: מחלקת מחשוב - עיריית טירת כרמל
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: tirat-carmel
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'TC_CORE_VERSION', '1.0.0' );
define( 'TC_CORE_DIR', plugin_dir_path( __FILE__ ) );
define( 'TC_CORE_URL', plugin_dir_url( __FILE__ ) );
define( 'TC_CORE_FILE', __FILE__ );

require TC_CORE_DIR . 'includes/options.php';
require TC_CORE_DIR . 'includes/attachments.php';
require TC_CORE_DIR . 'includes/cpt-tenders.php';
require TC_CORE_DIR . 'includes/cpt-events.php';
require TC_CORE_DIR . 'includes/service-cards.php';
require TC_CORE_DIR . 'includes/settings-page.php';
require TC_CORE_DIR . 'includes/chatbot-intents.php';
require TC_CORE_DIR . 'includes/rest-api.php';
require TC_CORE_DIR . 'includes/pwa.php';
require TC_CORE_DIR . 'includes/newsletter.php';
require TC_CORE_DIR . 'includes/page-options.php';
require TC_CORE_DIR . 'includes/admin-menu.php';

/**
 * הרשאת קבצים המותרים להעלאה (PDF, Word, Excel, תמונות) - ברירת המחדל
 * של וורדפרס כבר תומכת בכל אלה, כאן רק מוודאים שלא נחסמו בהגדרות האתר.
 */
function tc_core_allowed_mime_types( $mimes ) {
	$mimes['pdf']  = 'application/pdf';
	$mimes['doc']  = 'application/msword';
	$mimes['docx'] = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
	$mimes['xls']  = 'application/vnd.ms-excel';
	$mimes['xlsx'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
	return $mimes;
}
add_filter( 'upload_mimes', 'tc_core_allowed_mime_types' );

/**
 * הגדלת קונטקסט התמונה הראשית של השיתוף ברשתות חברתיות (Open Graph).
 */
function tc_core_opengraph_tags() {
	if ( ! is_singular() ) {
		return;
	}
	global $post;
	$title       = get_the_title( $post );
	$description = has_excerpt( $post ) ? get_the_excerpt( $post ) : wp_trim_words( wp_strip_all_tags( $post->post_content ), 30 );
	$image       = has_post_thumbnail( $post ) ? get_the_post_thumbnail_url( $post, 'large' ) : '';

	printf( '<meta property="og:title" content="%s" />' . "\n", esc_attr( $title ) );
	printf( '<meta property="og:description" content="%s" />' . "\n", esc_attr( $description ) );
	printf( '<meta property="og:url" content="%s" />' . "\n", esc_url( get_permalink( $post ) ) );
	printf( '<meta property="og:locale" content="he_IL" />' . "\n" );
	if ( $image ) {
		printf( '<meta property="og:image" content="%s" />' . "\n", esc_url( $image ) );
	}
}
add_action( 'wp_head', 'tc_core_opengraph_tags' );

/**
 * הפעלה: פליסאש קישורים קבועים כדי שסוגי התוכן החדשים יעבדו מיד.
 */
function tc_core_activate() {
	require_once TC_CORE_DIR . 'includes/cpt-tenders.php';
	require_once TC_CORE_DIR . 'includes/cpt-events.php';
	require_once TC_CORE_DIR . 'includes/chatbot-intents.php';
	require_once TC_CORE_DIR . 'includes/pwa.php';
	tc_core_register_tender_cpt();
	tc_core_register_event_cpt();
	tc_core_register_chatbot_intent_cpt();
	tc_core_register_pwa_rewrite();
	flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'tc_core_activate' );

function tc_core_deactivate() {
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'tc_core_deactivate' );
