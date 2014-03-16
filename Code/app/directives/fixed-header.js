/*global FTSS */

/**
 * Fixed-header directive
 *
 * Used to call jQuery stickyTableHeaders (for sticking table headers to the top of the screen on scroll)
 */
(function () {

	"use strict";

	FTSS.ng.directive('fixedHeader', function () {

		return {
			'link': function ($scope, $el) {

				$el.stickyTableHeaders();

			}
		};

	});

}());
