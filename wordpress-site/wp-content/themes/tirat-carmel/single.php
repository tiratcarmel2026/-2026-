<?php
/**
 * תבנית לכתבה/עדכון בודד.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();

while ( have_posts() ) :
	the_post();
	tc_inner_page_header( get_the_date( 'd.m.Y' ) . ( has_category() ? ' · ' . get_the_category_list( ', ' ) : '' ) );
	?>
	<div class="tc-container">
		<div class="tc-content-layout">
			<article <?php post_class( 'tc-entry' ); ?>>
				<?php if ( has_post_thumbnail() ) : ?>
					<div class="tc-entry-thumb"><?php the_post_thumbnail( 'large' ); ?></div>
				<?php endif; ?>
				<div class="tc-entry-content">
					<?php the_content(); ?>
				</div>

				<?php if ( function_exists( 'tc_render_attachments' ) ) : ?>
					<?php tc_render_attachments( get_the_ID() ); ?>
				<?php endif; ?>

				<footer class="tc-entry-footer">
					<?php
					$tags = get_the_tag_list( '', ', ' );
					if ( $tags ) {
						echo '<p class="tc-entry-tags">' . esc_html__( 'תגיות:', 'tirat-carmel' ) . ' ' . wp_kses_post( $tags ) . '</p>';
					}
					?>
				</footer>

				<?php if ( comments_open() || get_comments_number() ) : ?>
					<div class="tc-comments"><?php comments_template(); ?></div>
				<?php endif; ?>
			</article>

			<aside class="tc-sidebar" aria-label="<?php esc_attr_e( 'סרגל צד', 'tirat-carmel' ); ?>">
				<div class="tc-widget">
					<h3 class="tc-widget-title"><?php esc_html_e( 'כתבות נוספות', 'tirat-carmel' ); ?></h3>
					<ul class="tc-footer__links">
						<?php
						$related = new WP_Query( array(
							'post_type'      => 'post',
							'posts_per_page' => 5,
							'post__not_in'   => array( get_the_ID() ),
							'orderby'        => 'date',
							'order'          => 'DESC',
							'no_found_rows'  => true,
						) );
						while ( $related->have_posts() ) :
							$related->the_post();
							?>
							<li><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></li>
							<?php
						endwhile;
						wp_reset_postdata();
						?>
					</ul>
				</div>
				<?php if ( is_active_sidebar( 'sidebar-page' ) ) : ?>
					<?php dynamic_sidebar( 'sidebar-page' ); ?>
				<?php endif; ?>
			</aside>
		</div>
	</div>
	<?php
endwhile;

get_footer();
