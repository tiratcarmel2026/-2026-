<?php
/**
 * ארכיון פרוטוקולים ושקיפות.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
?>
<header class="tc-page-header">
	<div class="tc-container">
		<?php tc_breadcrumbs(); ?>
		<h1><?php esc_html_e( 'פרוטוקולים ושקיפות', 'tirat-carmel' ); ?></h1>
		<p class="tc-page-header__subtitle"><?php esc_html_e( 'פרוטוקולי ישיבות מועצה, תקציב, דוחות כספיים ושכר בכירים - בהתאם לחוק חופש המידע', 'tirat-carmel' ); ?></p>
	</div>
</header>

<div class="tc-container tc-content-layout tc-content-layout--full">
	<?php if ( have_posts() ) : ?>
		<?php while ( have_posts() ) : the_post(); ?>
			<a class="tc-list-card" href="<?php the_permalink(); ?>">
				<div class="tc-list-card__top">
					<h2><?php the_title(); ?></h2>
					<span class="tc-status is-open"><?php echo esc_html( tc_core_protocol_type_label( get_the_ID() ) ); ?></span>
				</div>
				<div class="tc-list-card__meta">
					<?php $date = tc_format_date( get_the_ID(), 'tc_protocol_date' ); ?>
					<?php if ( $date ) : ?><span><?php echo esc_html( $date ); ?></span><?php endif; ?>
					<?php $number = get_post_meta( get_the_ID(), 'tc_protocol_number', true ); ?>
					<?php if ( $number ) : ?><span><?php esc_html_e( 'מספר:', 'tirat-carmel' ); ?> <?php echo esc_html( $number ); ?></span><?php endif; ?>
				</div>
			</a>
		<?php endwhile; ?>
		<nav class="tc-pagination"><?php the_posts_pagination( array( 'prev_text' => '›', 'next_text' => '‹' ) ); ?></nav>
	<?php else : ?>
		<p class="tc-empty"><?php esc_html_e( 'טרם פורסמו מסמכים.', 'tirat-carmel' ); ?></p>
	<?php endif; ?>
</div>

<?php get_footer(); ?>
