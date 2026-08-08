(function () {
	'use strict';

	document.addEventListener('DOMContentLoaded', function () {
		var config = window.tcShelterMap;
		if (!config || typeof L === 'undefined') return;

		var mapEl = document.querySelector('.tc-shelter-map');
		if (!mapEl) return;
		var statusEl = document.getElementById(mapEl.id + '-status');

		var map = L.map(mapEl.id).setView([config.centerLat, config.centerLng], config.zoom);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
			maxZoom: 19
		}).addTo(map);

		var icon = L.icon({
			iconUrl: config.iconsUrl + 'marker-icon.png',
			iconRetinaUrl: config.iconsUrl + 'marker-icon-2x.png',
			shadowUrl: config.iconsUrl + 'marker-shadow.png',
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [1, -34],
			shadowSize: [41, 41]
		});

		if (statusEl) statusEl.textContent = config.strings.loading;

		fetch(config.restUrl)
			.then(function (res) { return res.json(); })
			.then(function (shelters) {
				if (!Array.isArray(shelters) || !shelters.length) {
					if (statusEl) statusEl.textContent = config.strings.empty;
					return;
				}
				if (statusEl) statusEl.textContent = '';
				shelters.forEach(function (s) {
					var marker = L.marker([s.lat, s.lng], { icon: icon }).addTo(map);
					var html = '<div class="tc-shelter-popup"><h4>' + escapeHtml(s.title) + '</h4>';
					if (s.address) html += '<p>' + escapeHtml(s.address) + '</p>';
					if (s.capacity) html += '<p>' + config.strings.capacity + ': ' + escapeHtml(String(s.capacity)) + '</p>';
					if (s.accessible) html += '<p class="tc-shelter-popup__accessible">' + config.strings.accessible + '</p>';
					if (s.notes) html += '<p>' + escapeHtml(s.notes) + '</p>';
					html += '</div>';
					marker.bindPopup(html);
				});
			})
			.catch(function () {
				if (statusEl) statusEl.textContent = config.strings.empty;
			});

		function escapeHtml(str) {
			var div = document.createElement('div');
			div.textContent = str;
			return div.innerHTML;
		}
	});
})();
