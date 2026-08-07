<?php
/**
 * עמוד מכרז בודד.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();

while ( have_posts() ) :
	the_post();
	$status   = tc_tender_status( get_the_ID() );
	$number   = get_post_meta( get_the_ID(), 'tc_tender_number', true );
	$deadline = tc_format_date( get_the_ID(), 'tc_tender_deadline' );
	$published= tc_format_date( get_the_ID(), 'tc_tender_publish_date' );
	$contact  = get_post_meta( get_the_ID(), 'tc_tender_contact', true );
	tc_inner_page_header( $number ? sprintf( __( 'מכרז מספר %s', 'tirat-carmel' ), $number ) : '' );
	?>
	<div class="tc-container">
		<div class="tc-content-layout">
			<article class="tc-entry">
				<p><span class="tc-status <?php echo esc_attr( $status['class'] ); ?>"><?php echo esc_html( $status['label'] ); ?></span></p>

				<ul class="tc-tender-meta tc-list-card__meta" style="margin-bottom:20px;">
					<?php if ( $published ) : ?><li><?php esc_html_e( 'פורסם:', 'tirat-carmel' ); ?> <?php echo esc_html( $published ); ?></li><?php endif; ?>
					<?php if ( $deadline ) : ?><li><?php esc_html_e( 'מועד אחרון להגשה:', 'tirat-carmel' ); ?> <?php echo esc_html( $deadline ); ?></li><?php endif; ?>
					<?php if ( $contact ) : ?><li><?php esc_html_e( 'איש קשר:', 'tirat-carmel' ); ?> <?php echo esc_html( $contact ); ?></li><?php endif; ?>
				</ul>

				<div class="tc-entry-content"><?php the_content(); ?></div>

				<?php if ( function_exists( 'tc_render_attachments' ) ) : ?>
					<h2><?php esc_html_e( 'מסמכי המכרז', 'tirat-carmel' ); ?></h2>
					<?php tc_render_attachments( get_the_ID() ); ?>
				<?php endif; ?>
			</article>

			<aside class="tc-sidebar" aria-label="<?php esc_attr_e( 'סרגל צד', 'tirat-carmel' ); ?>">
				<div class="tc-widget">
					<h3 class="tc-widget-title"><?php esc_html_e( 'מכרזים נוספים', 'tirat-carmel' ); ?></h3>
					<ul class="tc-footer__links">
						<?php
						$related = new WP_Query( array(
							'post_type'      => 'tender',
							'posts_per_page' => 5,
							'post__not_in'   => array( get_the_ID() ),
							'no_found_rows'  => true,
						) );
						while ( $related->have_posts() ) : $related->the_post();
							?>
							<li><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></li>
							<?php
						endwhile;
						wp_reset_postdata();
						?>
					</ul>
				</div>
			</aside>
		</div>
	</div>
	<?php
endwhile;

get_footer();
