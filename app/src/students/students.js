/*global app, utils, caches, FTSS, _ */

app.controller('studentsController', function ($scope, SharePoint) {

	utils.filter($scope, function (filter) {

		SharePoint.read(FTSS.models.students).then(function (data) {

			$scope.data = utils.initData($scope, data);

			if ($scope.data) {

				utils.$loading(false);

				utils.tagHighlight($scope.data);

				$scope.sort();

			}

		}, utils.$ajaxFailure);

	});

});