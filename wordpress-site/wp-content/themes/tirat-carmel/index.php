<?php
/**
 * תבנית ברירת מחדל (נדרשת ע"י וורדפרס) - מציגה רשימת כתבות/עדכונים.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
?>
<header class="tc-page-header">
	<div class="tc-container">
		<?php tc_breadcrumbs(); ?>
		<h1><?php esc_html_e( 'כתבות ועדכונים', 'tirat-carmel' ); ?></h1>
	</div>
</header>

<div class="tc-container tc-content-layout tc-content-layout--full">
	<?php if ( have_posts() ) : ?>
		<?php while ( have_posts() ) : the_post(); ?>
			<a class="tc-list-card" href="<?php the_permalink(); ?>">
				<div class="tc-list-card__top">
					<h2><?php the_title(); ?></h2>
					<span class="tc-status is-open"><?php echo esc_html( get_the_date() ); ?></span>
				</div>
				<p><?php echo esc_html( wp_trim_words( get_the_excerpt(), 24 ) ); ?></p>
			</a>
		<?php endwhile; ?>
		<nav class="tc-pagination"><?php the_posts_pagination( array( 'prev_text' => '›', 'next_text' => '‹' ) ); ?></nav>
	<?php else : ?>
		<p class="tc-empty"><?php esc_html_e( 'אין תוכן להצגה כרגע.', 'tirat-carmel' ); ?></p>
	<?php endif; ?>
</div>

<?php get_footer(); ?>
