/*global FTSS, caches, _, moment */

FTSS.ng.controller(
	'requirementsController',

	[
		'$scope',
		function ($scope) {

			var self = FTSS.controller($scope, {
				'sort' : 'Course.PDS',
				'group': 'Month',

				'grouping': {
					'Month': 'Month'
				},

				'sorting': {
					'Course.PDS': 'Course'
				},

				'model': 'requirements',

				'edit': function (scope, create, row) {

					scope.data = row;

				}

			});

			self

				.bind('filter')

				.then(function (data) {

					      var processed = _.map(data, function (d) {

						      d.Host = caches.Hosts[d.HostId];
						      d.FTD = caches.Units[d.UnitId];

						      d.Month = moment(d.DateNeeded).format('MMMM YYYY');

						      d.Requestor = _.zipObject(['Id',
						                                 'Name',
						                                 'Email'
						                                ], d.Requestor_JSON);

						      delete d.Requestor_JSON;

						      d.totalSeats = 0;
						      d.Requirements = {};
						      d.History = {};

						      _.each(d.Requirements_JSON, function (r) {

							      r[4] = r[4] || {};

							      var course = caches.MasterCourseList[r[0]],

							          students = _(r[3]).pluck(2).sort().value();

							      d.totalSeats += r[3].length;

							      d.Requirements[r[0]] = {

								      'course': course,

								      'priority': r[1],

								      'notes': r[2],

								      'seatCount': r[3].length,

								      'hover': '<dl>' +
								               '<dt>Notes</dt><dd><i>' + r[2] + '</i></dd></dl>' +
								               '<dl>' +
								               '<dt>Students</dt><dd> - ' + students.join('<br> - ') + '</dd></dl>'

							      };

							      _.each([1,
							              2,
							              3
							             ],

							             function (v) {

								             d['History' + v] = r[4]['d' + v] || 'Month ' + v;

								             var requested = r[4]['r' + v] || 0,

								                 built = r[4]['b' + v] || 0;

								             d.Requirements[r[0]]['history' + v] = (function () {

									             switch (true) {

										             case (requested < 1):

											             return  {
												             'style': 'text-muted',
												             'text' : 'None',
												             'val'  : '0'
											             };

										             case (requested > built):

											             var val = requested + ' / ' + built;

											             return {
												             'style': 'text-danger bold',
												             'text' : val,
												             'val'  : val
											             };

										             default:

											             return {
												             'style': 'text-success',
												             'text' : requested,
												             'val'  : requested + ' / ' + built,
											             };

									             }

								             }());

							             });

						      });

						      delete d.Requirements_JSON;

						      return d;

					      });

					      data = processed;

					      self

						      .initialize(data)

						      .then(function (d) {

							            console.info(d);
						            });


				      });

		}

	]);