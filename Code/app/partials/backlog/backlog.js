/*global FTSS, caches, _, moment, utils */

FTSS.ng.controller('backlogController',

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
								                         req.requirements = [
								                         ];
							                         }

							                         graphCount(req);

							                         req.requirements.push(s);

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

							                         var d = utils.distanceCalc(req.Location, u.Location) || 'unknown';

							                         u.distanceInt = parseInt(d, 10) || 99999999;

							                         u.distance = d.toLocaleString('en');

							                         req.local = (req.FTD.Id === u.Id);

							                         if (req.local) {
								                         req.localFTD = u.LongName;
							                         } else {
								                         req.localFTD = 'Not Available';
								                         if (!counted) {
									                         counted = true;
									                         $scope.totals.reqsTDY++;
								                         }
								                         req.listFTD.push(u);
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

						                               // Generate our human-friendly avg wait time
						                               d.avgWait = timeAvg(d, d.requirements.length);

						                               // Generate a human-friendly max wait time
						                               d.maxWait = timeMax(d.requirements);

					                               });


			                         });

	                   }
                   ])
;
