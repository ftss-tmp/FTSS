/**
 * Setup our globals...
 */
(function () {

	"use strict";

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
