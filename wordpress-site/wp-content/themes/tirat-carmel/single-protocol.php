<?php
/**
 * עמוד מסמך שקיפות/פרוטוקול בודד.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();

while ( have_posts() ) :
	the_post();
	tc_inner_page_header( tc_core_protocol_type_label( get_the_ID() ) );
	?>
	<div class="tc-container tc-content-layout tc-content-layout--full">
		<article class="tc-entry">
			<ul class="tc-list-card__meta" style="margin-bottom:20px;">
				<?php $date = tc_format_date( get_the_ID(), 'tc_protocol_date' ); ?>
				<?php if ( $date ) : ?><li><?php esc_html_e( 'תאריך:', 'tirat-carmel' ); ?> <?php echo esc_html( $date ); ?></li><?php endif; ?>
				<?php $number = get_post_meta( get_the_ID(), 'tc_protocol_number', true ); ?>
				<?php if ( $number ) : ?><li><?php esc_html_e( 'מספר:', 'tirat-carmel' ); ?> <?php echo esc_html( $number ); ?></li><?php endif; ?>
			</ul>
			<div class="tc-entry-content"><?php the_content(); ?></div>
			<?php if ( function_exists( 'tc_render_attachments' ) ) : ?>
				<h2><?php esc_html_e( 'קבצים מצורפים', 'tirat-carmel' ); ?></h2>
				<?php tc_render_attachments( get_the_ID() ); ?>
			<?php endif; ?>
		</article>
	</div>
	<?php
endwhile;

get_footer();
