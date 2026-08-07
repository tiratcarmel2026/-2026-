<?php
/**
 * עמוד שגיאה 404.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
?>
<div class="tc-container tc-content-layout tc-content-layout--full" style="text-align:center; padding:60px 0;">
	<h1><?php esc_html_e( 'העמוד לא נמצא', 'tirat-carmel' ); ?></h1>
	<p><?php esc_html_e( 'ייתכן שהעמוד הוסר או שהכתובת שגויה. אפשר לחפש את מה שחיפשתם למטה, או לפנות למוקד 106.', 'tirat-carmel' ); ?></p>
	<form role="search" method="get" class="tc-search-form" style="max-width:480px; margin:20px auto;" action="<?php echo esc_url( home_url( '/' ) ); ?>">
		<label class="screen-reader-text" for="tc-404-search"><?php esc_html_e( 'חיפוש באתר', 'tirat-carmel' ); ?></label>
		<input type="search" id="tc-404-search" name="s" placeholder="<?php esc_attr_e( 'חיפוש באתר…', 'tirat-carmel' ); ?>">
		<button type="submit"><?php esc_html_e( 'חיפוש', 'tirat-carmel' ); ?></button>
	</form>
	<a class="tc-btn tc-btn--primary" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'חזרה לעמוד הבית', 'tirat-carmel' ); ?></a>
</div>
<?php get_footer(); ?>
