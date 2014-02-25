/*global utils, FTSS, caches, _, Sifter */

/**
 * FTSS.controller()
 *
 * Utility for page controllers to process SP REST data
 *
 * @param $scope
 * @param opts
 * @returns {{$scope: *, bind: 'bind', initialize: 'initialize', process: 'process', scheduledClass: 'scheduledClass', postProcess: 'postProcess'}}
 */
FTSS.controller = function ($scope, opts) {

	$scope.$parent.tagBox = opts.tagBox || false;

	$scope.$parent.grouping = opts.grouping || false;

	$scope.$parent.sorting = opts.sorting || false;

	var process, actions = {

		'$scope': $scope,

		'bind': function (prop) {

			var single = (prop === 'loaded');

			return {
				'then': function (callback) {

					var unwatch = $scope.$watch(prop, function (watch) {

						if (watch) {

							actions.reload = function () {

								callback(watch);

							};

							actions.reload();

							if (single) {
								unwatch();
							}

						}
					});


				}
			};

		},

		'initialize': function (data) {

			actions.data = data;

			$scope.counter = function (count, overload) {

				$scope.$parent.count = count;
				$scope.$parent.overload = overload;

				if (count < 1) {
					utils.$message('empty');
				} else {
					utils.$message(false);
				}

			};

			if (_.keys(data || {}).length < 1) {

				utils.$message('empty');

				return {
					'then': function () {
					}
				};

			} else {

				return {
					'then': function (processCallback) {

						process = processCallback;

						actions.process(data);

					}
				};

			}
		},

		'process': function (data) {

			data = data || actions.data;

			if (process) {

				_(data).each(process);

			}

			$scope.groupBy.$ = $scope.groupBy.$ || opts.group;
			$scope.sortBy.$ = $scope.sortBy.$ || opts.sort;

			if ($scope.tagBox) {
				utils.tagHighlight(data);
				$scope.searchText = {};
			}

			actions.postProcess(data);

		},

		'scheduledClass': function (req) {

			try {

				var seats, schedClass = req.Scheduled || req;

				req.Course = caches.MasterCourseList[schedClass.CourseId];

				req.det = caches.Units[schedClass.UnitId];

				req.Instructor = caches.Instructors[schedClass.InstructorId] || false;

				req.instructor = req.Instructor.Instructor && req.Instructor.Instructor.Name || 'No Instructor Identified';

				req.start = FTSS.utils.fixDate(schedClass.Start);

				req.end = FTSS.utils.fixDate(schedClass.End);

				req.unit = req.det.Base + ', Det ' + req.det.Det;

				req.course = req.Course.PDS + ' - ' + req.Course.Number;

				seats = _.reduce(schedClass.Requests.results, function (memo, r) {
					memo[r.Status] += r.Students.results.length;
					return memo;
				}, {'1': 0, '2': 0, '3': 0});

				req.approvedSeats = seats[2];
				req.pendingSeats = seats[1];
				req.deniedSeats = seats[3];
				req.requestCount = seats[1] + seats[2] + seats[3];

				req.openSeats = req.Course.Max - schedClass.Host - schedClass.Other - req.approvedSeats;

			} catch (e) {

			}

		},

		'postProcess': function (data) {

			if (data) {

				var sifter, results;

				sifter = new Sifter(_(data).map(function (d) {

					return {
						'search': JSON.stringify(d).replace(/([,{]"\w+":)|([{}"])/gi, ' ').toLowerCase(),
						'data'  : d
					};

				}));

				if (!$scope.tagBox && !$scope.searchText.$) {

					$scope.searchText.$ = FTSS.search.$control.children(':first-child').contents().filter(function () {
						return this.nodeType === 3;
					}).text();

				}

				// De-register the watcher if it exists
				if (FTSS.searchWatch) {
					FTSS.searchWatch();
				}

				FTSS.searchWatch = $scope.$watchCollection('[searchText.$,groupBy.$,sortBy.$]', function () {

					var text = $scope.searchText.$;

					$scope.groups = false;
					$scope.counter('-', false);
					$scope.count = 0;

					if ($scope.tagBox || text && text.length) {

						results = sifter.search(text, {
							'fields'     :
								[
									'search'
								],
							'limit'      : 25,
							'conjunction': 'and'
						});

						$scope.groups = _.chain(results.items)

							.map(function (match) {
								     return sifter.items[match.id].data;
							     })

							.sortBy(function (srt) {
								        return utils.deepRead(srt, $scope.sortBy.$);
							        })

							.groupBy(function (gp) {
								         $scope.count++;
								         return utils.deepRead(gp, $scope.groupBy.$) || '* No Grouping Data Found';
							         })

							.value();

						$scope.counter($scope.count, $scope.count !== results.total);

						if ($scope.tagBox) {
							utils.tagHighlight(data);
						}

					} else {

						utils.$message('ready');

					}

				});

				utils.$loading(false);

			}

		}


	};

	return actions;

};