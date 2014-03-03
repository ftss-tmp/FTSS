/*global FTSS */

FTSS.ng.controller(

	'requestsController',

	[
		'$scope',
		'SharePoint',
		function ($scope, SharePoint) {

			var self = FTSS.controller($scope, SharePoint, {
				'sort' : 'status',
				'group': 'course',

				'tagBox': true,

				'grouping': {
					'course'     : 'Course',
					'status'     : 'Status',
					'unit'       : 'Unit',
					'Course.MDS' : 'MDS',
					'Course.AFSC': 'AFSC'
				},

				'sorting': {
					'status'     : 'Status',
					'course'     : 'Course',
					'unit'       : 'Unit',
					'Course.AFSC': 'AFSC'
				},
				'model'  : 'requests'

			});

			self

				.bind('filter')

				.then(function (data) {

					      self

						      .initialize(data)

						      .then(function (req) {

							            self.scheduledClass(req);

							            req.status = {'1': 'Pending', '2': 'Approved', '3': 'Denied'}[req.Status];

							            req.icon = {'1': 'time', '2': 'approve', '3': 'deny'}[req.Status];

							            req.iconClass = {'1': 'info', '2': 'success', '3': 'danger'}[req.Status];

							            req.mail = '?subject=' + encodeURIComponent('FTD Registration (' + req.Course.Title + ')') + '&body=' + encodeURIComponent(req.start + ' - ' + req.end + '\n' + req.det.Base);

							            req.reqSeats = req.Students.results.length;

							            req.openSeatsClass = req.reqSeats > req.openSeats ? 'danger' : 'success';

							            req.Created = FTSS.utils.fixDate(req.Created, true);

							            req.Scheduled.Course = req.Course;

							            try {

								            var response = req.Response.split('|');

								            req.responseName = response.shift() || '';

								            req.responseText = response.join('|') || 'Requester left no comments';

							            } catch (e) {

							            }

						            });


				      });

		}
	]);
