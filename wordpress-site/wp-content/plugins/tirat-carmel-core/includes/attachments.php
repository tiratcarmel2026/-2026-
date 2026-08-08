<?php
/**
 * רכיב "קבצים מצורפים" משותף - לכתבות (post), מכרזים (tender) ומסמכי שקיפות
 * (protocol). מאפשר לצוות העירייה לצרף PDF / Word / Excel / תמונות מתוך
 * ספריית המדיה של וורדפרס, בלי צורך בעריכת קוד.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function tc_core_attachments_post_types() {
	return apply_filters( 'tc_core_attachments_post_types', array( 'post', 'tender', 'protocol' ) );
}

function tc_core_register_attachments_metabox() {
	foreach ( tc_core_attachments_post_types() as $post_type ) {
		add_meta_box(
			'tc_attachments_box',
			__( 'קבצים מצורפים (PDF, Word, Excel, תמונות)', 'tirat-carmel' ),
			'tc_core_render_attachments_metabox',
			$post_type,
			'normal',
			'high'
		);
	}
}
add_action( 'add_meta_boxes', 'tc_core_register_attachments_metabox' );

function tc_core_render_attachments_metabox( $post ) {
	wp_nonce_field( 'tc_attachments_save', 'tc_attachments_nonce' );
	$items = get_post_meta( $post->ID, 'tc_attachments', true );
	if ( ! is_array( $items ) ) {
		$items = array();
	}
	?>
	<div id="tc-attachments-repeater" data-index="<?php echo esc_attr( count( $items ) ); ?>">
		<p class="description"><?php esc_html_e( 'לחצו על "הוספת קובץ" כדי להעלות או לבחור קובץ מספריית המדיה. ניתן לצרף כמה קבצים וקישורים ככל שנדרש.', 'tirat-carmel' ); ?></p>
		<table class="widefat tc-attachments-table">
			<thead>
				<tr>
					<th><?php esc_html_e( 'תווית להצגה', 'tirat-carmel' ); ?></th>
					<th><?php esc_html_e( 'קובץ / קישור', 'tirat-carmel' ); ?></th>
					<th></th>
				</tr>
			</thead>
			<tbody id="tc-attachments-rows">
				<?php foreach ( $items as $i => $item ) : ?>
					<?php tc_core_attachment_row( $i, $item ); ?>
				<?php endforeach; ?>
			</tbody>
		</table>
		<p><button type="button" class="button button-secondary" id="tc-add-attachment"><?php esc_html_e( '+ הוספת קובץ', 'tirat-carmel' ); ?></button></p>
	</div>
	<script type="text/html" id="tmpl-tc-attachment-row">
		<?php tc_core_attachment_row( '__INDEX__', array() ); ?>
	</script>
	<?php
}

function tc_core_attachment_row( $index, $item ) {
	$label = $item['label'] ?? '';
	$url   = $item['url'] ?? '';
	$id    = $item['id'] ?? '';
	?>
	<tr class="tc-attachment-row">
		<td>
			<input type="text" name="tc_attachments[<?php echo esc_attr( $index ); ?>][label]" value="<?php echo esc_attr( $label ); ?>" placeholder="<?php esc_attr_e( 'לדוגמה: מסמך המכרז המלא', 'tirat-carmel' ); ?>" class="widefat">
		</td>
		<td>
			<input type="hidden" class="tc-attachment-id" name="tc_attachments[<?php echo esc_attr( $index ); ?>][id]" value="<?php echo esc_attr( $id ); ?>">
			<input type="text" class="tc-attachment-url widefat" name="tc_attachments[<?php echo esc_attr( $index ); ?>][url]" value="<?php echo esc_attr( $url ); ?>" placeholder="<?php esc_attr_e( 'ייבחר אוטומטית לאחר העלאה, או הדביקו קישור', 'tirat-carmel' ); ?>">
			<button type="button" class="button tc-attachment-pick"><?php esc_html_e( 'בחירת קובץ', 'tirat-carmel' ); ?></button>
		</td>
		<td><button type="button" class="button-link-delete tc-attachment-remove"><?php esc_html_e( 'הסרה', 'tirat-carmel' ); ?></button></td>
	</tr>
	<?php
}

function tc_core_save_attachments( $post_id ) {
	if ( ! isset( $_POST['tc_attachments_nonce'] ) || ! wp_verify_nonce( $_POST['tc_attachments_nonce'], 'tc_attachments_save' ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	$raw   = isset( $_POST['tc_attachments'] ) ? (array) $_POST['tc_attachments'] : array();
	$clean = array();
	foreach ( $raw as $row ) {
		$url = isset( $row['url'] ) ? esc_url_raw( trim( $row['url'] ) ) : '';
		if ( ! $url ) {
			continue;
		}
		$clean[] = array(
			'label' => isset( $row['label'] ) ? sanitize_text_field( $row['label'] ) : '',
			'url'   => $url,
			'id'    => isset( $row['id'] ) ? absint( $row['id'] ) : 0,
		);
	}
	update_post_meta( $post_id, 'tc_attachments', $clean );
}
add_action( 'save_post', 'tc_core_save_attachments' );

function tc_core_attachments_admin_assets( $hook ) {
	global $post_type;
	if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) ) {
		return;
	}
	if ( ! in_array( $post_type, tc_core_attachments_post_types(), true ) ) {
		return;
	}
	wp_enqueue_media();
	wp_enqueue_script(
		'tc-attachments-admin',
		TC_CORE_URL . 'assets/js/attachments-admin.js',
		array( 'jquery', 'underscore' ),
		TC_CORE_VERSION,
		true
	);
	wp_enqueue_style( 'tc-admin', TC_CORE_URL . 'assets/css/admin.css', array(), TC_CORE_VERSION );
}
add_action( 'admin_enqueue_scripts', 'tc_core_attachments_admin_assets' );

/**
 * הצגת רשימת הקבצים המצורפים בצד הציבורי (theme template tag).
 */
function tc_render_attachments( $post_id ) {
	$items = get_post_meta( $post_id, 'tc_attachments', true );
	if ( empty( $items ) || ! is_array( $items ) ) {
		return;
	}
	echo '<ul class="tc-attachments">';
	foreach ( $items as $item ) {
		if ( empty( $item['url'] ) ) {
			continue;
		}
		$label = ! empty( $item['label'] ) ? $item['label'] : basename( wp_parse_url( $item['url'], PHP_URL_PATH ) );
		printf(
			'<li><a href="%1$s" target="_blank" rel="noopener noreferrer"><span class="tc-attachments__badge">%2$s</span> %3$s</a></li>',
			esc_url( $item['url'] ),
			esc_html( function_exists( 'tc_file_icon_for' ) ? tc_file_icon_for( $item['url'] ) : 'קובץ' ),
			esc_html( $label )
		);
	}
	echo '</ul>';
}
