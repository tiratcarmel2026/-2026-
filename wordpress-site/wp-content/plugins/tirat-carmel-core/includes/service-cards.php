<?php
/**
 * ניהול "כרטיסי השירות" בעמוד הבית (הרשת עם 7 הכרטיסים: חירום, תשלומים וכו').
 * ניתן להוסיף/להסיר/לערוך/לסדר מחדש בלי לגעת בקוד.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function tc_core_default_service_cards() {
	return array(
		array( 'icon' => 'emergency', 'title' => 'חירום', 'desc' => 'מידע חשוב ושירותים לשעת חירום', 'link' => '/emergency/', 'variant' => 'is-alert' ),
		array( 'icon' => 'payments', 'title' => 'תשלומים', 'desc' => 'תשלומים, אגרות וחיובים', 'link' => '/payments/', 'variant' => '' ),
		array( 'icon' => 'events', 'title' => 'אירועים', 'desc' => 'אירועים, פעילויות והרצאות בעיר', 'link' => '/events/', 'variant' => '' ),
		array( 'icon' => 'updates', 'title' => 'עדכונים', 'desc' => 'כל העדכונים מהעירייה', 'link' => '/blog/', 'variant' => '' ),
		array( 'icon' => 'phone', 'title' => 'מוקד 106', 'desc' => 'לשירותכם 24/7 בטלפון ובדיגיטל', 'link' => 'tel:106', 'variant' => '' ),
		array( 'icon' => 'online', 'title' => 'שירותים מקוונים', 'desc' => 'כל השירותים במקום אחד', 'link' => '/services/', 'variant' => '' ),
		array( 'icon' => 'city', 'title' => 'העיר והעירייה', 'desc' => 'מידע על העירייה, הנהגה ומוסדות', 'link' => '/city/', 'variant' => '' ),
	);
}

function tc_core_get_service_card_icons() {
	return array(
		'emergency' => 'חירום (משולש אזהרה)',
		'payments'  => 'תשלומים (כרטיס אשראי)',
		'events'    => 'אירועים (לוח שנה)',
		'updates'   => 'עדכונים (פעמון)',
		'phone'     => 'טלפון/מוקד (אוזניות)',
		'online'    => 'שירותים מקוונים (מסך)',
		'city'      => 'העירייה (בניין)',
		'chat'      => 'צ׳אט',
		'default'   => 'ברירת מחדל (עיגול)',
	);
}

function tc_get_service_cards() {
	$saved = get_option( 'tc_core_service_cards' );
	$cards = is_array( $saved ) && ! empty( $saved ) ? $saved : tc_core_default_service_cards();

	return array_map( function ( $card ) {
		$link = $card['link'] ?? '#';
		if ( $link && ! preg_match( '#^(https?:)?//#', $link ) && 'tel:' !== substr( $link, 0, 4 ) && 'mailto:' !== substr( $link, 0, 7 ) ) {
			$link = home_url( $link );
		}
		$card['link'] = $link;
		return $card;
	}, $cards );
}

function tc_core_register_service_cards_page() {
	add_submenu_page(
		'tc-core-settings',
		__( 'כרטיסי שירות בעמוד הבית', 'tirat-carmel' ),
		__( 'כרטיסי שירות', 'tirat-carmel' ),
		'manage_options',
		'tc-service-cards',
		'tc_core_render_service_cards_page'
	);
}
add_action( 'admin_menu', 'tc_core_register_service_cards_page' );

function tc_core_render_service_cards_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( isset( $_POST['tc_service_cards_nonce'] ) && wp_verify_nonce( $_POST['tc_service_cards_nonce'], 'tc_service_cards_save' ) ) {
		$raw   = isset( $_POST['cards'] ) ? (array) $_POST['cards'] : array();
		$clean = array();
		foreach ( $raw as $row ) {
			if ( empty( $row['title'] ) ) {
				continue;
			}
			$clean[] = array(
				'icon'    => sanitize_key( $row['icon'] ?? 'default' ),
				'title'   => sanitize_text_field( $row['title'] ),
				'desc'    => sanitize_text_field( $row['desc'] ?? '' ),
				'link'    => sanitize_text_field( $row['link'] ?? '#' ),
				'variant' => sanitize_html_class( $row['variant'] ?? '' ),
			);
		}
		update_option( 'tc_core_service_cards', $clean );
		echo '<div class="notice notice-success"><p>' . esc_html__( 'כרטיסי השירות נשמרו בהצלחה.', 'tirat-carmel' ) . '</p></div>';
	}

	$cards = get_option( 'tc_core_service_cards' );
	$cards = is_array( $cards ) && ! empty( $cards ) ? $cards : tc_core_default_service_cards();
	$icons = tc_core_get_service_card_icons();
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'כרטיסי שירות בעמוד הבית', 'tirat-carmel' ); ?></h1>
		<p><?php esc_html_e( 'אלו 7 הכרטיסים בראש עמוד הבית (חירום, תשלומים, אירועים...). ניתן לערוך כותרת, תיאור קצר, קישור ואייקון לכל כרטיס, להוסיף כרטיסים חדשים או למחוק קיימים.', 'tirat-carmel' ); ?></p>
		<form method="post">
			<?php wp_nonce_field( 'tc_service_cards_save', 'tc_service_cards_nonce' ); ?>
			<div id="tc-service-cards-repeater" data-index="<?php echo esc_attr( count( $cards ) ); ?>">
				<div id="tc-service-cards-rows">
					<?php foreach ( $cards as $i => $card ) : ?>
						<?php tc_core_service_card_row( $i, $card, $icons ); ?>
					<?php endforeach; ?>
				</div>
				<p><button type="button" class="button" id="tc-add-service-card"><?php esc_html_e( '+ הוספת כרטיס', 'tirat-carmel' ); ?></button></p>
			</div>
			<script type="text/html" id="tmpl-tc-service-card-row">
				<?php tc_core_service_card_row( '__INDEX__', array(), $icons ); ?>
			</script>
			<?php submit_button( __( 'שמירת כרטיסי השירות', 'tirat-carmel' ) ); ?>
		</form>
	</div>
	<?php
}

function tc_core_service_card_row( $index, $card, $icons ) {
	$icon    = $card['icon'] ?? 'default';
	$title   = $card['title'] ?? '';
	$desc    = $card['desc'] ?? '';
	$link    = $card['link'] ?? '';
	$variant = $card['variant'] ?? '';
	?>
	<div class="tc-service-card-row">
		<span class="tc-repeater-row-handle dashicons dashicons-menu" aria-hidden="true"></span>
		<div class="field">
			<label><?php esc_html_e( 'כותרת', 'tirat-carmel' ); ?></label>
			<input type="text" class="regular-text" name="cards[<?php echo esc_attr( $index ); ?>][title]" value="<?php echo esc_attr( $title ); ?>" required>
		</div>
		<div class="field">
			<label><?php esc_html_e( 'תיאור קצר', 'tirat-carmel' ); ?></label>
			<input type="text" class="regular-text" name="cards[<?php echo esc_attr( $index ); ?>][desc]" value="<?php echo esc_attr( $desc ); ?>">
		</div>
		<div class="field">
			<label><?php esc_html_e( 'קישור (נתיב יחסי כמו ‎/payments/‎, כתובת מלאה, tel: או mailto:)', 'tirat-carmel' ); ?></label>
			<input type="text" class="regular-text" name="cards[<?php echo esc_attr( $index ); ?>][link]" value="<?php echo esc_attr( $link ); ?>">
		</div>
		<div class="field">
			<label><?php esc_html_e( 'אייקון', 'tirat-carmel' ); ?></label>
			<select name="cards[<?php echo esc_attr( $index ); ?>][icon]">
				<?php foreach ( $icons as $key => $label ) : ?>
					<option value="<?php echo esc_attr( $key ); ?>" <?php selected( $icon, $key ); ?>><?php echo esc_html( $label ); ?></option>
				<?php endforeach; ?>
			</select>
		</div>
		<div class="field">
			<label><input type="checkbox" name="cards[<?php echo esc_attr( $index ); ?>][variant]" value="is-alert" <?php checked( $variant, 'is-alert' ); ?>> <?php esc_html_e( 'הדגשה באדום (למשל: חירום)', 'tirat-carmel' ); ?></label>
		</div>
		<p><button type="button" class="button-link-delete tc-remove-service-card"><?php esc_html_e( 'הסרת כרטיס', 'tirat-carmel' ); ?></button></p>
	</div>
	<?php
}

function tc_core_service_cards_admin_assets( $hook ) {
	if ( false === strpos( $hook, 'tc-service-cards' ) ) {
		return;
	}
	wp_enqueue_style( 'tc-admin', TC_CORE_URL . 'assets/css/admin.css', array(), TC_CORE_VERSION );
	wp_enqueue_script( 'tc-service-cards-admin', TC_CORE_URL . 'assets/js/service-cards-admin.js', array(), TC_CORE_VERSION, true );
}
add_action( 'admin_enqueue_scripts', 'tc_core_service_cards_admin_assets' );
