<?php
/**
 * עמוד מחלקה בודדת.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

while ( have_posts() ) :
	the_post();
	$manager = get_post_meta( get_the_ID(), 'tc_department_manager', true );
	tc_inner_page_header( $manager ? sprintf( __( 'מנהל/ת המחלקה: %s', 'tirat-carmel' ), $manager ) : '' );
	?>
	<div class="tc-container tc-content-layout">
		<article class="tc-entry">
			<?php if ( has_post_thumbnail() ) : ?>
				<div class="tc-entry-thumb"><?php the_post_thumbnail( 'large' ); ?></div>
			<?php endif; ?>
			<div class="tc-entry-content"><?php the_content(); ?></div>
		</article>

		<aside class="tc-sidebar" aria-label="<?php esc_attr_e( 'פרטי התקשרות', 'tirat-carmel' ); ?>">
			<div class="tc-widget">
				<h3 class="tc-widget-title"><?php esc_html_e( 'פרטי התקשרות', 'tirat-carmel' ); ?></h3>
				<ul class="tc-footer__links" style="color:var(--tc-navy);">
					<?php $phone = get_post_meta( get_the_ID(), 'tc_department_phone', true ); ?>
					<?php if ( $phone ) : ?><li><a href="tel:<?php echo esc_attr( $phone ); ?>" style="color:var(--tc-navy);font-weight:700;"><?php tc_icon( 'phone' ); ?> <?php echo esc_html( $phone ); ?></a></li><?php endif; ?>
					<?php $email = get_post_meta( get_the_ID(), 'tc_department_email', true ); ?>
					<?php if ( $email ) : ?><li><a href="mailto:<?php echo esc_attr( $email ); ?>" style="color:var(--tc-navy);"><?php echo esc_html( $email ); ?></a></li><?php endif; ?>
					<?php $hours = get_post_meta( get_the_ID(), 'tc_department_hours', true ); ?>
					<?php if ( $hours ) : ?><li><?php esc_html_e( 'שעות קבלת קהל:', 'tirat-carmel' ); ?> <?php echo esc_html( $hours ); ?></li><?php endif; ?>
					<?php $room = get_post_meta( get_the_ID(), 'tc_department_room', true ); ?>
					<?php if ( $room ) : ?><li><?php echo esc_html( $room ); ?></li><?php endif; ?>
				</ul>
			</div>
		</aside>
	</div>
	<?php
endwhile;

get_footer();
