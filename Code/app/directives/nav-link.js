/*global FTSS */

/**
 *
 */
(function () {

	"use strict";

	FTSS.ng.directive(

		'navLink',

		[
			'$timeout',
			function ($timeout) {
				return {
					'restrict'   : 'E',
					'templateUrl': '/partials/nav-link.html',
					'replace'    : true,
					'scope'      : {
						'link': '@',
						'icon': '@',
						'name': '@'
					},
					'link'       : function ($scope) {

						$scope.navigate = function () {
							window.location.hash =
							[
								'',
								$scope.link,
								$scope.$parent.permaLink
							].join('/');
						};

						$timeout(function () {
							$scope.$$watchers =
							[
							];
						});

					}
				};
			}
		]);

}());
