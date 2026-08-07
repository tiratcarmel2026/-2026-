<?php
/**
 * עמוד הבית - תמונת העיר, כרטיסי שירות, עדכונים חשובים ואירועים קרובים.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();

$hero_image = get_theme_mod( 'tc_hero_image', TC_THEME_URI . '/assets/img/hero-placeholder.svg' );
$hero_title = get_bloginfo( 'name' ) ?: 'טירת כרמל';
$hero_sub   = get_theme_mod( 'tc_hero_subtitle', 'סביבה טובה בין כרמל לים' );
?>

<section class="tc-hero" style="--tc-hero-image: url('<?php echo esc_url( $hero_image ); ?>');">
	<div class="tc-hero__overlay"></div>
	<div class="tc-container tc-hero__content">
		<h1><?php echo esc_html( $hero_title ); ?></h1>
		<p><?php echo esc_html( $hero_sub ); ?></p>
	</div>
</section>

<section class="tc-services" aria-label="<?php esc_attr_e( 'כרטיסי שירות מהירים', 'tirat-carmel' ); ?>">
	<div class="tc-container tc-services__grid">
		<?php
		$cards = function_exists( 'tc_get_service_cards' ) ? tc_get_service_cards() : array();
		if ( empty( $cards ) ) {
			$cards = array(
				array( 'icon' => 'emergency', 'title' => 'חירום', 'desc' => 'מידע חשוב ושירותים לשעת חירום', 'link' => home_url( '/emergency/' ), 'variant' => 'is-alert' ),
				array( 'icon' => 'payments', 'title' => 'תשלומים', 'desc' => 'תשלומים, אגרות וחיובים', 'link' => home_url( '/payments/' ) ),
				array( 'icon' => 'events', 'title' => 'אירועים', 'desc' => 'אירועים, פעילויות והרצגות בעיר', 'link' => get_post_type_archive_link( 'tc_event' ) ),
				array( 'icon' => 'updates', 'title' => 'עדכונים', 'desc' => 'כל העדכונים מהעירייה', 'link' => home_url( '/blog/' ) ),
				array( 'icon' => 'phone', 'title' => 'מוקד 106', 'desc' => 'לשירותכם 24/7 בטלפון ובדיגיטל', 'link' => 'tel:106' ),
				array( 'icon' => 'online', 'title' => 'שירותים מקוונים', 'desc' => 'כל השירותים במקום אחד', 'link' => home_url( '/services/' ) ),
				array( 'icon' => 'city', 'title' => 'העיר והעירייה', 'desc' => 'מידע על העירייה, הנהגה ומוסדות', 'link' => home_url( '/city/' ) ),
			);
		}
		foreach ( $cards as $card ) {
			tc_render_service_card( $card );
		}
		?>
	</div>
</section>

<section class="tc-updates" aria-label="<?php esc_attr_e( 'עדכונים חשובים', 'tirat-carmel' ); ?>">
	<div class="tc-container tc-updates__bar">
		<button type="button" class="tc-updates__nav tc-updates__nav--prev" aria-label="<?php esc_attr_e( 'העדכון הקודם', 'tirat-carmel' ); ?>">‹</button>

		<div class="tc-updates__track">
			<?php
			$updates_query = new WP_Query( array(
				'post_type'      => 'post',
				'posts_per_page' => 6,
				'no_found_rows'  => true,
			) );
			if ( $updates_query->have_posts() ) {
				while ( $updates_query->have_posts() ) {
					$updates_query->the_post();
					tc_render_update_row( get_the_ID() );
				}
				wp_reset_postdata();
			} else {
				echo '<p class="tc-empty">' . esc_html__( 'אין עדכונים חדשים כרגע.', 'tirat-carmel' ) . '</p>';
			}
			?>
		</div>

		<button type="button" class="tc-updates__nav tc-updates__nav--next" aria-label="<?php esc_attr_e( 'העדכון הבא', 'tirat-carmel' ); ?>">›</button>

		<div class="tc-updates__label">
			<span aria-hidden="true"><?php tc_icon( 'updates' ); ?></span>
			<?php esc_html_e( 'עדכונים חשובים', 'tirat-carmel' ); ?>
		</div>
	</div>
	<div class="tc-container">
		<a class="tc-link-all" href="<?php echo esc_url( home_url( '/blog/' ) ); ?>">‹ <?php esc_html_e( 'לכל העדכונים', 'tirat-carmel' ); ?></a>
	</div>
</section>

<section class="tc-events" aria-label="<?php esc_attr_e( 'אירועים קרובים', 'tirat-carmel' ); ?>">
	<div class="tc-container">
		<div class="tc-section-heading">
			<h2><span aria-hidden="true"><?php tc_icon( 'events' ); ?></span> <?php esc_html_e( 'אירועים קרובים', 'tirat-carmel' ); ?></h2>
			<a class="tc-link-all" href="<?php echo esc_url( get_post_type_archive_link( 'tc_event' ) ); ?>">‹ <?php esc_html_e( 'לכל האירועים', 'tirat-carmel' ); ?></a>
		</div>

		<div class="tc-events__grid">
			<?php
			$events_query = new WP_Query( array(
				'post_type'      => 'tc_event',
				'posts_per_page' => 3,
				'meta_key'       => 'tc_event_date',
				'orderby'        => 'meta_value',
				'order'          => 'ASC',
				'meta_query'     => array(
					array(
						'key'     => 'tc_event_date',
						'value'   => current_time( 'Y-m-d' ),
						'compare' => '>=',
						'type'    => 'DATE',
					),
				),
			) );
			if ( $events_query->have_posts() ) {
				while ( $events_query->have_posts() ) {
					$events_query->the_post();
					tc_render_event_card( get_the_ID() );
				}
				wp_reset_postdata();
			} else {
				echo '<p class="tc-empty">' . esc_html__( 'אין אירועים קרובים כרגע - עקבו אחרינו לעדכונים.', 'tirat-carmel' ) . '</p>';
			}
			?>
		</div>
	</div>
</section>

<?php get_footer(); ?>
