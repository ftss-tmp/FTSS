app.controller('requestFormatController', function ($scope) {

	var req = $scope.$parent.req;

	req.course = FTSS.cached.MasterCourseList[req.ScheduledClass.CourseId];

	req.det = FTSS.cached.Units[req.ScheduledClass.DetachmentId];

	req.instructor = req.ScheduledClass.Instructor.results[0] ? req.ScheduledClass.Instructor.results[0].Name : 'No Instructor Identified';

	req.start = FTSS.fixDate(req.ScheduledClass.Start);

	req.end = FTSS.fixDate(req.ScheduledClass.End);

	req.mail = '?subject=' + encodeURIComponent('FTD Registration (' + req.course.CourseTitle + ')') + '&body=' + encodeURIComponent(req.start + ' - ' + req.end + '\n' + req.det.Base);

	req.notes = req.Notes || 'Requested by';

	req.openSeats = req.course.MaxStudents - req.ScheduledClass.HostReservedSeats - req.ScheduledClass.OtherReservedSeats;
	req.reqSeats = req.Students.results.length;

	req.openSeatsClass = req.reqSeats > req.openSeats ? 'danger' : 'success';
	req.reqSeatsText = req.reqSeats + ' Requested Seat' + (req.reqSeats > 1 ? 's' : '');

});


app.controller('requestsController', function ($scope) {

	FTSS.read({
		params: {
			//'$filter': 'Pending eq true and ScheduledClass/DetachmentId eq 9',
			'$filter': 'Pending eq true',
			'$expand':
				[
					'Students',
					'ModifiedBy',
					'ScheduledClass/Instructor'
				],
			'$select':
				[
					'Id',
					'Notes',
					'ModifiedBy/Name',
					'ModifiedBy/WorkEMail',
					'ModifiedBy/WorkPhone',
					'Students/Name',
					'Students/WorkEMail',
					'Students/WorkPhone',
					'ScheduledClass/DetachmentId',
					'ScheduledClass/CourseId',
					'ScheduledClass/Start',
					'ScheduledClass/End',
					'ScheduledClass/HostReservedSeats',
					'ScheduledClass/OtherReservedSeats',
					'ScheduledClass/Instructor/Name'
				]
		},
		source: 'Requests',
		success: function (data) {

			$scope.requests = data.data;

			$scope.$apply();

			$('#spinner').hide();
		}
	});


});