/*global FTSS, moment */

/**
 * Time-ago directive
 *
 * Uses momentJS to give us a human-friendly time since measurement of the given field
 */
(function () {

	"use strict";

	FTSS.ng.directive('timeAgo', function () {

		return {
			'restrict': 'E',
			'replace' : true,
			'link'    : function ($scope, $el) {

				$scope.$watch($el[0].textContent, function (t) {

					switch (true) {
						case (!t):
							$el.html('');
							break;

						case (moment().diff(t, 'days') === 0):
							$el.html('today');
							break;

						default:
							$el.html(moment(t).fromNow());
					}

				});

			}
		};

	});

}());
