/*global utils, FTSS, _, caches, angular */

FTSS.ng.controller(

	'catalogController',

	[
		'$scope',
		'SharePoint',
		function ($scope, SharePoint) {

			var self = FTSS.controller($scope, SharePoint, {
				'sort' : 'PDS',
				'group': 'MDS',

				'grouping': {
					'MDS' : 'MDS',
					'AFSC': 'AFSC'
				},

				'sorting': {
					'PDS'  : 'Course',
					'MDS'  : 'MDS',
					'AFSC' : 'AFSC',
					'Hours': 'Length'
				},
				'model'  : 'catalog'

			});

			$scope.edit = self.edit(
				[
					'AFSC',
					'MDS'
				]);

			self

				.bind('loaded')

				.then(function (data) {

					      _(caches.Units).each(function (u) {

						      if (u.Courses) {

							      _(u.Courses.split('|')).each(function (c) {

								      var d = data[c].Units = data[c].Units ||
									      [
									      ];

								      d.push(u.LongName);

							      });

						      }


					      });

					      self

						      .initialize(data)

						      .then(function (d) {

							            if (d.Units) {
								            d.units = d.Units.sort().join('<br>');
							            }

						            });


				      });
		}
	]);
