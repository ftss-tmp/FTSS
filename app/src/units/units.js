/*global app, utils, caches, FTSS, _ */

app.controller('unitsController', function ($scope, SharePoint) {

	utils.filter($scope, function (filter) {

		SharePoint.read(FTSS.models.units).then(function (data) {

			$scope.data = utils.initData($scope, data);

			if ($scope.data) {

				_.each($scope.data, function (unit) {

					unit.Squadron = {2: '372 TRS', 3: '373 TRS'}[String(unit.Det).charAt(0)];

				});

				$scope.groups = _.groupBy($scope.data, 'Squadron');

				utils.$loading(false);

				utils.tagHighlight($scope.data);

				$scope.sort();

			}

		}, utils.$ajaxFailure);

	});

});