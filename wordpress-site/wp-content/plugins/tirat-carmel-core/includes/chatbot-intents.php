<?php
/**
 * בוט הניווט הצף באתר - "כוונים" (intents) הניתנים לעריכה מלאה בפאנל הניהול,
 * בלי תלות בשירות AI חיצוני בתשלום. כל כוונה: מילות מפתח, תשובה, וכפתור ניווט.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function tc_core_register_chatbot_intent_cpt() {
	register_post_type( 'tc_chatbot_intent', array(
		'labels' => array(
			'name'          => __( 'כוונים לבוט הניווט', 'tirat-carmel' ),
			'singular_name' => __( 'כוונה', 'tirat-carmel' ),
			'add_new_item'  => __( 'הוספת כוונה חדשה', 'tirat-carmel' ),
			'edit_item'     => __( 'עריכת כוונה', 'tirat-carmel' ),
			'menu_name'     => __( 'בוט ניווט', 'tirat-carmel' ),
		),
		'public'       => false,
		'show_ui'      => true,
		'show_in_menu' => 'tc-core-settings',
		'supports'     => array( 'title' ),
		'show_in_rest' => false,
	) );
}
add_action( 'init', 'tc_core_register_chatbot_intent_cpt' );

function tc_core_register_chatbot_metabox() {
	add_meta_box( 'tc_chatbot_intent_fields', __( 'פרטי הכוונה', 'tirat-carmel' ), 'tc_core_render_chatbot_metabox', 'tc_chatbot_intent', 'normal', 'high' );
}
add_action( 'add_meta_boxes', 'tc_core_register_chatbot_metabox' );

function tc_core_render_chatbot_metabox( $post ) {
	wp_nonce_field( 'tc_chatbot_intent_save', 'tc_chatbot_intent_nonce' );
	$keywords     = get_post_meta( $post->ID, 'keywords', true );
	$response     = get_post_meta( $post->ID, 'response', true );
	$button_label = get_post_meta( $post->ID, 'button_label', true );
	$button_url   = get_post_meta( $post->ID, 'button_url', true );
	?>
	<p class="description"><?php esc_html_e( 'כותרת הפוסט = שם הכוונה לזיהוי פנימי בלבד (למשל "מכרזים"). היא לא מוצגת למשתמש.', 'tirat-carmel' ); ?></p>
	<p>
		<label for="keywords"><strong><?php esc_html_e( 'מילות מפתח (מופרדות בפסיקים) - הבוט יזהה כל אחת מהן בהודעת התושב', 'tirat-carmel' ); ?></strong></label><br>
		<input type="text" class="widefat" id="keywords" name="keywords" value="<?php echo esc_attr( $keywords ); ?>" placeholder="<?php esc_attr_e( 'מכרזים, מכרז, הצעות', 'tirat-carmel' ); ?>">
	</p>
	<p>
		<label for="response"><strong><?php esc_html_e( 'תשובת הבוט', 'tirat-carmel' ); ?></strong></label><br>
		<textarea class="widefat" rows="3" id="response" name="response"><?php echo esc_textarea( $response ); ?></textarea>
	</p>
	<p>
		<label for="button_label"><strong><?php esc_html_e( 'טקסט כפתור ניווט (אופציונלי)', 'tirat-carmel' ); ?></strong></label><br>
		<input type="text" class="widefat" id="button_label" name="button_label" value="<?php echo esc_attr( $button_label ); ?>" placeholder="<?php esc_attr_e( 'למעבר לעמוד המכרזים', 'tirat-carmel' ); ?>">
	</p>
	<p>
		<label for="button_url"><strong><?php esc_html_e( 'קישור הכפתור (נתיב יחסי או כתובת מלאה)', 'tirat-carmel' ); ?></strong></label><br>
		<input type="text" class="widefat" id="button_url" name="button_url" value="<?php echo esc_attr( $button_url ); ?>" placeholder="/tenders/">
	</p>
	<?php
}

function tc_core_save_chatbot_intent_meta( $post_id ) {
	if ( ! isset( $_POST['tc_chatbot_intent_nonce'] ) || ! wp_verify_nonce( $_POST['tc_chatbot_intent_nonce'], 'tc_chatbot_intent_save' ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	$fields = array( 'keywords' => 'sanitize_text_field', 'response' => 'sanitize_textarea_field', 'button_label' => 'sanitize_text_field', 'button_url' => 'sanitize_text_field' );
	foreach ( $fields as $field => $sanitizer ) {
		if ( isset( $_POST[ $field ] ) ) {
			update_post_meta( $post_id, $field, call_user_func( $sanitizer, wp_unslash( $_POST[ $field ] ) ) );
		}
	}
}
add_action( 'save_post_tc_chatbot_intent', 'tc_core_save_chatbot_intent_meta' );

function tc_core_default_chatbot_intents() {
	return array(
		array( 'keywords' => array( 'מכרז', 'מכרזים', 'הצעות מחיר' ), 'response' => 'ניתן לצפות בכל המכרזים הפתוחים והסגורים בעמוד המכרזים.', 'button_label' => 'מעבר לעמוד המכרזים', 'button_url' => '/tenders/' ),
		array( 'keywords' => array( 'תשלום', 'תשלומים', 'ארנונה', 'חוב', 'לשלם' ), 'response' => 'תשלומים, ארנונה ואגרות ניתן לבצע בעמוד התשלומים המקוון.', 'button_label' => 'מעבר לתשלומים', 'button_url' => '/payments/' ),
		array( 'keywords' => array( 'אירוע', 'אירועים', 'הרצאה', 'פעילות' ), 'response' => 'כל האירועים הקרובים בעיר מרוכזים בעמוד האירועים.', 'button_label' => 'מעבר לאירועים', 'button_url' => '/events/' ),
		array( 'keywords' => array( 'יצירת קשר', 'פנייה', 'טלפון', 'מייל', 'דואר אלקטרוני' ), 'response' => 'ניתן ליצור קשר עם העירייה דרך עמוד יצירת הקשר, או בטלפון 106 הפעיל 24/7.', 'button_label' => 'יצירת קשר', 'button_url' => '/contact/' ),
		array( 'keywords' => array( 'נגישות', 'הצהרת נגישות', 'עיוור', 'כבד ראייה' ), 'response' => 'האתר עומד בדרישות הנגישות. ניתן לפתוח את תפריט הנגישות בכפתור הכחול בפינה, או לקרוא את הצהרת הנגישות המלאה.', 'button_label' => 'הצהרת נגישות', 'button_url' => '/accessibility/' ),
		array( 'keywords' => array( 'חירום', 'מקלט', 'אזעקה', 'פיקוד העורף' ), 'response' => 'מידע לשעת חירום ומיקומי מקלטים ציבוריים מרוכזים בעמוד החירום.', 'button_label' => 'מעבר לעמוד החירום', 'button_url' => '/emergency/' ),
		array( 'keywords' => array( 'שעות פתיחה', 'שעות קבלת קהל', 'מתי פתוח' ), 'response' => 'שעות קבלת הקהל משתנות בין המחלקות - הפרטים המלאים בעמוד "העיר והעירייה", ומוקד 106 זמין 24/7.', 'button_label' => 'העיר והעירייה', 'button_url' => '/city/' ),
		array( 'keywords' => array( 'שלום', 'היי', 'הי' ), 'response' => 'שלום! אני עוזר הניווט של אתר עיריית טירת כרמל. אפשר לשאול אותי על מכרזים, תשלומים, אירועים, יצירת קשר, נגישות ועוד.', 'button_label' => '', 'button_url' => '' ),
	);
}

function tc_core_get_chatbot_intents() {
	$posts = get_posts( array(
		'post_type'      => 'tc_chatbot_intent',
		'posts_per_page' => -1,
		'post_status'    => 'publish',
	) );

	if ( empty( $posts ) ) {
		return tc_core_default_chatbot_intents();
	}

	return array_map( function ( $post ) {
		$keywords_raw = get_post_meta( $post->ID, 'keywords', true );
		return array(
			'keywords'     => array_filter( array_map( 'trim', explode( ',', (string) $keywords_raw ) ) ),
			'response'     => get_post_meta( $post->ID, 'response', true ),
			'button_label' => get_post_meta( $post->ID, 'button_label', true ),
			'button_url'   => get_post_meta( $post->ID, 'button_url', true ),
		);
	}, $posts );
}
