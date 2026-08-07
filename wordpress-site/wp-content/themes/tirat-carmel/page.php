<?php
/**
 * תבנית לעמודים פנימיים (עיצוב זהה לעמוד הבית, ללא תמונת הרקע של העיר).
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();

while ( have_posts() ) :
	the_post();
	tc_inner_page_header( get_post_meta( get_the_ID(), 'tc_page_subtitle', true ) );
	$has_sidebar   = is_active_sidebar( 'sidebar-page' ) && ! get_post_meta( get_the_ID(), 'tc_hide_sidebar', true );
	$layout_class  = $has_sidebar ? 'tc-content-layout' : 'tc-content-layout tc-content-layout--full';
	?>
	<div class="tc-container">
		<div class="<?php echo esc_attr( $layout_class ); ?>">
			<article <?php post_class( 'tc-entry' ); ?>>
				<?php if ( has_post_thumbnail() ) : ?>
					<div class="tc-entry-thumb"><?php the_post_thumbnail( 'large' ); ?></div>
				<?php endif; ?>
				<div class="tc-entry-content">
					<?php the_content(); ?>
					<?php
					wp_link_pages( array(
						'before' => '<nav class="tc-page-links">' . esc_html__( 'עמודים:', 'tirat-carmel' ),
						'after'  => '</nav>',
					) );
					?>
				</div>
				<?php if ( function_exists( 'tc_render_attachments' ) ) : ?>
					<?php tc_render_attachments( get_the_ID() ); ?>
				<?php endif; ?>
			</article>

			<?php if ( $has_sidebar ) : ?>
				<aside class="tc-sidebar" aria-label="<?php esc_attr_e( 'סרגל צד', 'tirat-carmel' ); ?>">
					<?php dynamic_sidebar( 'sidebar-page' ); ?>
				</aside>
			<?php endif; ?>
		</div>
	</div>
	<?php
endwhile;

get_footer();
