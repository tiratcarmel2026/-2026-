(function () {
	'use strict';

	document.addEventListener('DOMContentLoaded', function () {
		initMenuToggle();
		initSearchToggle();
		initUpdatesCarousel();
	});

	function initMenuToggle() {
		var btn = document.querySelector('.tc-menu-toggle');
		var nav = document.getElementById('tc-primary-nav');
		if (!btn || !nav) return;

		btn.addEventListener('click', function () {
			var isOpen = nav.classList.toggle('is-open');
			btn.setAttribute('aria-expanded', String(isOpen));
			document.body.style.overflow = isOpen ? 'hidden' : '';
		});

		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && nav.classList.contains('is-open')) {
				nav.classList.remove('is-open');
				btn.setAttribute('aria-expanded', 'false');
				document.body.style.overflow = '';
				btn.focus();
			}
		});
	}

	function initSearchToggle() {
		var btn = document.querySelector('.tc-search-toggle');
		var panel = document.getElementById('tc-search-panel');
		if (!btn || !panel) return;

		btn.addEventListener('click', function () {
			var isHidden = panel.hasAttribute('hidden');
			if (isHidden) {
				panel.removeAttribute('hidden');
				btn.setAttribute('aria-expanded', 'true');
				var input = panel.querySelector('input[type="search"]');
				if (input) input.focus();
			} else {
				panel.setAttribute('hidden', '');
				btn.setAttribute('aria-expanded', 'false');
			}
		});
	}

	function initUpdatesCarousel() {
		var track = document.querySelector('.tc-updates__track');
		var prev = document.querySelector('.tc-updates__nav--prev');
		var next = document.querySelector('.tc-updates__nav--next');
		if (!track || !prev || !next) return;

		var scrollAmount = function () {
			var item = track.querySelector('.tc-update-item');
			return item ? item.offsetWidth + 20 : 240;
		};

		prev.addEventListener('click', function () {
			track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
		});
		next.addEventListener('click', function () {
			track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
		});
	}
})();
