<?php
/**
 * כותרת עליונה (Header) - משותפת לכל עמודי האתר.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="theme-color" content="#023f8a">
	<link rel="manifest" href="<?php echo esc_url( home_url( '/manifest.webmanifest' ) ); ?>">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="tc-skip-link" href="#tc-main-content"><?php esc_html_e( 'דלג לתוכן הראשי', 'tirat-carmel' ); ?></a>

<div class="tc-topbar">
	<div class="tc-container tc-topbar__inner">
		<a href="tel:106" class="tc-topbar__link"><?php tc_icon( 'phone' ); ?> <?php esc_html_e( 'מוקד 106 - 24/7', 'tirat-carmel' ); ?></a>
		<div class="tc-topbar__links">
			<a href="<?php echo esc_url( tc_option( 'accessibility_page_url', '#' ) ); ?>"><?php esc_html_e( 'הצהרת נגישות', 'tirat-carmel' ); ?></a>
			<a href="<?php echo esc_url( get_post_type_archive_link( 'tender' ) ?: '#' ); ?>"><?php esc_html_e( 'מכרזים', 'tirat-carmel' ); ?></a>
			<a href="<?php echo esc_url( tc_option( 'contact_page_url', '#' ) ); ?>"><?php esc_html_e( 'יצירת קשר', 'tirat-carmel' ); ?></a>
		</div>
	</div>
</div>

<header class="tc-header" id="tc-header">
	<div class="tc-container tc-header__inner">
		<div class="tc-header__brand">
			<?php if ( has_custom_logo() ) : ?>
				<?php the_custom_logo(); ?>
			<?php else : ?>
				<a href="<?php echo esc_url( home_url( '/' ) ); ?>">
					<img src="<?php echo esc_url( TC_THEME_URI . '/assets/img/logo-tirat-carmel.png' ); ?>" alt="<?php echo esc_attr( get_bloginfo( 'name' ) . ' — ' . get_bloginfo( 'description' ) ); ?>" class="tc-header__brand-logo">
				</a>
			<?php endif; ?>
		</div>

		<nav class="tc-nav" id="tc-primary-nav" aria-label="<?php esc_attr_e( 'תפריט ראשי', 'tirat-carmel' ); ?>">
			<?php
			wp_nav_menu( array(
				'theme_location' => 'primary',
				'container'      => false,
				'menu_class'     => 'tc-nav__list',
				'fallback_cb'    => 'tc_default_primary_menu',
			) );
			?>
		</nav>

		<div class="tc-header__actions">
			<button type="button" class="tc-search-toggle" aria-expanded="false" aria-controls="tc-search-panel">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5" stroke-linecap="round"/></svg>
				<span class="screen-reader-text"><?php esc_html_e( 'חיפוש באתר', 'tirat-carmel' ); ?></span>
			</button>
			<button type="button" class="tc-menu-toggle" aria-expanded="false" aria-controls="tc-primary-nav">
				<span class="tc-menu-toggle__bars" aria-hidden="true"></span>
				<span class="tc-menu-toggle__label"><?php esc_html_e( 'תפריט', 'tirat-carmel' ); ?></span>
			</button>
		</div>
	</div>

	<div class="tc-search-panel" id="tc-search-panel" hidden>
		<form role="search" method="get" class="tc-search-form" action="<?php echo esc_url( home_url( '/' ) ); ?>">
			<label class="screen-reader-text" for="tc-search-input"><?php esc_html_e( 'חיפוש באתר', 'tirat-carmel' ); ?></label>
			<input type="search" id="tc-search-input" name="s" placeholder="<?php esc_attr_e( 'חיפוש באתר העירייה…', 'tirat-carmel' ); ?>" value="<?php echo esc_attr( get_search_query() ); ?>">
			<button type="submit"><?php esc_html_e( 'חיפוש', 'tirat-carmel' ); ?></button>
		</form>
	</div>
</header>

<?php if ( function_exists( 'tc_render_mobile_bottom_nav' ) ) : ?>
	<?php tc_render_mobile_bottom_nav(); ?>
<?php endif; ?>

<main id="tc-main-content" class="tc-main">
<?php
/**
 * תפריט ברירת מחדל אם טרם הוגדר תפריט בפאנל הניהול.
 */
function tc_default_primary_menu() {
	$items = array(
		'העיר והעירייה'    => home_url( '/city/' ),
		'שירותים מקוונים'  => home_url( '/services/' ),
		'תושב'             => home_url( '/resident/' ),
		'מכרזים'           => get_post_type_archive_link( 'tender' ) ?: home_url( '/tenders/' ),
		'כתבות ועדכונים'   => home_url( '/blog/' ),
		'אירועים'          => get_post_type_archive_link( 'tc_event' ) ?: home_url( '/events/' ),
		'יצירת קשר'        => home_url( '/contact/' ),
	);
	echo '<ul class="tc-nav__list">';
	foreach ( $items as $label => $url ) {
		echo '<li><a href="' . esc_url( $url ) . '">' . esc_html( $label ) . '</a></li>';
	}
	echo '</ul>';
}
