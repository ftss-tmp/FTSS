/*global app, utils, FTSS, _, Sifter */

FTSS.ng.controller(

	'catalogController',

	[
		'$scope',
		'SharePoint',
		function ($scope, SharePoint) {

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
				}

			});

			self

				.bind('loaded')

				.then(function () {

					      SharePoint

						      .read(FTSS.models.catalog)

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

						            }, utils.$ajaxFailure);

				      });

		}
	]);
