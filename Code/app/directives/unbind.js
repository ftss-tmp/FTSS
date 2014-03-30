/*global FTSS, moment */

/**
 * Time-ago directive
 *
 * Uses momentJS to give us a human-friendly time since measurement of the given field
 */
(function () {

	"use strict";

	FTSS.ng.directive('unbind', function () {

		return {
			'restrict': 'E',
			'link'    : function ($scope, $el) {

				utils.ignore($scope);
				$el.remove();

			}
		};

	});

}());
