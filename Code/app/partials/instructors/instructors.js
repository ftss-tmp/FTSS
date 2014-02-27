/*global angular, utils, caches, FTSS, _ */

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

			$scope.edit = function (data) {

				utils.modal({
					            'templateUrl': '/partials/modal-instructor.html',

					            'controller':
						            [
							            '$scope',
							            '$modalInstance',
							            function ($scope, $modalInstance) {

								            $scope.data = angular.copy(data);

								            $scope.firstName = data.Name.match(/[a-z]+,\s([a-z]+)/i)[1];

								            $scope.selectizeUnits = FTSS.dropdowns.Units($scope);

								            $scope.selectizeAFSC = FTSS.dropdowns.AFSC($scope);

								            $scope.submit = self.update($scope, $modalInstance);

								            $scope.cancel = $modalInstance.dismiss;

							            }
						            ]
				            });

			};

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

						            });


				      });

		}
	]);
