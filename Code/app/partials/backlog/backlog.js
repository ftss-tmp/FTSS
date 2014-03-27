/*global FTSS, caches, _, moment */

FTSS.ng.controller('backlogController',

                   [
	                   '$scope',
	                   function ($scope) {

		                   $scope.d3 = {

			                   'colors': ['#39B4D7',
			                              '#488EA1',
			                              '#13718C',
			                              '#69CEEB',
			                              '#8CD6EB',
			                              '#4966DD',
			                              '#5363A6',
			                              '#182F90',
			                              '#778EEE',
			                              '#97A8EE',
			                              '#37E36B',
			                              '#49AB67',
			                              '#129439',
			                              '#68F191',
			                              '#8CF1AB'
			                   ],

			                   'x': function () {
				                   return function (d) {
					                   return d.k;
				                   };
			                   },

			                   'y': function () {
				                   return function (d) {
					                   return d.v;
				                   };

			                   },

			                   color: function () {
				                   return function (d, i) {
					                   return $scope.d3.colors[i];
				                   };
			                   }
		                   };

		                   var self = FTSS.controller($scope, {
			                       'sort' : 'PDS',
			                       'group': 'MDS',

			                       'grouping': {
				                       'MDS' : 'MDS',
				                       'PDS' : 'PDS',
				                       'AFSC': 'AFSC'
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

			                       return moment.duration(_.chain(reqs).pluck('days').max().value(), 'days').humanize();

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
					                         'max'     : [
					                         ],
					                         'days'    : 0,
					                         'students': 0,
					                         'reqs'    : 0
				                         $scope.graphs = {
					                         'reqs': {}
				                         };

				                         _(data).each(function (s) {

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
								                         req.listFTD = [];
								                         req.localFTD = 'Not Available';
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

			                                                        debugger;

				                         $scope.graphs.reqs = _.map($scope.graphs.reqs, function (v, k) {
					                         console.log(v, $scope.totals);
					                         return {'k': k, 'v': v};
				                         });

				                         _(caches.Units).each(function (u) {

					                         _(u.Courses_JSON).each(function (c) {

						                         var req = reqs[c];

						                         if (req) {

							                         u.distance = utils.distanceCalc(req.Location, u.Location) || 'unknown';
							                         u.distanceInt = parseInt(u.distance, 10) || 99999999;

							                         if (req.FTD.Id === u.Id) {
								                         req.localFTD = u.LongName;
							                         } else {
								                         req.listFTD.push(u);
							                         }

						                         }

					                         });

				                         });

				                         $scope.totals.avg = timeAvg($scope.totals,
				                                                     $scope.totals.students).match(/^(\S+)\s(.*)/);

				                         $scope.totals.max = moment.duration(_($scope.totals.max).max(),
				                                                             'days').humanize().match(/^(\S+)\s(.*)/);

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
                   ]);
