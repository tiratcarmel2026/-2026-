<?php
/**
 * פונקציות ליבה של תבנית עיריית טירת כרמל.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'TC_THEME_VERSION', '1.0.0' );
define( 'TC_THEME_DIR', get_template_directory() );
define( 'TC_THEME_URI', get_template_directory_uri() );

/**
 * הגדרות בסיס של התבנית.
 */
function tc_setup() {
	load_theme_textdomain( 'tirat-carmel', TC_THEME_DIR . '/languages' );

	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' ) );
	add_theme_support( 'custom-logo', array(
		'height'      => 90,
		'width'       => 260,
		'flex-height' => true,
		'flex-width'  => true,
	) );
	add_theme_support( 'align-wide' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'automatic-feed-links' );

	set_post_thumbnail_size( 800, 500, true );
	add_image_size( 'tc-card', 480, 320, true );
	add_image_size( 'tc-hero', 1920, 800, true );

	register_nav_menus( array(
		'primary' => __( 'תפריט ראשי', 'tirat-carmel' ),
		'footer'  => __( 'מפת אתר בפוטר', 'tirat-carmel' ),
		'mobile'  => __( 'תפריט תחתון בנייד', 'tirat-carmel' ),
	) );
}
add_action( 'after_setup_theme', 'tc_setup' );

/**
 * העמוד הראשי חייב להישאר RTL/עברית - וידוא שפת האתר בעת ההפעלה הראשונה.
 */
function tc_activation_defaults() {
	if ( ! get_option( 'tc_activated_once' ) ) {
		update_option( 'WPLANG', 'he_IL' );
		update_option( 'tc_activated_once', 1 );
	}
}
add_action( 'after_switch_theme', 'tc_activation_defaults' );

/**
 * טעינת קבצי עיצוב וסקריפטים.
 */
