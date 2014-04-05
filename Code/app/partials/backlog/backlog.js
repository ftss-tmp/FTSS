/*global FTSS, caches, _, moment, utils, angular */

FTSS.ng.controller(
	'backlogController',

	[
		'$scope',
		function ($scope) {

			var self = FTSS.controller($scope, {
				    'sort' : 'PDS',
				    'group': 'MDS',

				    'grouping': {
					    'MDS'   : 'MDS',
					    'CAFMCL': 'CAF/MCL',
					    'AFSC'  : 'AFSC'
				    },

				    'sorting': {
					    'PDS'         : 'PDS',
					    'days'        : 'Wait Time',
					    'requirements': '# Requirements'
				    },

				    'model': 'students'

			    }),

			    timeAvg = function (time, length) {

				    return moment.duration(Math.ceil(time.days / length), 'days').humanize();

			    },

			    timeMax = function (reqs) {

				    return moment.duration(_(reqs).pluck('days').max().value(), 'days').humanize();

			    };

			$scope.requestType = function (row) {

				if (row.detRequest) {
					switch (true) {
						case (row.detRequest.distanceInt < 50):
							return 'info';

						case (row.detRequest.distanceInt > 49):
							return 'warning';
					}
				}

				return 'danger';

			};

			$scope.requests = {
				'$'      : [],
				'display': {}
			};

			$scope.checkStudent = (function () {

				var data = {};

				return  function (row) {

					var count = _(row.requirements).filter('selected').size();

					$scope.requests.display = {};

					if (count) {

						data[row.Id] = {

							'Number'  : row.Number,
							'FTD'     : row.detRequest.Id,
							'FTD_Name': row.detRequest.LongName,
							'Students': _.pluck(row.requirements, 'Id'),
							'Type'    : $scope.requestType(row),
							'Count'   : count

						};

					} else {

						delete data[row.Id];

					}

					$scope.requests.display = _.size(data) ? _.groupBy(data, function (gp) {
						return gp.FTD_Name;
					}) : false;

				};

			}());

			//	$scope.$watch('requests.$', $scope.checkStudent, true);


			self

				.bind('filter')

				.then(function (data) {

					      var reqs = {},

					          graphCount = function (req) {
						          var reqs = $scope.graphs.reqs,

						              grp = req[$scope.groupBy.$ || 'MDS'];

						          reqs[grp] = reqs[grp] ? ++reqs[grp] : 1;

					          };

					      $scope.totals = {
						      'allStudents': 0,
						      'max'        : [],
						      'days'       : 0,
						      'students'   : 0,
						      'reqs'       : 0,
						      'reqsTDY'    : 0
					      };

					      $scope.graphs = {
						      'reqs': {}
					      };

					      _(data).each(function (s) {

						      !s.Archived && $scope.totals.allStudents++;

						      if (!s.Archived && !_(s.Requirements_JSON).isEmpty()) {

							      var momentObj = moment(s.ProcessDate);

							      s.days = moment().diff(momentObj, 'days');
							      s.waited = momentObj.fromNow(true);

							      s.HostUnit = caches.Hosts[s.HostUnitId];
							      s.FTD = caches.Units[s.HostUnit.FTD];

							      $scope.totals.days += s.days;
							      $scope.totals.max.push(s.days);
							      $scope.totals.students++;

							      _(s.Requirements_JSON).each(function (r) {

								      $scope.totals.reqs++;

								      var req = reqs[r];

								      if (!req) {
									      req = reqs[r] = _(caches.MasterCourseList[r]).clone();
									      req.priority = req.CAFMCL;
									      req.CAFMCL = req.CAFMCL ? 'CAF/MCL Course(s)' : 'Regular Course(s)';
									      req.listFTD = [];
									      req.days = 0;
									      req.requirements = [];
								      }

								      graphCount(req);

								      req.requirements.push(angular.copy(s));

								      req.days += s.days;

								      req.FTD = s.FTD || {};
								      req.Location = s.HostUnit.Location;

							      });

						      }
					      });

					      $scope.graphs.reqs = _($scope.graphs.reqs)
						      .map(function (v, k) {
							           return {'k': k, 'v': v};
						           })
						      .sortBy('v')
						      .slice(-7)
						      .value();

					      $scope.graphs.reqs.push(
						      {

							      'k': 'All Others',

							      'v': $scope.totals.reqs - _($scope.graphs.reqs)

								      .pluck('v')

								      .reduce(function (sum, el) {
									              return sum + el;
								              })

						      });

					      _(caches.Units).each(function (u) {

						      var counted = false;

						      _(u.Courses_JSON).each(function (c) {

							      var req = reqs[c];

							      if (req) {

								      req.local = (req.FTD.Id === u.Id);

								      req.listFTD.push(u);

								      if (req.local) {

									      u.distance = 'Local';
									      u.distanceInt = 0;
									      req.localFTD = u.LongName;

								      } else {

									      req.localFTD = 'Not Available';

									      var d = utils.distanceCalc(req.Location, u.Location) ||
									              'unknown';

									      u.distanceInt = parseInt(d, 10) || 99999999;

									      u.distance = utils.prettyNumber(d);

									      if (!counted) {
										      counted = true;
										      $scope.totals.reqsTDY++;
									      }
								      }

							      }

						      });

					      });

					      $scope.totals.pctStudents =
					      Math.floor($scope.totals.students / $scope.totals.allStudents * 100);

					      $scope.totals.avg = timeAvg($scope.totals,
					                                  $scope.totals.students)
						      .match(/^(\S+)\s(.*)/);

					      $scope.totals.max = moment

						      .duration(_.max($scope.totals.max), 'days')
						      .humanize()
						      .match(/^(\S+)\s(.*)/);

					      data = reqs;

					      self

						      .initialize(data)

						      .then(function (d) {

							            // Sort the available FTDs by distance (closest first)
							            d.listFTD = _.sortBy(d.listFTD, 'distanceInt');

							            d.requirements = _.sortBy(d.requirements, 'days').reverse();

							            // Pre-check our closest FTD if available
							            d.detRequest = d.listFTD[0] || false;

							            // Generate our human-friendly avg wait time
							            d.avgWait = timeAvg(d, d.requirements.length);

							            // Generate a human-friendly max wait time
							            d.maxWait = timeMax(d.requirements);

						            });


				      });

		}
	])
;
