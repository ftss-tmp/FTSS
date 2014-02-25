/*global angular, utils, caches, FTSS, _ */

FTSS.ng.controller(

	'instructorsController',

	[
		'$scope',
		'SharePoint',
		function ($scope, SharePoint) {

			var self = FTSS.controller($scope, {

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
				}

			});

			$scope.edit = function (data) {

				utils.modal({
					            'templateUrl': '/partials/modal-instructor.html',

					            'controller':
						            [
							            '$scope',
							            '$modalInstance',
							            function ($scope, $modalInstance) {

								            $scope.instructor = angular.copy(data);

								            $scope.firstName = data.Name.match(/[a-z]+,\s([a-z]+)/i)[1];

								            $scope.selectizeUnits = {

									            'maxItems'   : 1,
									            'valueField' : 'Id',
									            'labelField' : 'LongName',
									            'searchField': 'LongName',
									            'sortField'  : 'LongName',
									            'options'    : caches.Units,
									            'create'     : false

								            };

								            $scope.selectizeAFSC = {

									            'maxItems' : 1,
									            'sortField': 'text',
									            'options'  : _(caches.AFSC).map(function (afsc) {
										            return {'value': afsc, 'text': afsc};
									            }),
									            'create'   : true

								            };

								            $scope.submit = function () {

									            $scope.submitted = true;

									            var send = {
										            '__metadata': $scope.instructor.__metadata,
										            'UnitId'    : $scope.instructor.UnitId,
										            'AFSC'      : $scope.instructor.AFSC,
										            'Photo'     : $scope.instructor.Photo,
										            'cache'     : true
									            };

									            SharePoint.update(send).then(function (resp) {

										            if (resp.status === 204) {

											            $scope.instructor.__metadata.etag = resp.headers('etag');
											            $scope.instructor.updated = true;

											            self.data[data.Id] = angular.copy($scope.instructor);
											            self.process();

											            $modalInstance.close();

										            }

									            }, utils.$ajaxFailure);
								            };

								            $scope.cancel = $modalInstance.dismiss;

							            }
						            ]
				            });

			};

			self

				.bind('loaded')

				.then(function () {

					      SharePoint

						      .read(FTSS.models.instructors)

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

				      });

		}
	]);
