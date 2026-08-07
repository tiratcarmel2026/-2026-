(function () {
	'use strict';

	var config = window.tcChatbot || {};
	var intents = [];
	var loaded = false;

	var QUICK_REPLIES = ['מכרזים', 'תשלומים', 'אירועים', 'יצירת קשר', 'נגישות'];

	document.addEventListener('DOMContentLoaded', function () {
		var toggle = document.getElementById('tc-chatbot-toggle');
		var panel = document.getElementById('tc-chatbot-panel');
		var closeBtn = document.getElementById('tc-chatbot-close');
		var form = document.getElementById('tc-chatbot-form');
		var input = document.getElementById('tc-chatbot-input');
		if (!toggle || !panel || !form || !input) return;

		toggle.addEventListener('click', function () {
			var isHidden = panel.hasAttribute('hidden');
			if (isHidden) {
				panel.removeAttribute('hidden');
				toggle.setAttribute('aria-expanded', 'true');
				if (!loaded) bootstrapConversation();
				input.focus();
			} else {
				closePanel();
			}
		});

		if (closeBtn) closeBtn.addEventListener('click', closePanel);

		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && !panel.hasAttribute('hidden')) closePanel();
		});

		function closePanel() {
			panel.setAttribute('hidden', '');
			toggle.setAttribute('aria-expanded', 'false');
			toggle.focus();
		}

		form.addEventListener('submit', function (e) {
			e.preventDefault();
			var text = input.value.trim();
			if (!text) return;
			addMessage(text, 'user');
			input.value = '';
			respondTo(text);
		});

		renderQuickReplies();

		function bootstrapConversation() {
			loaded = true;
			fetchIntents().then(function () {
				addMessage('שלום! אני עוזר הניווט של אתר עיריית טירת כרמל. איך אפשר לעזור? אפשר גם ללחוץ על אחד הנושאים למטה.', 'bot');
			});
		}
	});

	function renderQuickReplies() {
		var wrap = document.getElementById('tc-chatbot-quick-replies');
		if (!wrap) return;
		QUICK_REPLIES.forEach(function (label) {
			var btn = document.createElement('button');
			btn.type = 'button';
			btn.textContent = label;
			btn.addEventListener('click', function () {
				addMessage(label, 'user');
				respondTo(label);
			});
			wrap.appendChild(btn);
		});
	}

	function fetchIntents() {
		if (!config.restUrl) return Promise.resolve();
		return fetch(config.restUrl)
			.then(function (res) { return res.ok ? res.json() : []; })
			.then(function (data) { intents = Array.isArray(data) ? data : []; })
			.catch(function () { intents = []; });
	}

	function respondTo(text) {
		var ensure = intents.length ? Promise.resolve() : fetchIntents();
		ensure.then(function () {
			var match = findIntent(text);
			if (match) {
				addMessage(match.response, 'bot', match.button_label, match.button_url);
			} else {
				addMessage('לא הצלחתי למצוא תשובה מדויקת. אפשר לנסח אחרת, לעיין בתפריט הראשי, או לפנות למוקד 106 הזמין 24/7.', 'bot', 'חיוג למוקד 106', 'tel:106');
			}
		});
	}

	function findIntent(text) {
		var normalized = text.trim().toLowerCase();
		for (var i = 0; i < intents.length; i++) {
			var keywords = intents[i].keywords || [];
			for (var k = 0; k < keywords.length; k++) {
				if (keywords[k] && normalized.indexOf(String(keywords[k]).toLowerCase()) !== -1) {
					return intents[i];
				}
			}
		}
		return null;
	}

	function addMessage(text, from, buttonLabel, buttonUrl) {
		var container = document.getElementById('tc-chatbot-messages');
		if (!container) return;
		var msg = document.createElement('div');
		msg.className = 'tc-chatbot__msg tc-chatbot__msg--' + from;
		msg.textContent = text;

		if (buttonLabel && buttonUrl) {
			var link = document.createElement('a');
			link.href = buttonUrl.indexOf('http') === 0 || buttonUrl.indexOf('tel:') === 0 ? buttonUrl : (config.homeUrl || '/').replace(/\/$/, '') + buttonUrl;
			link.className = 'tc-chatbot__link-btn';
			link.textContent = buttonLabel;
			msg.appendChild(document.createElement('br'));
			msg.appendChild(link);
		}

		container.appendChild(msg);
		container.scrollTop = container.scrollHeight;
	}
})();
