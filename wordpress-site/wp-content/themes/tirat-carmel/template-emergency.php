<?php
/**
 * Template Name: עמוד חירום
 * Template Post Type: page
 *
 * תבנית עמוד ייעודית ל"חירום": מוסיפה אוטומטית רולר עדכוני חירום ומפת
 * מקלטים ציבוריים מעל/מתחת לתוכן שהצוות כותב בעורך, ותומכת בצביעת העמוד
 * בצבע התראה (נקבע ב-עיריית טירת כרמל > הגדרות > מצב חירום).
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$alert_mode  = (bool) tc_core_get_option( 'emergency_page_alert_mode', false );
$alert_color = tc_core_get_option( 'emergency_page_alert_color', '#e2483c' );

get_header();
?>

<?php if ( $alert_mode ) : ?>
	<style>
		.tc-emergency-page .tc-page-header { background: linear-gradient(135deg, <?php echo esc_html( $alert_color ); ?> 0%, #7a1712 100%) !important; }
		.tc-emergency-page .tc-updates__label { background: <?php echo esc_html( $alert_color ); ?> !important; }
		.tc-emergency-page .tc-section-heading h2 svg,
		.tc-emergency-page .tc-page-header svg { color: <?php echo esc_html( $alert_color ); ?>; }
		.tc-emergency-page .tc-btn--primary { background: <?php echo esc_html( $alert_color ); ?> !important; }
	</style>
<?php endif; ?>

<div class="<?php echo $alert_mode ? 'tc-emergency-page' : ''; ?>">

	<header class="tc-page-header">
		<div class="tc-container">
			<?php tc_breadcrumbs(); ?>
			<h1><?php the_title(); ?></h1>
			<?php if ( $alert_mode ) : ?>
				<p class="tc-page-header__subtitle"><?php esc_html_e( 'מצב חירום פעיל - עקבו אחר ההנחיות המעודכנות בעמוד זה ובמוקד 106', 'tirat-carmel' ); ?></p>
			<?php endif; ?>
		</div>
	</header>

	<div class="tc-container tc-content-layout tc-content-layout--full">
		<?php
		while ( have_posts() ) :
			the_post();
			?>
			<article class="tc-entry-content">
				<?php the_content(); ?>
			</article>
			<?php
		endwhile;
		?>
	</div>

	<?php
	tc_render_updates_ticker( array(
		'category'   => 'emergency',
		'label'      => __( 'עדכוני חירום', 'tirat-carmel' ),
		'link'       => home_url( '/blog/' ),
		'link_label' => __( 'לכל העדכונים', 'tirat-carmel' ),
	) );
	?>

	<section class="tc-shelters" aria-label="<?php esc_attr_e( 'מפת מקלטים ציבוריים', 'tirat-carmel' ); ?>">
		<div class="tc-container">
			<div class="tc-section-heading">
				<h2><span aria-hidden="true"><?php tc_icon( 'city' ); ?></span> <?php esc_html_e( 'מפת מקלטים ציבוריים', 'tirat-carmel' ); ?></h2>
			</div>
			<?php echo do_shortcode( '[tc_shelter_map]' ); ?>
		</div>
	</section>

</div>

<?php get_footer(); ?>
