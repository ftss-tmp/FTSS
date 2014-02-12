/*global utils, FTSS, caches, _ */

utils.$decorate = function ($scope, req) {

	try {

		var seats, schedClass = req.Scheduled || req;

		req.Course = caches.MasterCourseList[schedClass.CourseId];

		req.det = caches.Units[schedClass.UnitId];

		req.Instructor = caches.Instructors[schedClass.InstructorId] || {};

		req.instructor = req.Instructor.Instructor.Name || 'No Instructor Identified';

		req.start = FTSS.utils.fixDate(schedClass.Start);

		req.end = FTSS.utils.fixDate(schedClass.End);

		req.unit = req.det.Base + ', Det ' + req.det.Det;

		req.course = req.Course.PDS + ' - ' + req.Course.Number;

		seats = _.reduce(schedClass.Requests.results, function (memo, r) {
			memo[r.Status] += r.Students.results.length;
			return memo;
		}, {'1': 0, '2': 0, '3': 0});

		req.approvedSeats = seats[2];
		req.pendingSeats = seats[1];
		req.deniedSeats = seats[3];
		req.requestCount = seats[1] + seats[2] + seats[3];

		req.openSeats = req.Course.Max - schedClass.Host - schedClass.Other - req.approvedSeats;

	} catch (e) {
	}

	return req;

};

utils.initData = function ($scope, data) {

	$scope.count.results = _.keys(data || {}).length;

	if ($scope.count.results < 1) {

		utils.$message('empty');

		return false;

	} else {

		return data;

	}
};

utils.filter = function ($scope, callback) {

	$scope.$watch('filter', function (filter) {

		if (filter === false) {
			return;
		}

		callback(filter);

	});

};