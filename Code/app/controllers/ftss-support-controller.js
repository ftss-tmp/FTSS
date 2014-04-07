/*global FTSS, _, moment, utils */

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
			'$timeout',
			function ($scope, SharePoint, $timeout) {
debugger;

				$scope.$parent.$hide = function () {
					debugger;
					$scope.$destroy;
				};

				$scope.$on('$destroy', function () {

					debugger;
				});

				$timeout(function () {

					var model = FTSS.models.support,

					    page = FTSS._fn.getPage(),

					    update;

					model.params.$filter = "Page eq '" + page + "'";

					$scope.addReply = function () {

						var send = {
							'__metadata': 'Support',
							'Page'      : page,
							'Staff'     : false,
							'Comment'   : 'Test'
						};

						SharePoint.create(send).then(function (resp) {

							if (resp.status === 201) {

								$scope.comments.push(send);

							}

						}), utils.alert.error;


					};

					update = function () {
						LOG($scope);
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
