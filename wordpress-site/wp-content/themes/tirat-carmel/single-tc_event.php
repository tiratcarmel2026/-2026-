<?php
/**
 * עמוד אירוע בודד.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();

while ( have_posts() ) :
	the_post();
	$date     = tc_format_date( get_the_ID(), 'tc_event_date' );
	$time     = get_post_meta( get_the_ID(), 'tc_event_time', true );
	$location = get_post_meta( get_the_ID(), 'tc_event_location', true );
	tc_inner_page_header( trim( implode( ' · ', array_filter( array( $date, $time, $location ) ) ) ) );
	?>
	<div class="tc-container tc-content-layout tc-content-layout--full">
		<article class="tc-entry">
			<?php if ( has_post_thumbnail() ) : ?>
				<div class="tc-entry-thumb"><?php the_post_thumbnail( 'large' ); ?></div>
			<?php endif; ?>
			<div class="tc-entry-content"><?php the_content(); ?></div>
		</article>
	</div>
	<?php
endwhile;

get_footer();
