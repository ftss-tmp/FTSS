/**
 * Setup our globals...
 */
(function () {

	"use strict";

	document.cookie = 'DodNoticeConsent=1';

	window.FTSS = {};
	window.utils = {};
	window.caches = {};
	window.PRODUCTION = (location.hostname !== 'localhost' && location.hostname !== '192.168.2.1');

	window.brunch = {
		'auto-reload': {
			'disabled': window.PRODUCTION
		}
	};

}());
