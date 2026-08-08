<?php
/**
 * כותרת תחתונה (Footer) - משותפת לכל עמודי האתר.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
</main><!-- .tc-main -->

<div class="tc-cta-bar">
	<div class="tc-container tc-cta-bar__inner">
		<div class="tc-cta-bar__text">
			<span class="tc-cta-bar__icon" aria-hidden="true"><?php tc_icon( 'phone' ); ?></span>
			<div>
				<strong><?php echo esc_html( tc_option( 'call_center_title', 'מוקד 106 לשירותך 24/7' ) ); ?></strong>
				<span><?php echo esc_html( tc_option( 'call_center_subtitle', 'לפניות, דיווחים ושירות לתושב' ) ); ?></span>
			</div>
		</div>
		<a class="tc-btn tc-btn--primary" href="tel:106"><?php tc_icon( 'phone' ); ?> <?php esc_html_e( 'לחצו לחיוג 106', 'tirat-carmel' ); ?></a>
	</div>
</div>

<footer class="tc-footer">
	<div class="tc-footer__wave" aria-hidden="true"></div>
	<div class="tc-container tc-footer__grid">
		<div class="tc-footer__col tc-footer__col--social">
			<h3><?php esc_html_e( 'הישארו מעודכנים', 'tirat-carmel' ); ?></h3>
			<div class="tc-social-links">
				<?php
				$socials = array(
					'facebook'  => tc_option( 'social_facebook' ),
					'instagram' => tc_option( 'social_instagram' ),
					'youtube'   => tc_option( 'social_youtube' ),
					'whatsapp'  => tc_option( 'social_whatsapp' ),
				);
				foreach ( $socials as $network => $url ) :
					if ( ! $url ) { continue; }
					?>
					<a href="<?php echo esc_url( $url ); ?>" class="tc-social-links__item" aria-label="<?php echo esc_attr( $network ); ?>" target="_blank" rel="noopener noreferrer">
						<?php tc_social_icon( $network ); ?>
					</a>
				<?php endforeach; ?>
			</div>
			<?php echo do_shortcode( '[tc_newsletter_form]' ); ?>
		</div>

		<div class="tc-footer__col tc-footer__col--sitemap">
			<h3><?php esc_html_e( 'מפת אתר', 'tirat-carmel' ); ?></h3>
			<?php
			wp_nav_menu( array(
				'theme_location' => 'footer',
				'container'      => false,
				'menu_class'     => 'tc-footer__links',
				'fallback_cb'    => false,
			) );
			?>
		</div>

		<div class="tc-footer__col tc-footer__col--contact">
			<h3><?php esc_html_e( 'יצירת קשר', 'tirat-carmel' ); ?></h3>
			<ul class="tc-footer__contact">
				<?php if ( tc_option( 'address' ) ) : ?><li><?php echo esc_html( tc_option( 'address' ) ); ?></li><?php endif; ?>
				<?php if ( tc_option( 'phone' ) ) : ?><li><a href="tel:<?php echo esc_attr( tc_option( 'phone' ) ); ?>"><?php echo esc_html( tc_option( 'phone' ) ); ?></a></li><?php endif; ?>
				<?php if ( tc_option( 'email' ) ) : ?><li><a href="mailto:<?php echo esc_attr( tc_option( 'email' ) ); ?>"><?php echo esc_html( tc_option( 'email' ) ); ?></a></li><?php endif; ?>
			</ul>
		</div>

		<div class="tc-footer__col tc-footer__col--brand">
			<?php if ( has_custom_logo() ) : the_custom_logo(); else : ?>
				<strong class="tc-footer__brand-title"><?php bloginfo( 'name' ); ?></strong>
			<?php endif; ?>
			<p><?php echo esc_html( tc_option( 'footer_slogan', 'טירת כרמל – עיר מתקדמת, איכותית וקהילתית בין כרמל לים.' ) ); ?></p>
		</div>
	</div>

	<div class="tc-footer__bottom">
		<div class="tc-container">
			<p>
				<?php
				printf(
					/* translators: %s: שנה נוכחית */
					esc_html__( 'כל הזכויות שמורות לעיריית טירת כרמל © %s', 'tirat-carmel' ),
					esc_html( date_i18n( 'Y' ) )
				);
				?>
			</p>
		</div>
	</div>
</footer>

<?php if ( get_theme_mod( 'tc_enable_accessibility_widget', true ) ) : ?>
	<?php get_template_part( 'template-parts/accessibility-widget' ); ?>
<?php endif; ?>

<?php if ( get_theme_mod( 'tc_enable_chatbot', true ) ) : ?>
	<?php get_template_part( 'template-parts/chatbot-widget' ); ?>
<?php endif; ?>

<?php if ( function_exists( 'tc_render_whatsapp_button' ) ) : ?>
	<?php tc_render_whatsapp_button(); ?>
<?php endif; ?>

<?php if ( function_exists( 'tc_render_cookie_consent' ) ) : ?>
	<?php tc_render_cookie_consent(); ?>
<?php endif; ?>

<?php wp_footer(); ?>
</body>
</html>
<?php
/**
 * אייקוני רשתות חברתיות.
 */
function tc_social_icon( $network ) {
	$icons = array(
		'facebook'  => '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 8.5h2.5V5.2c-.4-.05-1.9-.2-3.6-.2-3.6 0-6 2.2-6 6.2v3.3H3.5V18h3.4v10h4V18h3.6l.6-3.5h-4.2v-2.9c0-1 .3-1.7 1.7-1.7Z"/></svg>',
		'instagram' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none"/></svg>',
		'youtube'   => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2.5" y="5.5" width="19" height="13" rx="3"/><path d="M10.5 9.5v5l4.3-2.5Z" fill="currentColor" stroke="none"/></svg>',
		'whatsapp'  => '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Zm0 2a7 7 0 0 1 6 10.6l-.3.5.6 2.3-2.4-.6-.5.3A7 7 0 1 1 12 5Zm-3.4 3.2c-.2 0-.5.1-.7.4-.2.3-.9.9-.9 2.1s.9 2.5 1 2.6c.1.2 1.8 2.9 4.5 4 2.2.9 2.6.7 3.1.7.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.1.1-1.3-.1-.1-.3-.2-.6-.4-.3-.2-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.9 1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.5-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.6-.9-2.1-.2-.5-.4-.4-.6-.4Z"/></svg>',
	);
	echo $icons[ $network ] ?? ''; // phpcs:ignore -- inline trusted SVG markup.
}
