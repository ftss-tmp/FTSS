/*global utils, FTSS, _, caches */

FTSS.ng.controller(

	'catalogController',

	[
		'$scope',
		function ($scope) {

			var self = FTSS.controller($scope, {

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

				'model': 'catalog'

			});

			self

				.bind()

				.then(function (data) {

					      _(caches.Units).each(function (u) {

						      try {

							      _(u.Courses_JSON).each(function (c) {

								      var d = data[c].Units = data[c].Units ||
									      [
									      ];

								      d.push(u.LongName);

							      });

						      } catch (e) {

						      }


					      });

					      self

						      .initialize(data)

						      .then(function (d) {

							            d.priority = d.CAFMCL || false;

							            if (d.Units) {
								            d.units = d.Units.sort().join('<br>');
							            }

						            });


				      });
		}
	]);
