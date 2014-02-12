/*global app, utils, caches, FTSS, _ */

app.controller('instructorsController', function ($scope) {

	utils.filter($scope, function (filter) {

		$scope.data = utils.initData($scope, caches.Instructors);

		if ($scope.data) {

			_.each($scope.data, function (d) {

				d.Unit = caches.Units[d.UnitId];
				d.Det = d.Unit.Det;
				d.Name = d.Instructor.Name;

			});

			utils.$loading(false);

			utils.tagHighlight($scope.data);

			$scope.sort();

		}

	});

});
