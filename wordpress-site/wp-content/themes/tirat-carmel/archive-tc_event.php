<?php
/**
 * ארכיון אירועים.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
?>
<header class="tc-page-header">
	<div class="tc-container">
		<?php tc_breadcrumbs(); ?>
		<h1><?php esc_html_e( 'אירועים', 'tirat-carmel' ); ?></h1>
		<p class="tc-page-header__subtitle"><?php esc_html_e( 'אירועים, פעילויות והרצאות בעיר טירת כרמל', 'tirat-carmel' ); ?></p>
	</div>
</header>

<div class="tc-container">
	<?php if ( have_posts() ) : ?>
		<div class="tc-events__grid">
			<?php while ( have_posts() ) : the_post(); tc_render_event_card( get_the_ID() ); endwhile; ?>
		</div>
		<nav class="tc-pagination"><?php the_posts_pagination( array( 'prev_text' => '›', 'next_text' => '‹' ) ); ?></nav>
	<?php else : ?>
		<p class="tc-empty"><?php esc_html_e( 'אין אירועים קרובים כרגע.', 'tirat-carmel' ); ?></p>
	<?php endif; ?>
</div>

<?php get_footer(); ?>
