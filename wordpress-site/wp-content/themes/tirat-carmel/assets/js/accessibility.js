(function () {
	'use strict';

	var STORAGE_KEY = 'tc-a11y-settings';
	var FONT_STEP = 2; /* percent */
	var FONT_MIN = -20;
	var FONT_MAX = 40;

	var TOGGLE_CLASSES = {
		contrast: 'tc-a11y-contrast',
		dark: 'tc-a11y-dark',
		grayscale: 'tc-a11y-grayscale',
		'underline-links': 'tc-a11y-underline-links',
		'readable-font': 'tc-a11y-readable-font',
		'big-cursor': 'tc-a11y-big-cursor',
		'stop-animations': 'tc-a11y-stop-animations',
		'highlight-headings': 'tc-a11y-highlight-headings',
	};

	var state = loadState();

	document.addEventListener('DOMContentLoaded', function () {
		applyState();
		bindUI();
		if (state['reading-guide']) initReadingGuide();
	});

	function loadState() {
		try {
			var raw = window.localStorage.getItem(STORAGE_KEY);
			return raw ? JSON.parse(raw) : { fontStep: 0 };
		} catch (e) {
			return { fontStep: 0 };
		}
	}

	function saveState() {
		try {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		} catch (e) { /* localStorage unavailable */ }
	}

	function applyState() {
		var html = document.documentElement;
		Object.keys(TOGGLE_CLASSES).forEach(function (key) {
			html.classList.toggle(TOGGLE_CLASSES[key], !!state[key]);
		});
		html.style.fontSize = state.fontStep ? (100 + state.fontStep) + '%' : '';
		syncButtons();
	}

	function syncButtons() {
		document.querySelectorAll('[data-a11y-toggle]').forEach(function (btn) {
			var key = btn.getAttribute('data-a11y-toggle');
			btn.setAttribute('aria-pressed', state[key] ? 'true' : 'false');
		});
	}

	function bindUI() {
		var toggleBtn = document.getElementById('tc-a11y-toggle');
		var panel = document.getElementById('tc-a11y-panel');
		var closeBtn = document.getElementById('tc-a11y-close');
		if (!toggleBtn || !panel) return;

		toggleBtn.addEventListener('click', function () {
			var isHidden = panel.hasAttribute('hidden');
			if (isHidden) {
				panel.removeAttribute('hidden');
				toggleBtn.setAttribute('aria-expanded', 'true');
			} else {
				panel.setAttribute('hidden', '');
				toggleBtn.setAttribute('aria-expanded', 'false');
			}
		});

		if (closeBtn) {
			closeBtn.addEventListener('click', function () {
				panel.setAttribute('hidden', '');
				toggleBtn.setAttribute('aria-expanded', 'false');
				toggleBtn.focus();
			});
		}

		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && !panel.hasAttribute('hidden')) {
				panel.setAttribute('hidden', '');
				toggleBtn.setAttribute('aria-expanded', 'false');
				toggleBtn.focus();
			}
		});

		document.querySelectorAll('[data-a11y-action]').forEach(function (btn) {
			btn.addEventListener('click', function () {
				var action = btn.getAttribute('data-a11y-action');
				if (action === 'font-inc') state.fontStep = Math.min(FONT_MAX, (state.fontStep || 0) + FONT_STEP);
				if (action === 'font-dec') state.fontStep = Math.max(FONT_MIN, (state.fontStep || 0) - FONT_STEP);
				if (action === 'font-reset') state.fontStep = 0;
				saveState();
				applyState();
			});
		});

		document.querySelectorAll('[data-a11y-toggle]').forEach(function (btn) {
			btn.addEventListener('click', function () {
				var key = btn.getAttribute('data-a11y-toggle');
				state[key] = !state[key];
				if (key === 'reading-guide') {
					state[key] ? initReadingGuide() : removeReadingGuide();
				}
				if (key === 'dark' && state[key]) {
					state.contrast = false;
				}
				if (key === 'contrast' && state[key]) {
					state.dark = false;
				}
				saveState();
				applyState();
			});
		});

		var resetBtn = document.getElementById('tc-a11y-reset');
		if (resetBtn) {
			resetBtn.addEventListener('click', function () {
				state = { fontStep: 0 };
				saveState();
				applyState();
				removeReadingGuide();
			});
		}
	}

	function initReadingGuide() {
		var guide = document.getElementById('tc-a11y-reading-guide');
		if (!guide) return;
		guide.removeAttribute('hidden');
		document.addEventListener('mousemove', moveGuide);
	}

	function removeReadingGuide() {
		var guide = document.getElementById('tc-a11y-reading-guide');
		if (!guide) return;
		guide.setAttribute('hidden', '');
		document.removeEventListener('mousemove', moveGuide);
	}

	function moveGuide(e) {
		var guide = document.getElementById('tc-a11y-reading-guide');
		if (!guide) return;
		guide.style.top = (e.clientY - 17) + 'px';
	}
})();
