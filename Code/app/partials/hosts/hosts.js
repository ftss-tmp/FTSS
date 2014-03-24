/*global utils, FTSS, _, caches, angular */

FTSS.ng.controller(

	'hostsController',

	[
		'$scope',
		function ($scope) {

			var self = FTSS.controller($scope, {

				'sort' : 'Unit',
				'group': 'Base',

				'grouping': {
					'Base'        : 'Base',
					'det.LongName': 'FTD'
				},

				'sorting': {
					'Base'        : 'Base',
					'Unit'        : 'Unit',
					'det.LongName': 'FTD'
				},

				'model': 'hosts'

			});

			self

				.bind('loaded')

				.then(function (data) {

					      self

						      .initialize(data)

						      .then(function (d) {

							            d.det = caches.Units[d.FTD];

						            });

				      });

		}
	]);