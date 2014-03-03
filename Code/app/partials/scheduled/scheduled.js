/*global app, utils, caches, FTSS, _ */

//FTSS.ng.controller('requestSeats', );

FTSS.ng.controller(

	'scheduledController',

	[
		'$scope',
		'SharePoint',
		function ($scope, SharePoint) {

			var self = FTSS.controller($scope, SharePoint, {
				'sort' : 'Start',
				'group': 'Course.MDS',

				'tagBox': true,

				'grouping': {
					'Course.MDS'  : 'MDS',
					'unit'        : 'Unit',
					'Course.AFSC' : 'AFSC',
					'availability': 'Open Seats'
				},

				'sorting': {
					'Start'      : 'Start Date',
					'course'     : 'Course',
					'unit'       : 'Unit',
					'Course.AFSC': 'AFSC'
				},

				'model'  : 'scheduled'

			});

			$scope.add = function (data) {

				utils.modal({
					            'templateUrl': '/partials/modal-request-seats.html',
					            'controller' :
						            [
							            '$scope',
							            '$modalInstance',
							            function ($scope, $modalInstance) {

								            $scope.class = data;
								            $scope.seatCount = 0;

								            $scope.selectizeOptions = {
									            'labelField' : 'Name',
									            'valueField' : 'Id',
									            'sortField'  : 'Name',
									            'searchField': 'Name',
									            'persist'    : false,
									            'maxItems'   : data.openSeats,
									            'create'     : false,
									            'plugins'    :
										            [
											            'remove_button'
										            ],
									            'onChange'   : function (val) {
										            $scope.seatCount = val && val.length || 0;
									            },
									            'load'       : function (query, callback) {

										            //	if (query.indexOf(', ') > 1) {                      <-- only limit queries on the production server

										            SharePoint.people(query).then(callback);

										            //	}

									            }
								            };

								            $scope.submit = function () {
									            $modalInstance.close($scope);
								            };

								            $scope.cancel = $modalInstance.dismiss;

							            }
						            ]

				            });


			};

			$scope.view = function (data) {

				utils.permaLink({
					                'special': 'ScheduledId eq ' + data.Id,
					                'text'   : data.Course.PDS + ' on ' + data.start
				                }, 'requests');

			};

			self

				.bind('filter')

				.then(function (data) {

					      self

						      .initialize(data)

						      .then(function (req) {

							            self.scheduledClass(req);

							            switch (true) {
								            case (req.openSeats > 0):
									            req.openSeatsClass = 'success';
									            break;

								            case (req.openSeats === 0):
									            req.openSeatsClass = 'warning';
									            break;

								            case(req.openSeats < 0):
									            req.openSeatsClass = 'danger';
									            break;
							            }

							            req.availability = {
								            'success': 'Open Seats',
								            'warning': 'No Open Seats',
								            'danger' : 'Seat Limit Exceeded'
							            }[req.openSeatsClass];

						            });

				      });

		}
	]);
