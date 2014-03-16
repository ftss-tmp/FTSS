/*global FTSS, _ */

/**
 * Action directive
 *
 * Creates the view, edit, archive, restore buttons
 */
(function () {

	"use strict";

	FTSS.ng.directive('actions', function () {

		return {
			'restrict'   : 'E',
			'templateUrl': '/partials/actions.html',
			'replace'    : true,
			'link'       : function ($scope, $el, $attrs) {

				$scope.btn = {
					'label' : $attrs.label
				};

				_(
					[
						'view',
						'edit',
						'archive'
					])

					.each(function (a) {
						      $scope.btn[a] = $attrs.hasOwnProperty(a);
					      });

			}
		};

	});

}());
