/*global FTSS */

/**
 * Updated directive
 *
 * Generates flag indicating a row was updated
 */
(function () {

	"use strict";

	FTSS.ng.directive('updated', function () {

		return {
			'restrict': 'E',
			'replace' : true,
			'link'    : function ($scope, $el) {

				if ($scope[$el[0].innerText].updated) {

					$el[0].outerHTML = '<div class="icon icon-flag" hover="Updated since your last visit.">' + FTSS.icons.svg + FTSS.icons.flag + '</div>';

				} else {

					$el.remove();

				}

			}
		};

	});


}());
