<?php
/**
 * פונקציות תצוגה חוזרות (template tags) לתבנית.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * עיצוב תאריך בעברית בפורמט DD.MM.YYYY.
 */
function tc_format_date( $post_id = null, $meta_key = '' ) {
	if ( $meta_key ) {
		$raw = get_post_meta( $post_id ?: get_the_ID(), $meta_key, true );
		if ( ! $raw ) {
			return '';
		}
		$timestamp = strtotime( $raw );
	} else {
		$timestamp = get_post_timestamp( $post_id );
	}
	return $timestamp ? date_i18n( 'd.m.Y', $timestamp ) : '';
}

/**
 * כרטיס "כרטיס שירות" בעמוד הבית (הרשת של 7 הכרטיסים).
 */
function tc_render_service_card( $card ) {
	$icon  = $card['icon'] ?? 'default';
	$title = $card['title'] ?? '';
	$desc  = $card['desc'] ?? '';
	$link  = $card['link'] ?? '#';
	$variant = $card['variant'] ?? '';
	?>
	<a class="tc-service-card <?php echo esc_attr( $variant ); ?>" href="<?php echo esc_url( $link ); ?>">
		<span class="tc-service-card__icon" aria-hidden="true"><?php tc_icon( $icon ); ?></span>
		<span class="tc-service-card__title"><?php echo esc_html( $title ); ?></span>
		<?php if ( $desc ) : ?>
			<span class="tc-service-card__desc"><?php echo esc_html( $desc ); ?></span>
		<?php endif; ?>
	</a>
	<?php
}

/**
 * ספריית אייקוני SVG פשוטה (inline, ללא תלות חיצונית) עבור כרטיסי השירות והתפריטים.
 */
function tc_icon( $name ) {
	$icons = array(
		'emergency' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 2 20h20L12 3Z" stroke-linejoin="round"/><path d="M12 10v4" stroke-linecap="round"/><circle cx="12" cy="17" r="0.8" fill="currentColor" stroke="none"/></svg>',
		'payments'  => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M2.5 9.5h19" /><path d="M6 14.5h4" stroke-linecap="round"/></svg>',
		'events'    => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9.5h18" /><path d="M8 3v4M16 3v4" stroke-linecap="round"/><circle cx="7.7" cy="13.2" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="13.2" r="1" fill="currentColor" stroke="none"/><circle cx="16.3" cy="13.2" r="1" fill="currentColor" stroke="none"/></svg>',
		'updates'   => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" stroke-linejoin="round"/><path d="M10 20a2 2 0 0 0 4 0" /></svg>',
		'phone'     => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6.5 4h3l1.5 4.5-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4.5 1.5v3a2 2 0 0 1-2.2 2A17.5 17.5 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z" stroke-linejoin="round"/></svg>',
		'online'    => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="4.5" width="19" height="13" rx="1.5"/><path d="M9 21h6M12 17.5V21" stroke-linecap="round"/><path d="M7 9.5l2.5 2L7 13.5M13 13.5h3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
		'city'      => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 21V9l5-3 5 3v12" stroke-linejoin="round"/><path d="M14 21v-8l6-2v10" stroke-linejoin="round"/><path d="M7.5 12h1M7.5 15h1M11.5 12h1M11.5 15h1" stroke-linecap="round"/></svg>',
		'chat'      => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5.5h16v11H9l-4 3.5v-3.5H4Z" stroke-linejoin="round"/><path d="M8 9.5h8M8 12.5h5" stroke-linecap="round"/></svg>',
		'accessibility' => '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="4" r="1.9"/><path d="M4.5 8.2a1.2 1.2 0 0 1 1-1.4l6.2-1.1a1.4 1.4 0 0 1 .6 0l6.2 1.1a1.2 1.2 0 1 1-.4 2.4l-4.4-.8v3.2l4 6.9a1.2 1.2 0 1 1-2.1 1.2l-3.5-6.1-3.5 6.1a1.2 1.2 0 1 1-2.1-1.2l4-6.9V8.4l-4.4.8a1.2 1.2 0 0 1-1.6-1Z"/></svg>',
		'default'   => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/></svg>',
	);
	echo $icons[ $name ] ?? $icons['default']; // phpcs:ignore -- inline trusted SVG markup.
}

/**
 * כרטיס אירוע קרוב (עמוד הבית + ארכיון אירועים).
 */
