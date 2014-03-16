/*global FTSS */

/**
 * Ng-once Directive
 *
 * Used to destroy deep watchers to increase performance on $scope.$digest cycles
 */
(function () {

	"use strict";

	FTSS.ng.directive(

		'ngOnce',
		[
			'$timeout',
			function ($timeout) {
				return {
					'restrict'  : 'EA',
					'priority'  : 500,
					'transclude': true,
					'template'  : '<div ng-transclude></div>',
					'compile'   : function () {
						return function postLink(scope) {
							$timeout(scope.$destroy.bind(scope), 0);
						};
					}
				};
			}
		]);

}());
