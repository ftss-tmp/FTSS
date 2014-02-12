/*global app, utils, caches, FTSS, _ */

app.controller('requestsController', function ($scope, SharePoint) {

	utils.filter($scope, function (filter) {

		var model = FTSS.models.requests;
		model.params.$filter = filter;

		SharePoint.read(model).then(function (data) {

			data = utils.initData($scope, data);

			if (data) {

				_.each(data, function (req) {

					req = utils.$decorate($scope, req);

					req.status = {'1': 'Pending', '2': 'Approved', '3': 'Denied'}[req.Status];

					req.icon = {'1': 'time', '2': 'approve', '3': 'deny'}[req.Status];

					req.mail = '?subject=' + encodeURIComponent('FTD Registration (' + req.Course.Title + ')') + '&body=' + encodeURIComponent(req.start + ' - ' + req.end + '\n' + req.det.Base);

					req.notes = req.Notes || 'Requested by';

					req.reqSeats = req.Students.results.length;

					req.openSeatsClass = req.reqSeats > req.openSeats ? 'danger' : 'success';

					req.Created = FTSS.utils.fixDate(req.Created, true);

					req.Scheduled.Course = req.Course;

					var response = req.Response ? req.Response.split('|') : [];

					req.responseName = response.shift() || '';

					req.responseText = response.join('|');

					utils.$loading(false);

				});

				utils.tagHighlight(data);

				$scope.$watch('groupBy', function () {

					$scope.groups = _.groupBy(data, function (req) {
						return req.Course[$scope.groupBy] || req[$scope.groupBy];
					});

					$scope.sort();

				});

				$scope.groupBy = $scope.groupBy || 'course';

			}

		}, utils.$ajaxFailure);

	});

});

