<?php
/**
 * ארכיון מכרזים.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
?>
<header class="tc-page-header">
	<div class="tc-container">
		<?php tc_breadcrumbs(); ?>
		<h1><?php esc_html_e( 'מכרזים', 'tirat-carmel' ); ?></h1>
		<p class="tc-page-header__subtitle"><?php esc_html_e( 'כלל המכרזים הפעילים והסגורים של עיריית טירת כרמל', 'tirat-carmel' ); ?></p>
	</div>
</header>

<div class="tc-container tc-content-layout tc-content-layout--full">
	<div class="tc-tender-filters" role="group" aria-label="<?php esc_attr_e( 'סינון מכרזים לפי סטטוס', 'tirat-carmel' ); ?>">
		<a href="<?php echo esc_url( get_post_type_archive_link( 'tender' ) ); ?>" class="tc-btn tc-btn--outline"><?php esc_html_e( 'הכל', 'tirat-carmel' ); ?></a>
	</div>

	<?php if ( have_posts() ) : ?>
		<?php while ( have_posts() ) : the_post(); $status = tc_tender_status( get_the_ID() ); ?>
			<a class="tc-list-card" href="<?php the_permalink(); ?>">
				<div class="tc-list-card__top">
					<h2><?php the_title(); ?></h2>
					<span class="tc-status <?php echo esc_attr( $status['class'] ); ?>"><?php echo esc_html( $status['label'] ); ?></span>
				</div>
				<p><?php echo esc_html( wp_trim_words( get_the_excerpt(), 24 ) ); ?></p>
				<div class="tc-list-card__meta">
					<?php $num = get_post_meta( get_the_ID(), 'tc_tender_number', true ); ?>
					<?php if ( $num ) : ?><span><?php esc_html_e( 'מספר מכרז:', 'tirat-carmel' ); ?> <?php echo esc_html( $num ); ?></span><?php endif; ?>
					<?php $deadline = tc_format_date( get_the_ID(), 'tc_tender_deadline' ); ?>
					<?php if ( $deadline ) : ?><span><?php esc_html_e( 'מועד אחרון להגשה:', 'tirat-carmel' ); ?> <?php echo esc_html( $deadline ); ?></span><?php endif; ?>
				</div>
			</a>
		<?php endwhile; ?>

		<nav class="tc-pagination"><?php the_posts_pagination( array( 'prev_text' => '›', 'next_text' => '‹' ) ); ?></nav>
	<?php else : ?>
		<p class="tc-empty"><?php esc_html_e( 'אין מכרזים פתוחים כרגע.', 'tirat-carmel' ); ?></p>
	<?php endif; ?>
</div>

<?php get_footer(); ?>
