<?php
/**
 * ארכיון מחלקות ואנשי קשר.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
?>
<header class="tc-page-header">
	<div class="tc-container">
		<?php tc_breadcrumbs(); ?>
		<h1><?php esc_html_e( 'מחלקות ואנשי קשר', 'tirat-carmel' ); ?></h1>
		<p class="tc-page-header__subtitle"><?php esc_html_e( 'מדריך מחלקות עיריית טירת כרמל - טלפונים, מיילים ושעות קבלת קהל', 'tirat-carmel' ); ?></p>
	</div>
</header>

<div class="tc-container">
	<?php if ( have_posts() ) : ?>
		<div class="tc-department-grid">
			<?php while ( have_posts() ) : the_post(); ?>
				<a class="tc-department-card" href="<?php the_permalink(); ?>">
					<h3><?php the_title(); ?></h3>
					<?php $manager = get_post_meta( get_the_ID(), 'tc_department_manager', true ); ?>
					<?php if ( $manager ) : ?><p class="tc-department-card__manager"><?php echo esc_html( $manager ); ?></p><?php endif; ?>
					<ul class="tc-department-card__meta">
						<?php $phone = get_post_meta( get_the_ID(), 'tc_department_phone', true ); ?>
						<?php if ( $phone ) : ?><li><?php tc_icon( 'phone' ); ?> <?php echo esc_html( $phone ); ?></li><?php endif; ?>
						<?php $hours = get_post_meta( get_the_ID(), 'tc_department_hours', true ); ?>
						<?php if ( $hours ) : ?><li><?php echo esc_html( $hours ); ?></li><?php endif; ?>
					</ul>
				</a>
			<?php endwhile; ?>
		</div>
		<nav class="tc-pagination"><?php the_posts_pagination( array( 'prev_text' => '›', 'next_text' => '‹' ) ); ?></nav>
	<?php else : ?>
		<p class="tc-empty"><?php esc_html_e( 'טרם הוזנו מחלקות במערכת.', 'tirat-carmel' ); ?></p>
	<?php endif; ?>
</div>

<?php get_footer(); ?>
