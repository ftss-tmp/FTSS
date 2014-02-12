/*global app, utils, caches, FTSS, _ */

app.controller('catalogController', function ($scope, SharePoint) {

	$scope.$watch('filter', function (filter) {


		if (filter === false) {
			return;
		}

		SharePoint.read(FTSS.models.catalog).then(function (data) {

			data = utils.initData($scope, data);

			if (data) {

				utils.$loading(false);

				utils.tagHighlight(

				);

				$scope.$watch('groupBy', function () {

					$scope.groups = _.groupBy(data, function (req) {
						return req[$scope.groupBy];
					});

					$scope.sort();

				});

				$scope.groupBy = $scope.groupBy || 'MDS';

			}

		}, utils.$ajaxFailure);

	});

});
