/*global caches, FTSS */

FTSS.ng.controller(

	'studentsController',

	[
		'$scope',
		'SharePoint',
		function ($scope, SharePoint) {

			var self = FTSS.controller($scope, SharePoint, {

				'sort' : 'Name',
				'group': 'HostUnit',

				'grouping': {
					'HostUnit': 'Unit',
					'FTD'     : 'FTD'
				},

				'sorting': {
					'Name'    : 'Name',
					'HostUnit': 'Unit',
					'FTD'     : 'FTD'
				},

				'model': 'students'

			});


			self

				.bind('loaded')

				.then(function (data) {

					      self

						      .initialize(data)

						      .then(function (d) {

							            d.ftd = caches.Units[d.FTD];
							            d.Name = d.Student.Name;
							            d.firstName = d.Name.match(/[a-z]+,\s([a-z]+)/i)[1];

						            });


				      });

		}
	]);
