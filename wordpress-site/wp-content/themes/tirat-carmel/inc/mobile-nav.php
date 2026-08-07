<?php
/**
 * סרגל ניווט תחתון קבוע במסכי נייד, כמו במוקאפ שסופק.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function tc_render_mobile_bottom_nav() {
	$items = array(
		array( 'icon' => 'city', 'label' => 'העירייה', 'url' => home_url( '/city/' ) ),
		array( 'icon' => 'emergency', 'label' => 'חירום', 'url' => home_url( '/emergency/' ) ),
		array( 'icon' => 'home', 'label' => 'בית', 'url' => home_url( '/' ), 'active' => is_front_page() ),
		array( 'icon' => 'events', 'label' => 'אירועים', 'url' => get_post_type_archive_link( 'tc_event' ) ),
		array( 'icon' => 'online', 'label' => 'שירותים', 'url' => home_url( '/services/' ) ),
	);
	?>
	<nav class="tc-mobile-bottom-nav" aria-label="<?php esc_attr_e( 'ניווט מהיר', 'tirat-carmel' ); ?>">
		<?php foreach ( $items as $item ) : ?>
			<a href="<?php echo esc_url( $item['url'] ); ?>" class="<?php echo ! empty( $item['active'] ) ? 'is-active' : ''; ?>">
				<?php if ( ! empty( $item['active'] ) ) : ?>
					<span class="tc-mobile-bottom-nav__dot"><?php tc_mobile_nav_icon( $item['icon'] ); ?></span>
				<?php else : ?>
					<?php tc_mobile_nav_icon( $item['icon'] ); ?>
				<?php endif; ?>
				<span><?php echo esc_html( $item['label'] ); ?></span>
			</a>
		<?php endforeach; ?>
	</nav>
	<?php
}

function tc_mobile_nav_icon( $name ) {
	if ( 'home' === $name ) {
		echo '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 11.5 12 4l8 7.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10v9h12v-9" stroke-linejoin="round"/></svg>';
		return;
	}
	tc_icon( $name );
}