function tc_render_event_card( $post_id ) {
	$date_raw = get_post_meta( $post_id, 'tc_event_date', true );
	$time     = get_post_meta( $post_id, 'tc_event_time', true );
	$location = get_post_meta( $post_id, 'tc_event_location', true );
	$day      = $date_raw ? date_i18n( 'j', strtotime( $date_raw ) ) : '';
	$month    = $date_raw ? date_i18n( 'M', strtotime( $date_raw ) ) : '';
	$weekday  = $date_raw ? date_i18n( 'l', strtotime( $date_raw ) ) : '';
	?>
	<a class="tc-event-card" href="<?php echo esc_url( get_permalink( $post_id ) ); ?>">
		<div class="tc-event-card__media">
			<?php if ( has_post_thumbnail( $post_id ) ) : ?>
				<?php echo get_the_post_thumbnail( $post_id, 'tc-card', array( 'alt' => get_the_title( $post_id ) ) ); ?>
			<?php else : ?>
				<div class="tc-event-card__placeholder" aria-hidden="true"><?php tc_icon( 'events' ); ?></div>
			<?php endif; ?>
			<?php if ( $day ) : ?>
				<span class="tc-event-card__date"><strong><?php echo esc_html( $day ); ?></strong><span><?php echo esc_html( $month ); ?></span></span>
			<?php endif; ?>
		</div>
		<div class="tc-event-card__body">
			<h3><?php echo esc_html( get_the_title( $post_id ) ); ?></h3>
			<p class="tc-event-card__excerpt"><?php echo esc_html( wp_trim_words( get_the_excerpt( $post_id ), 12 ) ); ?></p>
			<p class="tc-event-card__meta">
				<?php if ( $date_raw ) : ?><span><?php echo esc_html( tc_format_date( $post_id, 'tc_event_date' ) ); ?></span><?php endif; ?>
				<?php if ( $weekday ) : ?><span><?php echo esc_html( $weekday ); ?></span><?php endif; ?>
				<?php if ( $time ) : ?><span><?php echo esc_html( $time ); ?></span><?php endif; ?>
			</p>
			<?php if ( $location ) : ?>
				<p class="tc-event-card__location"><?php echo esc_html( $location ); ?></p>
			<?php endif; ?>
		</div>
	</a>
	<?php
}

/**
 * שורת "עדכון" ברצועת העדכונים החשובים בעמוד הבית.
 */
function tc_render_update_row( $post_id ) {
	?>
	<div class="tc-update-item">
		<span class="tc-update-item__date"><?php echo esc_html( tc_format_date( $post_id ) ); ?></span>
		<a class="tc-update-item__title" href="<?php echo esc_url( get_permalink( $post_id ) ); ?>"><?php echo esc_html( get_the_title( $post_id ) ); ?></a>
		<a class="tc-update-item__more" href="<?php echo esc_url( get_permalink( $post_id ) ); ?>"><?php esc_html_e( 'לפרטים נוספים', 'tirat-carmel' ); ?> <span aria-hidden="true">‹</span></a>
	</div>
	<?php
}

/**
 * תג סטטוס למכרז (פתוח / עומד להיסגר / סגור).
 */
function tc_tender_status( $post_id ) {
	$deadline = get_post_meta( $post_id, 'tc_tender_deadline', true );
	$manual   = get_post_meta( $post_id, 'tc_tender_status', true );

	if ( 'cancelled' === $manual ) {
		return array( 'label' => __( 'בוטל', 'tirat-carmel' ), 'class' => 'is-closed' );
	}

	if ( $deadline ) {
		$diff_days = ( strtotime( $deadline ) - current_time( 'timestamp' ) ) / DAY_IN_SECONDS;
		if ( $diff_days < 0 ) {
			return array( 'label' => __( 'סגור', 'tirat-carmel' ), 'class' => 'is-closed' );
		} elseif ( $diff_days <= 5 ) {
			return array( 'label' => __( 'נסגר בקרוב', 'tirat-carmel' ), 'class' => 'is-soon' );
		}
	}

	return array( 'label' => __( 'פתוח להגשה', 'tirat-carmel' ), 'class' => 'is-open' );
}

/**
 * אייקון לפי סוג קובץ מצורף (למכרזים/כתבות).
 */
function tc_file_icon_for( $url ) {
	$ext = strtolower( pathinfo( $url, PATHINFO_EXTENSION ) );
	$map = array(
		'pdf'  => 'PDF',
		'doc'  => 'DOC',
		'docx' => 'DOC',
		'xls'  => 'XLS',
		'xlsx' => 'XLS',
		'zip'  => 'ZIP',
	);
	return $map[ $ext ] ?? strtoupper( $ext ?: 'קובץ' );
}
