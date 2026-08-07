<?php
/**
 * תוצאות חיפוש.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
?>
<header class="tc-page-header">
	<div class="tc-container">
		<?php tc_breadcrumbs(); ?>
		<h1>
			<?php
			printf(
				/* translators: %s: מחרוזת החיפוש */
				esc_html__( 'תוצאות חיפוש עבור: %s', 'tirat-carmel' ),
				'<em>' . esc_html( get_search_query() ) . '</em>'
			);
			?>
		</h1>
	</div>
</header>

<div class="tc-container tc-content-layout tc-content-layout--full">
	<?php if ( have_posts() ) : ?>
		<?php while ( have_posts() ) : the_post(); ?>
			<a class="tc-list-card" href="<?php the_permalink(); ?>">
				<div class="tc-list-card__top">
					<h2><?php the_title(); ?></h2>
					<span class="tc-status is-open"><?php echo esc_html( get_post_type_object( get_post_type() )->labels->singular_name ); ?></span>
				</div>
				<p><?php echo esc_html( wp_trim_words( get_the_excerpt(), 24 ) ); ?></p>
			</a>
		<?php endwhile; ?>
		<nav class="tc-pagination"><?php the_posts_pagination( array( 'prev_text' => '›', 'next_text' => '‹' ) ); ?></nav>
	<?php else : ?>
		<p class="tc-empty"><?php esc_html_e( 'לא נמצאו תוצאות. נסו מונח חיפוש אחר או פנו למוקד 106.', 'tirat-carmel' ); ?></p>
	<?php endif; ?>
</div>

<?php get_footer(); ?>
