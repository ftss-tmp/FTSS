/*global FTSS, _, moment */

/**
 *
 */
(function () {

	"use strict";

	FTSS.ng.controller(

		'settingsController',
		[
			'$scope',
			'SharePoint',
			'$location',
			'$timeout',
			function ($scope, SharePoint, $location, $timeout) {

				$timeout(function () {

					var model = FTSS.models.support;

					model.params.$filter = "Page eq '" + $location.path().split('/')[1] + "'";

					SharePoint.read(model).then(function (data) {



					});


				});

			}
		]);

}());
