/*global FTSS, utils */

/**
 * Simple unbind directive
 *
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
