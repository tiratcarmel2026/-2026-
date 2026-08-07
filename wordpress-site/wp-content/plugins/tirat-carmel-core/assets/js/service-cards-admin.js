document.addEventListener('DOMContentLoaded', function () {
	'use strict';

	var repeater = document.getElementById('tc-service-cards-repeater');
	if (!repeater) return;

	var rows = document.getElementById('tc-service-cards-rows');
	var addBtn = document.getElementById('tc-add-service-card');
	var template = document.getElementById('tmpl-tc-service-card-row').innerHTML;

	function nextIndex() {
		var idx = parseInt(repeater.getAttribute('data-index'), 10) || 0;
		repeater.setAttribute('data-index', idx + 1);
		return idx;
	}

	addBtn.addEventListener('click', function () {
		var html = template.replace(/__INDEX__/g, nextIndex());
		var tmp = document.createElement('div');
		tmp.innerHTML = html.trim();
		rows.appendChild(tmp.firstElementChild);
	});

	rows.addEventListener('click', function (e) {
		if (e.target.classList.contains('tc-remove-service-card')) {
			e.preventDefault();
			e.target.closest('.tc-service-card-row').remove();
		}
	});
});
