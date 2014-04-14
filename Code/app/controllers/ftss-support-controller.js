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

				var model = FTSS.models.support,

				    page = FTSS._fn.getPage(),

				    update,

				    previous;

				$scope.$parent.$on('modal.hide', function () {

					update = function () {};
					$scope.$destroy();

				});

				model.params.$filter = "Page eq '" + page + "'";

				$scope.startReply = function (comment) {

					comment.reply = true;

				};

				$scope.addReply = function (comment) {

					$scope.supportLoaded = false;

					var send = {
						'__metadata': 'Support',
						'cache'     : true,
						'Page'      : page,
						'Staff'     : false,
						'Comment'   : comment ? comment.writeReply : $scope.askQuestion
					};

					if (comment) {
						send.Thread = comment.Id;
					}

					send.Comment && SharePoint.create(send).then(update, utils.alert.error);

					$scope.writeReply = '';
					$scope.askQuestion = '';

				};

				update = function (repeat) {

					SharePoint.read(model).then(function (data) {

						var size = _.size(data);

						if (size && size !== previous) {

							previous = size;

							$scope.comments = {};

							_(data)

								.sortBy('Created')

								.reverse()

								.each(function (d) {

									      // Get the time from now with the GMT offset of the CS3 servers (-5)
									      d.TimeAgo = moment(d.Created).add('h', 5).fromNow();

									      if (d.Thread < 1) {
										      d.replies = [];
										      $scope.comments[d.Id] = d;
									      }

								      })

								.each(function (d) {

									      if (d.Thread > 0) {
										      $scope.comments[d.Thread].replies.push(d);
									      }

								      });

							$scope.comments = _($scope.comments)

								.each(function (c) {

									      c.search = c.Comment + _.pluck(c.replies, 'Comment').join(' ');

								      })

								.sortBy('Created')

								.reverse()

								.value();

						}

						(repeat === true) && $timeout(function () {
							update(repeat);
						}, 5000);

						$scope.supportLoaded = true;

					});
				};

				update(true);

			}
		]);

}());
