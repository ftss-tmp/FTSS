/*global FTSS, caches, _, moment */

FTSS.ng.controller(

	'backlogController',

	[
		'$scope',
		function ($scope) {

			var self = FTSS.controller($scope, {
				'sort' : 'DateNeeded',
				'group': 'Date',

				'grouping': {
					'Date'         : 'Month',
					'Unit.LongName': 'FTD',
					'Course.PDS'   : 'PDS',
					'Course.MDS'   : 'MDS',
					'Course.AFSC'  : 'AFSC'
				},

				'sorting': {
					'DateNeeded': 'Date'
				},
				'model'  : 'requirements'

			});

			self

				.bind('filter')

				.then(function (data) {

					      self

						      .initialize(data)

						      .then(function (d) {

							            d.Course = caches.MasterCourseList[d.CourseId];
							            d.Unit = caches.Units[d.UnitId];
							            d.Date = moment(d.DateNeeded).format('MMM YYYY');

							            d.Students = _.chain(d.Students_JSON)

								            .map(function (c) {

									                 return caches.Students[c] || false;

								                 })

								            .compact().sort().value();
							            console.info(d);
						            });


				      });

		}
	]);
