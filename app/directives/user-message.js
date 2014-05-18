/*global FTSS */

/**
 * Time-ago directive
 *
 * Uses momentJS to give us a human-friendly time since measurement of the given field
 */
(function () {

	"use strict";

	FTSS.ng.directive('userMessage', function () {

		var _cache = FTSS.messages = {};

		$('#language *').each(function () {

			_cache[this.id] = this.outerHTML;

		});

		return {
			'link': function ($scope, $el, $attrs) {

				$el[0].innerHTML = _cache[$attrs.userMessage] || '';

			}
		};

	});

}());
