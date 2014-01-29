/*global _, $, FTSS, app, LZString */

(function () {

	"use strict";

	var firstRun = true, filters, utils = {}, search;

	app.controller('user', function ($scope, SharePoint) {

		SharePoint.user().then(function (user) {

			$scope.userId = user.id;
			$scope.userName = user.name;

		});

	});

	/**
	 * The main controller performs the initial caching functions as well as setting up other app-wide $scope objects
	 */
	app.controller('mainController', function ($scope, $location, SharePoint, $routeParams) {

		FTSS.utils.log('Main Controller');

		var pending, updating, delaySearch;

		/**
		 * Returns the current base page
		 * @returns String page
		 */
		FTSS.page = function () {
			return  $location.path().split('/')[1];
		};

		// Only run the mainController the first time the page loads
		if (!firstRun) {
			firstRun = false;
			return;
		}

		filters = FTSS.filters($scope);

		/**
		 * User feedback function, provides alerts, errors and general instructions to users
		 *
		 * @param Object msg
		 */
		utils.$message = function (msg) {

			switch (msg) {

				case false:
					$scope.messages = {};
					return;

				case 'empty':
					utils.$loading(false);
					msg = {
						'class'  : 'warning',
						'intro'  : 'Nothing Found!  ',
						'message': "There doesn't seem to be anything that matches your request.  Maybe you should add some more tags to your search."
					};
					break;

				case 'ready':
					utils.$loading(false);
					msg = {
						'intro'  : "You're ready to go.  ",
						'message': 'To get started, use the search box below to create a tag list.  The page will update as you add more tags.'
					};

			}

			$scope.messages = {
				'newLine': msg.newLine || 'false',
				'class'  : msg.class || 'info',
				'intro'  : msg.intro || 'Quick Note:  ',
				'message': msg.message || ''
			};

		};

		utils.$loading = function (loading) {

			utils.$message(false);

			if ($scope.loading !== loading) {

				if (loading) {
					document.body.style.cursor = $scope.loading = 'wait';
					if (search) {
						search.close();
						search.blur();
					}
				} else {
					document.body.style.cursor = $scope.loading = '';
				}

			}

		};

		utils.$initPage = function () {

			if ($scope.loaded) {

				FTSS.utils.log('Init Page');

				filters.$add();

				$scope.count = {
					'results': 0
				};

				if (pending) {

					(function () {

						var tmp, customFilters;

						tmp =
							[
							];

						customFilters = filters.route[FTSS.page()];

						if (pending === '*') {

							tmp = pending;

						} else {

							if (pending.special) {

								utils.updateSearch(function () {

									$scope.noSearch = true;
									search.disable();
									search.addOption({
										                 'id'      : 'custom:' + pending.special,
										                 'text'    : pending.text || 'Special Lookup',
										                 'optgroup': 'SMART FILTERS'
									                 });
									search.setValue('custom:' + pending.special);
									$scope.filter = pending.special;
									$scope.permaLink = '';

								});

								pending = false;
								return;

							} else {

								_.each(pending, function (val, key) {

									_.each(val, function (v, k) {

										var valid = true;

										if (key === 'custom') {

											valid = _.some(customFilters, function (f) {
												return f.id === 'custom:' + v;
											});

										}

										if (valid) {
											tmp.push(key + ':' + v);
										} else {
											val.splice(k, 1);
										}

									});

								});

							}

						}

						if (pending.custom && pending.custom.length < 1) {
							delete pending.custom;
						}

						utils.updateSearch(function () {

							search.setValue(tmp);

							tmp = filters.$compile(pending);

							if (tmp || pending === '*') {

								$scope.tags = pending;
								$scope.filter = tmp;

							}

						});

						pending = false;

					}());

				} else {

					utils.updateSearch('');
					utils.$message('ready');

				}

			}

		};

		/**
		 * Wrapper to handle search box value updates without triggering the onChange() event
		 *
		 * @param {function|string} [action] - calls the function or sets search to the given value if string
		 */
		utils.updateSearch = function (action) {

			updating = true;

			if (typeof action === 'string') {

				search.setValue(action);

			} else {

				action();

			}

			updating = false;

		};

		/**
		 * Performs highlighting of matched search tags to allow users to see exactly what search terms had hits
		 *
		 * @param {Array} [data] - the data returned from SharePoint.read()
		 */
		utils.tagHighlight = function (data) {

			try {

				// Do not highlight the "Find Everything" tag
				if ($scope.tags !== '*') {

					var test, map;

					test =
						[
						];
					map = filters.map[FTSS.page()];

					// First, generate the array of tags to test against
					_.each($scope.tags, function (tag, key) {

						_.each(tag, function (t) {

							if (key !== 'custom') {

								test.push({
									          id       : key + ':' + t,
									          testField: map[key].split('/'),
									          testValue: t
								          });

							}

						});


					});

					// Perform tests against all data using the test[] already created, _.all() stops once all tags are marked (if applicable)
					_.all(data, function (req) {

						// Must use _.each() in case a data item matches multiple tags
						_.each(test, function (t, k) {

							var field;

							// In order to handle nested values (up to 2), switch on the t.testField.length
							switch (t.testField.length) {

								case 1:
									field = req[t.testField[0]];
									break;

								case 2:
									field = req[t.testField[0]][t.testField[1]];
									break;

								default:
									field = req[t.testField[0]][t.testField[1]][t.testField[2]];

							}

							/**
							 *  If field and testValue match, add Matched class and delete test-- we shouldn't touch the DOM
							 *  from a controller but for performance reasons, this is much faster than relying on
							 *  AngularJS.
							 */
							if (field === t.testValue) {

								search.$control.find('.item[data-value="' + t.id + '"]').addClass('matched');
								delete test[k];

							}

						});

						// Always test to ensure there are still tags to test against, otherwise exit the loop
						return (test.length > 0);

					});

				}

			} catch (e) {
				FTSS.utils.log(e);
			}

		};


		/**
		 *
		 * @param req
		 */
		utils.$ajaxFailure = function (req) {
			utils.$message({
				               'newLine': true,
				               'class'  : 'danger',
				               'intro'  : 'Hmmm, something went wrong:',
				               'message':
					               [
						               this.type,
						               '(' + req.status + ')',
						               this.url
					               ].join(' ')
			               });
		};

		utils.permaLink = function (tag, pg) {

			$scope.permaLink = (!tag) ? 'all' : LZString.compressToBase64(JSON.stringify(tag));

			window.location.hash =
				[
					'',
					pg || FTSS.page(),
					$scope.permaLink
				].join('/');

		};

		utils.selectize = {

			'$onChange': function (val, instant) {

				clearTimeout(delaySearch);

				if (!updating) {

					FTSS.utils.log('Selectize Change');

					if (val instanceof Array && val.length > 0) {

						if (val.slice(-1)[0] === '*') {

							FTSS.utils.log('Selectize *');

							utils.updateSearch(function () {

								if (val.length > 1) {
									search.setValue('*');
									search.lock();
								}

								utils.permaLink(false);

							});

						} else {

							delaySearch = setTimeout(function () {

								FTSS.utils.log('Selectize Filtered');

								utils.updateSearch(function () {

									var tags = {};

									_.each(val, function (v) {

										var split = v.split(':');

										tags[split[0]] = tags[split[0]] ||
											[
											];

										tags[split[0]].push(Number(split[1]) || split[1]);

									});

									utils.permaLink(tags);

								});

							}, (instant ? 1 : 1000));

						}

					} else {
						utils.$loading(false);
						search.unlock();
					}

				}
			},

			'$onType': function () {
				clearTimeout(delaySearch);
			},

			/**
			 * This is the callback for the searchbox reset button, clears out the search params
			 */
			'$reset': function () {
				clearTimeout(delaySearch);
				search.clear();
			}

		};

		/**
		 * Returns "active" if current page equals link
		 *
		 * @param link
		 * @returns {string}
		 */
		$scope.isPage = function (link) {
			return link === (FTSS.page() || 'home') ? 'active' : '';
		};

		/**
		 * Toggles data well collapses
		 */
		$scope.collapse = function () {
			$scope.wellCollapse = $scope.wellCollapse ? '' : 'collapsed';
		};

		/**
		 * Starts the loading indicators on navigation begin
		 */
		$scope.$on('$locationChangeStart', function () {

			FTSS.utils.log('Location Change Start');

			if (search) {
				$scope.noSearch = false;
				search.enable();
			}

			$scope.filter = false;

			utils.$loading(true);

		});

		$scope.$on('$routeChangeSuccess', function () {

			FTSS.utils.log('Route Change Success');

			if ($routeParams.link) {

				$scope.permaLink = $routeParams.link;

				pending = ($routeParams.link === 'all') ? '*' : JSON.parse(LZString.decompressFromBase64($routeParams.link));

			}

			utils.$initPage();

		});

		/**
		 * The Selectize init options
		 *
		 * @type {{labelField: string, valueField: string, hideSelected: boolean, sortField: string, dataAttr: string, optgroupOrder: string[], plugins: string[], onInitialize: 'onInitialize', type: 'type', onChange: 'onChange'}}
		 */
		$scope.selectizeOptions = {
			'labelField'   : 'text',
			'valueField'   : 'id',
			'hideSelected' : true,
			'sortField'    : 'text',
			'dataAttr'     : 'width',
			'persist'      : true,
			'optgroupOrder':
				[
					'',
					'SMART FILTERS',
					'DETACHMENT',
					'AFSC',
					'MDS',
					'INSTRUCTOR',
					'COURSE'
				],
			'plugins'      :
				[
					'optgroup_columns',
					'remove_button'
				],
			'type'         : utils.selectize.$onType,
			'onChange'     : utils.selectize.$onChange,
			'onInitialize' : function () {

				$('.hide').removeClass('hide');

				FTSS.search = search = this;

				var loaded = (function () {

					var count = 0;

					return function (data, title, text) {

						var id = title.toLowerCase().charAt(0) + ':';

						if (typeof text !== 'function') {
							text = function (v) {
								return v;
							};
						}

						search.addOptionGroup(title, {
							'label': title,
							'value': title
						});

						search.addOption(_.map(data, function (v) {

							return {
								'id'      : id + (v.Id || v),
								'optgroup': title,
								'text'    : text(v)
							};

						}));


						if (++count > 4) {

							$scope.loaded = true;
							utils.$initPage();

						}

					};

				}());

				SharePoint.read(FTSS.models.catalog).then(function (response) {

					FTSS.utils.log('MasterCourseList');

					$scope.MasterCourseList = response;

					$scope.AFSC = _.compact(_.uniq(_.pluck(response, 'AFSC')));
					$scope.MDS = _.compact(_.uniq(_.pluck(response, 'MDS')));

					loaded($scope.MasterCourseList, 'COURSE', function (v) {
						return
						[
							v.PDS,
							v.Number,
							v.Title,
							v.MDS,
							v.AFSC
						].join(' / ');
					});

					loaded($scope.MDS, 'MDS');

					loaded($scope.AFSC, 'AFSC');

				});

				SharePoint.read(FTSS.models.units).then(function (response) {

					FTSS.utils.log('Units');
					$scope.Units = response;

					loaded(response, 'DETACHMENT', function (v) {
						return
						[
							v.Base,
							' (Det. ',
							v.Det,
							')'
						].join('');
					});

				});

				SharePoint.read(FTSS.models.instructors).then(function (response) {

					FTSS.utils.log('Instructors');
					$scope.Instructors = response;

					loaded(response, 'INSTRUCTOR', function (v) {

						return  v.Instructor.Name;

					});

				});

			}
		};

	});

	utils.$decorate = function ($scope, req) {

		FTSS.utils.log('Decorate', true);

		try {

			var seats, schedClass = req.Scheduled || req;

			req.Course = $scope.MasterCourseList[schedClass.CourseId];

			req.det = $scope.Units[schedClass.UnitId];

			req.instructor = $scope.Instructors[schedClass.InstructorId].Instructor || {};

			req.instructor = req.instructor.Name || 'No Instructor Identified';

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

		return req;

	};

	utils.initData = function ($scope, data) {

		$scope.data = data;

		$scope.count.results = _.keys($scope.data || {}).length;

		if ($scope.count.results < 1) {

			utils.$message('empty');

			return false;

		} else {

			return true;

		}
	};


	app.controller('homeController', function () {

		utils.$loading(false);

	});


	app.controller('requestsController', function ($scope, SharePoint) {

		$scope.$watch('filter', function (filter) {

			if (filter === false) {
				return;
			}

			var model = FTSS.models.requests;
			model.params.$filter = filter;

			SharePoint.read(model).then(function (data) {

				if (utils.initData($scope, data)) {

					_.each($scope.data, function (req) {

						req = utils.$decorate($scope, req);

						req.status = {'1': 'Pending', '2': 'Approved', '3': 'Denied'}[req.Status];

						req.icon = {'1': 'clock-o', '2': 'thumbs-up', '3': 'thumbs-down'}[req.Status];

						req.mail = '?subject=' + encodeURIComponent('FTD Registration (' + req.Course.Title + ')') + '&body=' + encodeURIComponent(req.start + ' - ' + req.end + '\n' + req.det.Base);

						req.notes = req.Notes || 'Requested by';

						req.reqSeats = req.Students.results.length;

						req.openSeatsClass = req.reqSeats > req.openSeats ? 'danger' : 'success';

						req.Created = FTSS.utils.fixDate(req.Created, true);

						req.Scheduled.Course = req.Course;

						utils.$loading(false);

					});

					utils.tagHighlight($scope.data);

					$scope.$watch('groupBy', function () {

						$scope.groups = _.groupBy($scope.data, function (req) {
							return req.Course[$scope.groupBy] || req[$scope.groupBy];
						});

					});

					$scope.showGrouping = !search.isDisabled;

					$scope.groupBy = $scope.groupBy || (search.isDisabled ? 'status' : 'course');

				}

			}, utils.$ajaxFailure);

		});

	});

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

	app.controller('catalogController', function ($scope, SharePoint) {

		FTSS.utils.log('Catalog Controller');

		$scope.$watch('filter', function (filter) {


			if (filter === false) {
				return;
			}

			FTSS.utils.log('Catalog Update');

			SharePoint.read(FTSS.models.catalog).then(function (data) {

				FTSS.utils.log('Catalog Loaded');

				if (utils.initData($scope, data)) {

					utils.$loading(false);

					utils.tagHighlight($scope.data);

					$scope.$watch('groupBy', function () {

						$scope.groups = _.groupBy($scope.data, function (req) {
							return req[$scope.groupBy];
						});

						$scope.sort();

					});

					$scope.groupBy = $scope.groupBy || 'MDS';

				}

			}, utils.$ajaxFailure);

		});

	});

	app.controller('unitsController', function ($scope, SharePoint) {

		FTSS.utils.log('Units Controller');

		$scope.$watch('filter', function (filter) {

			if (filter === false) {
				return;
			}

			FTSS.utils.log('Units Update');

			SharePoint.read(FTSS.models.units).then(function (data) {

				FTSS.utils.log('Units Loaded');

				if (utils.initData($scope, data)) {

					utils.$loading(false);

					utils.tagHighlight($scope.data);

					$scope.sort();

				}

			}, utils.$ajaxFailure);

		});

	});

	app.controller('scheduledController', function ($scope, SharePoint, $modal) {

		FTSS.utils.log('Schedule Controller');

		$scope.add = function (req) {

			$modal.open({

				            'templateUrl': 'partials/modal-request-seats.html',
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

		$scope.$watch('filter', function (filter) {

			if (filter === false) {
				return;
			}

			FTSS.utils.log('Schedule Update');

			var model = FTSS.models.scheduled;
			model.params.$filter = filter;

			SharePoint.read(model).then(function (data) {

				FTSS.utils.log('Schedule Loaded');

				if (utils.initData($scope, data)) {

					_.each($scope.data, function (req) {

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

					utils.tagHighlight($scope.data);

					$scope.$watch('groupBy', function () {

						$scope.groups = _.groupBy($scope.data, function (req) {
							return req.Course[$scope.groupBy] || req[$scope.groupBy];
						});

					});

					$scope.groupBy = $scope.groupBy || 'MDS';

				}

			}, utils.$ajaxFailure);

		});

	});


}()
	);