/*global FTSS, _, moment */

/**
 *
 */
(function () {

	"use strict";

	FTSS.ng.controller(

		'supportController',
		[
			'$scope',
			'SharePoint',
			'$location',
			'$timeout',
			function ($scope, SharePoint, $location, $timeout) {

				$timeout(function () {

					var model = FTSS.models.support, update;

					model.params.$filter = "Page eq '" + $location.path().split('/')[1] + "'";

					$scope.addReply = function () {

					};

					update = function () {
						SharePoint.read(model).then(function (data) {

							_(data).each(function (d) {
								d.TimeAgo = moment(d.Created).fromNow();
							});

							$scope.comments = data;

							$timeout(update, 5000);
						});
					};

					update();

				});

			}
		]);

}());