function tc_enqueue_assets() {
	wp_enqueue_style( 'tc-fonts', 'https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600;700;800&display=swap', array(), null );
	wp_enqueue_style( 'tc-style', TC_THEME_URI . '/assets/css/style.css', array(), TC_THEME_VERSION );
	wp_style_add_data( 'tc-style', 'rtl', 'replace' );

	wp_enqueue_script( 'tc-main', TC_THEME_URI . '/assets/js/main.js', array(), TC_THEME_VERSION, true );

	if ( get_theme_mod( 'tc_enable_accessibility_widget', true ) ) {
		wp_enqueue_style( 'tc-accessibility', TC_THEME_URI . '/assets/css/accessibility.css', array(), TC_THEME_VERSION );
		wp_enqueue_script( 'tc-accessibility', TC_THEME_URI . '/assets/js/accessibility.js', array(), TC_THEME_VERSION, true );
	}

	if ( get_theme_mod( 'tc_enable_chatbot', true ) ) {
		wp_enqueue_style( 'tc-chatbot', TC_THEME_URI . '/assets/css/chatbot.css', array(), TC_THEME_VERSION );
		wp_enqueue_script( 'tc-chatbot', TC_THEME_URI . '/assets/js/chatbot.js', array( 'wp-api-fetch' ), TC_THEME_VERSION, true );
		wp_localize_script( 'tc-chatbot', 'tcChatbot', array(
			'restUrl'   => esc_url_raw( rest_url( 'tirat-carmel/v1/chatbot-intents' ) ),
			'homeUrl'   => esc_url( home_url( '/' ) ),
			'siteName'  => get_bloginfo( 'name' ),
			'avatarUrl' => TC_THEME_URI . '/assets/img/bot-avatar.svg',
		) );
	}

	if ( is_singular() ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'tc_enqueue_assets' );

/**
 * רוחב תוכן ברירת מחדל לתמונות/הטמעות.
 */
function tc_content_width() {
	$GLOBALS['content_width'] = 1140;
}
add_action( 'after_setup_theme', 'tc_content_width', 0 );

/**
 * ווידג'טים.
 */
function tc_widgets_init() {
	register_sidebar( array(
		'name'          => __( 'סרגל צד - עמודים פנימיים', 'tirat-carmel' ),
		'id'            => 'sidebar-page',
		'before_widget' => '<div class="tc-widget %2$s">',
		'after_widget'  => '</div>',
		'before_title'  => '<h3 class="tc-widget-title">',
		'after_title'   => '</h3>',
	) );
}
add_action( 'widgets_init', 'tc_widgets_init' );

/**
 * ניווט "פירורי לחם" לעמודים הפנימיים.
 */
function tc_breadcrumbs() {
	if ( is_front_page() ) {
		return;
	}
	echo '<nav class="tc-breadcrumbs" aria-label="' . esc_attr__( 'פירורי לחם', 'tirat-carmel' ) . '">';
	echo '<a href="' . esc_url( home_url( '/' ) ) . '">' . esc_html__( 'בית', 'tirat-carmel' ) . '</a>';

	$archive_labels = array(
		'tender'     => __( 'מכרזים', 'tirat-carmel' ),
		'tc_event'   => __( 'אירועים', 'tirat-carmel' ),
		'department' => __( 'מחלקות ואנשי קשר', 'tirat-carmel' ),
		'protocol'   => __( 'פרוטוקולים ושקיפות', 'tirat-carmel' ),
	);
	$matched = false;
	foreach ( $archive_labels as $post_type => $label ) {
		if ( is_singular( $post_type ) ) {
			echo '<span class="sep">›</span><a href="' . esc_url( get_post_type_archive_link( $post_type ) ) . '">' . esc_html( $label ) . '</a>';
			$matched = true;
			break;
		} elseif ( is_post_type_archive( $post_type ) ) {
			echo '<span class="sep">›</span><span>' . esc_html( $label ) . '</span>';
			$matched = true;
			break;
		}
	}
	if ( ! $matched && ( is_singular( 'post' ) || is_home() ) ) {
		echo '<span class="sep">›</span><a href="' . esc_url( get_post_type_archive_link( 'post' ) ) . '">' . esc_html__( 'כתבות ועדכונים', 'tirat-carmel' ) . '</a>';
	}

	if ( is_singular() && ! is_front_page() ) {
		echo '<span class="sep">›</span><span aria-current="page">' . esc_html( get_the_title() ) . '</span>';
	} elseif ( is_page() ) {
		echo '<span class="sep">›</span><span aria-current="page">' . esc_html( get_the_title() ) . '</span>';
	} elseif ( is_search() ) {
		echo '<span class="sep">›</span><span>' . esc_html__( 'תוצאות חיפוש', 'tirat-carmel' ) . '</span>';
	}
	echo '</nav>';
}

/**
 * כותרת עליונה לעמודים פנימיים (ללא תמונת העיר, לפי בקשת הלקוח).
 */
function tc_inner_page_header( $subtitle = '' ) {
	?>
	<header class="tc-page-header">
		<div class="tc-container">
			<?php tc_breadcrumbs(); ?>
			<h1><?php the_title(); ?></h1>
			<?php if ( $subtitle ) : ?>
				<p class="tc-page-header__subtitle"><?php echo esc_html( $subtitle ); ?></p>
			<?php endif; ?>
		</div>
	</header>
	<?php
}

/**
 * עזרי תבנית: שליפת הגדרות מהתוסף, עם ברירות מחדל בטוחות אם התוסף כבוי.
 */
function tc_option( $key, $default = '' ) {
	if ( function_exists( 'tc_core_get_option' ) ) {
		return tc_core_get_option( $key, $default );
	}
	return $default;
}

/**
 * הודעת מנהל אם התוסף הנלווה (tirat-carmel-core) לא מופעל.
 */
function tc_admin_notice_missing_plugin() {
	if ( ! function_exists( 'tc_core_get_option' ) ) {
		echo '<div class="notice notice-warning"><p>';
		esc_html_e( 'לתפקוד מלא של אתר עיריית טירת כרמל (מכרזים, אירועים, עדכונים, כרטיסי שירות, בוט ניווט) יש להפעיל את התוסף "Tirat Carmel Core".', 'tirat-carmel' );
		echo '</p></div>';
	}
}
add_action( 'admin_notices', 'tc_admin_notice_missing_plugin' );

/**
 * תמיכה ב-Customizer: מיתוג צבעים ומיתוג בסיסי.
 */
function tc_customize_register( $wp_customize ) {
	$wp_customize->add_section( 'tc_site_options', array(
		'title'    => __( 'הגדרות אתר העירייה', 'tirat-carmel' ),
		'priority' => 30,
	) );

	$wp_customize->add_setting( 'tc_enable_accessibility_widget', array(
		'default'           => true,
		'sanitize_callback' => 'wp_validate_boolean',
	) );
	$wp_customize->add_control( 'tc_enable_accessibility_widget', array(
		'label'   => __( 'הצג כפתור נגישות בכל האתר', 'tirat-carmel' ),
		'section' => 'tc_site_options',
		'type'    => 'checkbox',
	) );

	$wp_customize->add_setting( 'tc_enable_chatbot', array(
		'default'           => true,
		'sanitize_callback' => 'wp_validate_boolean',
	) );
	$wp_customize->add_control( 'tc_enable_chatbot', array(
		'label'   => __( 'הצג בוט ניווט צף בכל האתר', 'tirat-carmel' ),
		'section' => 'tc_site_options',
		'type'    => 'checkbox',
	) );

	$wp_customize->add_setting( 'tc_hero_subtitle', array(
		'default'           => 'סביבה טובה בין כרמל לים',
		'sanitize_callback' => 'sanitize_text_field',
	) );
	$wp_customize->add_control( 'tc_hero_subtitle', array(
		'label'   => __( 'כותרת משנה בעמוד הבית (מתחת לשם העיר)', 'tirat-carmel' ),
		'section' => 'tc_site_options',
		'type'    => 'text',
	) );
}
add_action( 'customize_register', 'tc_customize_register' );

require TC_THEME_DIR . '/inc/template-tags.php';
require TC_THEME_DIR . '/inc/mobile-nav.php';
