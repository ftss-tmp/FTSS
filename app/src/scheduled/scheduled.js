/*global app, utils, caches, FTSS, _ */

app.controller('requestSeats', function ($scope, $modalInstance, SharePoint, req) {

	$scope.loaded = true;
	$scope.class = req;
	$scope.seatCount = 0;

	/**
	 * The Selectize init options
	 *
	 * @type {{labelField: string, valueField: string, hideSelected: boolean, sortField: string, dataAttr: string, optgroupOrder: string[], plugins: string[], onInitialize: 'onInitialize', type: 'type', onChange: 'onChange'}}
	 */
	$scope.selectizeOptions = {
		'labelField' : 'Name',
		'valueField' : 'Id',
		'sortField'  : 'Name',
		'searchField': 'Name',
		'persist'    : false,
		'maxItems'   : req.openSeats,
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
		$modalInstance.close();
	};

	$scope.cancel = $modalInstance.dismiss;

});

app.controller('scheduledController', function ($scope, SharePoint, $modal) {

	$scope.add = function (req) {

		$modal.open({

			            'templateUrl': 'src/scheduled/modal-request-seats.html',
			            'controller' : 'requestSeats',
			            'backdrop'   : 'static',
			            'resolve'    : {
				            'req': function () {
					            return req;
				            }
			            }

		            }).result.then(function (data) {
			                           debugger;
			                           $scope.selected = data;
		                           });


	};

	$scope.view = function (req) {

		utils.permaLink({
			                'special': 'ScheduledId eq ' + req.Id,
			                'text'   : req.Course.PDS + ' on ' + req.start
		                }, 'requests');

	};

	utils.filter($scope, function (filter) {

		var model = FTSS.models.scheduled;
		model.params.$filter = filter;

		SharePoint.read(model).then(function (data) {

			data = utils.initData($scope, data);

			if (data) {

				_.each(data, function (req) {

					req = utils.$decorate($scope, req);

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

				utils.$loading(false);

				utils.tagHighlight(data);

				$scope.$watch('groupBy', function () {

					$scope.groups = _.groupBy(data, function (req) {
						return req.Course[$scope.groupBy] || req[$scope.groupBy];
					});

					$scope.sort();

				});

				$scope.groupBy = $scope.groupBy || 'MDS';

			}

		}, utils.$ajaxFailure);

	});

});
