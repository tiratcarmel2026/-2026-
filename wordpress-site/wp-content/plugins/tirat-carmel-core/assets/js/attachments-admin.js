jQuery(function ($) {
	'use strict';

	var repeater = document.getElementById('tc-attachments-repeater');
	if (!repeater) return;

	var rowsBody = document.getElementById('tc-attachments-rows');
	var addBtn = document.getElementById('tc-add-attachment');
	var template = document.getElementById('tmpl-tc-attachment-row').innerHTML;

	function nextIndex() {
		var idx = parseInt(repeater.getAttribute('data-index'), 10) || 0;
		repeater.setAttribute('data-index', idx + 1);
		return idx;
	}

	addBtn.addEventListener('click', function () {
		var html = template.replace(/__INDEX__/g, nextIndex());
		var tmp = document.createElement('tbody');
		tmp.innerHTML = html;
		rowsBody.appendChild(tmp.firstElementChild);
	});

	rowsBody.addEventListener('click', function (e) {
		if (e.target.classList.contains('tc-attachment-remove')) {
			e.preventDefault();
			$(e.target).closest('tr').remove();
		}
		if (e.target.classList.contains('tc-attachment-pick')) {
			e.preventDefault();
			var row = e.target.closest('tr');
			var frame = wp.media({
				title: 'בחירת קובץ מצורף',
				button: { text: 'צירוף הקובץ' },
				multiple: false
			});
			frame.on('select', function () {
				var attachment = frame.state().get('selection').first().toJSON();
				row.querySelector('.tc-attachment-url').value = attachment.url;
				row.querySelector('.tc-attachment-id').value = attachment.id;
				var labelInput = row.querySelector('input[name*="[label]"]');
				if (labelInput && !labelInput.value) {
					labelInput.value = attachment.title || attachment.filename || '';
				}
			});
			frame.open();
		}
	});
});
