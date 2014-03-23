/*global utils, FTSS, _, caches, angular */

FTSS.ng.controller(

	'hostsController',

	[
		'$scope',
		function ($scope) {

			var self = FTSS.controller($scope, {

				'sort' : 'Base',
				'group': 'Squadron',

				'grouping': {
					'Squadron': 'Squadron'
				},

				'sorting': {
					'Base': 'Base',
					'Det' : 'Detachment'
				},

				'model': 'hosts'

			});

			self

				.bind('loaded')

				.then(function (data) {

					      self

						      .initialize(data)

						      .then(function (unit) {

							            unit.Squadron = unit.Det < 300 ? '372 TRS' : '373 TRS';

						            });

				      });

		}
	]);