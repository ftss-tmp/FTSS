/*global caches, FTSS */

FTSS.ng.controller(

	'instructorsController',

	[
		'$scope',
		function ($scope) {

			var self = FTSS.controller($scope, {

				'sort' : 'Name',
				'group': 'Unit.LongName',

				'grouping': {
					'Squadron'     : 'Squadron',
					'Unit.LongName': 'Detachment',
					'AFSC'         : 'AFSC'
				},

				'sorting': {
					'Instructor.Name': 'Name',
					'AFSC'           : 'AFSC'
				},
				'model'  : 'instructors'

			});


			self

				.bind('loaded')

				.then(function (data) {

					      self

						      .initialize(data)

						      .then(function (d) {

							            d.Unit = caches.Units[d.UnitId];
							            d.firstName = d.Instructor.Name.match(/[a-z]+,\s([a-z]+)/i)[1];

						            });


				      });

		}
	]);
