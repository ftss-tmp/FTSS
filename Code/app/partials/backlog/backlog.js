/*global FTSS, caches, _, moment, utils, angular */

FTSS.ng.controller(
	'backlogController',

	[
		'$scope',
		'SharePoint',
		function ($scope, SharePoint) {

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

				    'model': 'students',

				    'modal': 'backlog',

				    'edit': function (scope, isNew, courses) {

					    var m = moment(),

					        month = {

						        'm1': m.month(),
						        'd1': m.format('MMM YY'),
						        'm2': m.add(1, 'month').month(),
						        'd2': m.format('MMM YY'),
						        'm3': m.add(1, 'month').month(),
						        'd3': m.format('MMM YY')

					        };

					    courses.month = moment().add('months', 3).toISOString();

					    _(courses).each(function (course) {

						    course.limit = 3;

						    course.History = angular.copy(month);

						    course.students = _(course.requirements).map(function (req) {

							    return req.selected ? req.StudentName.slice(0, 25) + '...' : false;

						    }).filter().value();

					    });

					    scope.courses = courses;

					    scope.local = courses[0].detRequest.distanceInt < 50;

					    scope.funded = false;

				    },

				    'submit': function (scope) {

					    scope.submitted = true;

					    var odataCall = {

						    'requirement': {

							    'cache': true,

							    '__metadata': 'Requirements',

							    'UnitId': scope.courses[0].detRequest.Id,

							    'HostId': scope.courses[0].requirements[0].HostUnitId,

							    'DateNeeded': scope.courses.month,

							    'Funded': scope.local || scope.funded,

							    'TDY': !scope.local,

							    'Notes': scope.notes,

							    'Requirements_JSON': [],

							    'Requestor_JSON': [
								    $scope.user.id,
								    $scope.user.Name,
								    $scope.user.WorkEMail
							    ]

						    }

					    };

					    _(scope.courses).each(function (course) {

						    var req = [
							    // Course
							    course.Id,

							    // Priority
							    course.priority,

							    // Notes
							    course.CourseNotes,

							    // Students
							    [],

							    // History
							    course.History
						    ];

						    _(course.requirements)

							    .filter('selected')

							    .each(function (requirement) {

								          var student =

									              odataCall['_student_' + requirement.Id] =

									              odataCall['_student_' + requirement.Id] ||

									              {
										              'cache': true,

										              '__metadata': requirement.__metadata,

										              'Requirements_JSON': requirement.Requirements_JSON
									              };

								          student.Requirements_JSON = _.without(student.Requirements_JSON, course.Id);

								          req[3].push(
									          [
										          // Id
										          requirement.Id,

										          // StudentType
										          requirement.StudentType,

										          // StudentName
										          requirement.StudentName,

										          // StudentEmail
										          requirement.StudentEmail
									          ]);

							          });

						    odataCall.requirement.Requirements_JSON.push(req);

					    });

					    SharePoint.batch(odataCall).then(function (result) {

						    if (result) {

							    self.reload(function () {

								    scope.$hide();
								    utils.alert.create();

								    scope.submitted = false;

							    });

						    } else {

							    utils.alert.error('Batch 898 Creation failure');

						    }

					    });

				    }

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

			self

				.bind('filter')

				.then(function (data) {

					      var reqs = {},

					          graphCount = function (req) {
						          var reqs = $scope.graphs.reqs,

						              grp = req[$scope.groupBy.$ || 'MDS'];

						          reqs[grp] = reqs[grp] ? ++reqs[grp] : 1;

					          };


					      $scope.requests = {
						      'display': false
					      };

					      $scope.checkStudent = (function () {

						      var data = {};

						      return  function (row) {

							      var count = row ? _(row.requirements).filter('selected').size() : false;

							      if (count) {

								      row.Over = count > row.Max;
								      row.Under = count < row.Min;
								      row.Count = count;
								      row.Type = $scope.requestType(row);

								      data[row.Id] = row;

							      } else {

								      row.Over = row.Under = false;
								      delete data[row.Id];

							      }

							      $scope.requests.count = 0;

							      $scope.requests.display = _.size(data) ?

							                                _.groupBy(data, function (gp) {

								                                $scope.requests.count += gp.Count;
								                                return gp.detRequest.Base;

							                                }) : false;

						      };

					      }());


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


			FTSS.pasteAction = function (text) {

				var collection = {};

				text

					.replace(/^.+(QUAL|COMP).+$\n/gim, '')

					.replace(/\n+/gm, '\n')

					.replace(/EVT\-ID\s\n([\w\s\n\d\/\\\*\-]*)\n^PCN/gim,

				             function (str, $1) {

					             var last = false;

					             _($1.split('\n')).each(function (s) {

						             s = !last ?

						                 s.replace(/^([a-z]+\s[a-z]+).*\s(\d{5})\s/gi,

						                           function (m, $$1, $$2) {

							                           last = {
								                           'name': $$1.trim(),
								                           'id'  : $$2.trim()
							                           };

							                           return '';

						                           }) : s;

						             s.replace(/\s([\d]{6})\s/, function (m, $$1) {

							             if (caches.IMDS.indexOf($$1) > -1) {

								             collection[$$1] = collection[$$1] || [];

								             last.date = '';

								             s.replace(/\d\d\s[a-z]{3}\s\d\d/i, function (m) {
									             last.date = m;
								             });

								             collection[$$1].push(last);

							             }

						             });


					             })
				             });

				_(collection).each(function (c, k) {

					c.course = _.findWhere(caches.MasterCourseList, {'IMDS': k});

				});

				debugger;
			};

		}
	])
;
