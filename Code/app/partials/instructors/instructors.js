/*global caches, FTSS */

FTSS.ng.controller(

	'instructorsController',

	[
		'$scope',
		'SharePoint',
		function ($scope, SharePoint) {

			var self = FTSS.controller($scope, SharePoint, {

				'sort' : 'Name',
				'group': 'UnitLong',

				'grouping': {
					'Squadron': 'Squadron',
					'UnitLong': 'Detachment',
					'AFSC'    : 'AFSC'
				},

				'sorting': {
					'Name': 'Name',
					'AFSC': 'AFSC'
				},
				'model'  : 'instructors'

			});

			$scope.edit = self.edit(
				[
					'Units',
					'AFSC'
				]);

			self

				.bind('loaded')

				.then(function (data) {

					      self

						      .initialize(data)

						      .then(function (d) {

							            d.Unit = caches.Units[d.UnitId];
							            d.Det = d.Unit.Det;
							            d.Name = d.Instructor.Name;
							            d.UnitLong = d.Unit.LongName;
							            d.firstName = d.Name.match(/[a-z]+,\s([a-z]+)/i)[1];

						            });


				      });

		}
	]);
