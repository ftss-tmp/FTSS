(function () {

	"use strict";

	var firstRun = true, filters = {}, utils = {}, search;

	/**
	 *  This is the app-wide collection of custom filters used by the search box
	 */
	filters.route = {
		'scheduled':
			[
				{'id': "custom:Start ge datetime'TODAY'", 'text': 'Not Started'},
				{'id': "custom:End le datetime'TODAY'", 'text': 'Completed'},
				{'id': "custom:(Start le datetime'TODAY' and End ge datetime'TODAY')", 'text': 'In Progress'}
			],
		'requests' :
			[
				{'id': 'custom:Status gt 1', 'text': 'Completed Requests'},
				{'id': 'custom:Status eq 1', 'text': 'Pending Requests'},
				{'id': 'custom:Status eq 2', 'text': 'Approved Requests'},
				{'id': 'custom:Status eq 3', 'text': 'Denied Requests'}
			]
	};

	filters.map = {
		'scheduled': {
			'd': 'UnitId',
			'm': "Course/MDS",
			'a': "Course/AFSC",
			'i': 'InstructorId',
			'c': 'CourseId'
		},
		'requests' : {
			'd': 'Scheduled/UnitId',
			'm': "Scheduled/Course/MDS",
			'a': "Scheduled/Course/AFSC",
			'i': 'Scheduled/InstructorId',
			'c': 'Scheduled/CourseId'

		}
	};

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

		var page, pending, updating, delaySearch;

		page = function () {
			return  $location.path().split('/')[1];
		};

		if (!firstRun) {
			firstRun = false;
			return;
		}

		// Messages is used to pass various messages regarding program state to the user (including errors);
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

			if (loading) {
				document.body.style.cursor = $scope.loading = 'wait';
				if (search) {
					search.close();
					search.blur();
				}
			} else {
				document.body.style.cursor = $scope.loading = '';
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

						customFilters = filters.route[page()];

						if (pending == '*') {

							tmp = pending;

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

						if (pending.custom && pending.custom.length < 1) {
							delete pending.custom;
						}

						updating = true;

						search.setValue(tmp);

						tmp = filters.$compile(pending);

						if (tmp || pending === '*') {

							$scope.tags = pending;
							$scope.filter = tmp;

						}

						pending = updating = false;

					}());

				} else {
					utils.$message('ready');
				}

			}

		};

		utils.tagHighlight = function (data) {

			if ($scope.tags !== '*') {

				var test =
					[
					], map = filters.map[page()];

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

				_.all(data, function (req) {

					_.each(test, function (t, k) {

						var field, match;

						field = req[t.testField[0]][t.testField[1]] || req[t.testField[0]];

						match = (field === t.testValue);

						if (match) {

							search.$control.find('.item[data-value="' + t.id + '"]').addClass('matched');
							delete test[k];

						}

					});

					return (test.length > 0);

				});

			}

		};

		/**
		 * This function handles updating the custom filter list when the view is chaned
		 */
		filters.$add = (function () {

			var today, date = new Date();

			today =
				[
					date.getFullYear(),
					('0' + date.getMonth() + 1).slice(-2),
					('0' + date.getDate()).slice(-2)
				].join('-');

			return function () {

				FTSS.utils.log('Add Filters');

				_.each(_.flatten(filters.route), function (f) {

					search.removeOption(f.id);

				});

				_.each(filters.route[page()], function (filter) {

					filter.id = filter.id.replace(/TODAY/g, today);

					filter.optgroup = 'SMART FILTERS';

					search.addOption(filter);

				});

			}

		}());

		/**
		 * Filter Compile Function
		 *
		 * Converts user-selected tags{} into the SharePoint friendly filter query
		 *
		 * @param tags Object
		 * @returns {*}
		 */
		filters.$compile = function (tags) {

			FTSS.utils.log('Compile Tags');

			try {

				var filter =
					[
					], maps = filters.map[page()];

				if (tags) {

					filter = tags.custom ||
						[
						];

					_.each(maps, function (map, key) {

						var isString = (key === 'm' || key === 'a'), fTemp =
							[
							];

						_.each(tags[key], function (tag) {

							if (isString) {

								fTemp.push(
									[
										map,
										" eq '",
										tag.trim(),
										"'"
									].join(''));

							} else {

								fTemp.push(
									[
										map,
										'eq',
										tag
									].join(' '));

							}

						});

						if (fTemp.length) {

							filter.push('(' + fTemp.join(' or ') + ')');

						}

					});

				}

				filter = filter.length > 0 ? filter.join(' and ') : '';

				return filter;

			} catch (e) {

				return '';

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

		utils.$decorate = function ($scope, req) {

			FTSS.utils.log('Decorate', true);

			try {

				var schedClass = req.Scheduled || req;

				req.Course = $scope.MasterCourseList[schedClass.CourseId];

				req.det = $scope.Units[schedClass.UnitId];

				req.instructor = $scope.Instructors[schedClass.InstructorId].Instructor || {};

				req.instructor = req.instructor.Name || 'No Instructor Identified';

				req.start = FTSS.utils.fixDate(schedClass.Start);

				req.end = FTSS.utils.fixDate(schedClass.End);

				req.unit = req.det.Base + ', Det ' + req.det.Det;

				req.course = req.Course.PDS + ' - ' + req.Course.Number;

			} catch (e) {
			}

			return req;

		};

		utils.selectize = {

			'$onChange': function (val, instant) {

				clearTimeout(delaySearch);

				if (!updating) {

					FTSS.utils.log('Selectize Change');

					if (val instanceof Array && val.length > 0) {

						var linker = function (tags) {

							$scope.permaLink = (!tags) ? 'all' : LZString.compressToBase64(JSON.stringify(tags));

							window.location.hash =
								[
									'',
									page(),
									$scope.permaLink
								].join('/');

							updating = false;

						};

						if (val.slice(-1)[0] === '*') {

							FTSS.utils.log('Selectize *');

							updating = true;

							if (val.length > 1) {
								search.setValue('*');
								search.lock();
							}

							linker(false);

						} else {

							delaySearch = setTimeout(function () {

								FTSS.utils.log('Selectize Filtered');

								updating = true;

								var tags = {};

								_.each(val, function (v) {

									var split = v.split(':');

									tags[split[0]] = tags[split[0]] ||
										[
										];

									tags[split[0]].push(Number(split[1]) || split[1]);

								});

								linker(tags);


							}, (instant ? 1 : 1000));

						}

					} else {
						utils.$loading(false);
						search.unlock();
					}

				}
			},

			'$onInitialize': function () {
				$('.hide').removeClass('hide');

				search = this;

				utils.$initPage();

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
			return link === (page() || 'home') ? 'active' : '';
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
		 * Watch for the completion of all the search box cache lookups & rendering prior to triggering $scope.loaded
		 */
		(function () {

			var rCount = 0;

			$scope.$on('rendered', function () {

				if (++rCount > 4) {

					FTSS.utils.log('Caches Loaded');

					$scope.loaded = true;

				}

			});

		}());

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
			'maxItems'     : 25,
			'optgroupOrder':
				[
					'',
					'SMART FILTERS',
					'UNIT',
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
			'onInitialize' : utils.selectize.$onInitialize,
			'type'         : utils.selectize.$onType,
			'onChange'     : utils.selectize.$onChange
		};

		SharePoint.read({

			                'cache' : true,
			                'source': 'MasterCourseList',
			                'params': {
				                '$select':
					                [
						                'Id',
						                'PDS',
						                'MDS',
						                'Days',
						                'Hours',
						                'Min',
						                'Max',
						                'AFSC',
						                'Title',
						                'Number'
					                ]
			                }

		                }).then(function (response) {

			                        FTSS.utils.log('MasterCourseList');

			                        $scope.MasterCourseList = response;

			                        $scope.AFSC = _.compact(_.uniq(_.pluck(response, 'AFSC')));
			                        $scope.MDS = _.compact(_.uniq(_.pluck(response, 'MDS')));

		                        });

		SharePoint.read({

			                'cache' : true,
			                'source': 'Units',
			                'params': {
				                '$select':
					                [
						                'Id',
						                'Base',
						                'Det',
						                'Email',
						                'Phone'
					                ]
			                }

		                }).then(function (response) {

			                        FTSS.utils.log('Units');
			                        $scope.Units = response;

		                        });

		SharePoint.read({

			                'cache' : true,
			                'source': 'Instructors',
			                'params': {
				                '$expand': 'Instructor'/*,
				                 '$select':
				                 [
				                 'Id',
				                 'InstructorId',
				                 'Instructor/Name',
				                 'Instructor/WorkEMail',             <-- This isn't working on the local development SP copy for some reason...
				                 'Instructor/WorkPhone'
				                 ]*/
			                }

		                }).then(function (response) {

			                        FTSS.utils.log('Instructors');
			                        $scope.Instructors = response;

		                        });

	});


	app.controller('homeController', function ($scope) {

		utils.$loading(false);

	});


	app.controller('requestsController', function ($scope, SharePoint) {

		FTSS.utils.log('Request Controller');

		$scope.$watch('filter', function () {

			if ($scope.filter === false) {
				return;
			}

			FTSS.utils.log('Request update');

			$scope.requests =
				[
				];

			SharePoint.read({

				                'source': 'Requests',
				                'params': {
					                '$filter': $scope.filter,
					                '$expand':
						                [
							                'Students',
							                'CreatedBy',
							                'Scheduled/Course'
						                ],
					                '$select':
						                [
							                'Id',
							                'Notes',
							                'Status',
							                'Created',
							                'CreatedBy/Name',
							                'CreatedBy/WorkEMail',
							                'CreatedBy/WorkPhone',
							                'Students/Name',
							                'Students/WorkEMail',
							                'Students/WorkPhone',
							                'Scheduled/UnitId',
							                'Scheduled/CourseId',
							                'Scheduled/Start',
							                'Scheduled/End',
							                'Scheduled/Host',
							                'Scheduled/Other',
							                'Scheduled/InstructorId'
						                ]
				                }

			                }).then(function (data) {
				                        FTSS.utils.log('Request Data Loaded');
				                        $scope.requests = data;

				                        $scope.count.results = _.keys($scope.requests || {}).length;

				                        if ($scope.count.results < 1) {

					                        utils.$message('empty');

				                        } else {

					                        _.each($scope.requests, function (req) {

						                        req = utils.$decorate($scope, req);

						                        req.status = {'1': 'Pending', '2': 'Approved', '3': 'Denied'}[req.Status];
						                        req.icon = {'1': 'time', '2': 'thumbs-up', '3': 'thumbs-down'}[req.Status];

						                        req.mail = '?subject=' + encodeURIComponent('FTD Registration (' + req.Course.Title + ')') + '&body=' + encodeURIComponent(req.start + ' - ' + req.end + '\n' + req.det.Base);

						                        req.notes = req.Notes || 'Requested by';

						                        req.openSeats = req.Course.Max - req.Scheduled.Host - req.Scheduled.Other;
						                        req.reqSeats = req.Students.results.length;

						                        req.openSeatsClass = req.reqSeats > req.openSeats ? 'danger' : 'success';
						                        req.reqSeatsText = req.reqSeats + ' Requested Seat' + (req.reqSeats > 1 ? 's' : '');

						                        req.Created = FTSS.utils.fixDate(req.Created, true);

						                        utils.$loading(false);

					                        });

					                        utils.tagHighlight($scope.requests);

					                        $scope.$watch('groupBy', function () {

						                        $scope.groups = _.groupBy($scope.requests, function (req) {
							                        return req.Course[$scope.groupBy] || req[$scope.groupBy];
						                        });

					                        });

					                        $scope.groupBy = $scope.groupBy || 'course';

				                        }

			                        }, utils.$ajaxFailure);

		});

	});


	app.controller('scheduledController', function ($scope, SharePoint) {

		FTSS.utils.log('Schedule Controller');

		/*$scope.requests =
		 [
		 ];*/
		/*	$scope.columns =
		 [
		 {'label': 'Base', 'map': 'det.Base'},
		 {'label': 'MDS', 'map': 'course.MDS'},
		 {'label': 'AFSC', 'map': 'course.AFSC'},
		 {'label': 'PDS', 'map': 'course.PDS'},
		 {'label': 'Course', 'map': 'course.CourseNumber'},
		 {'label': 'Title', 'map': 'course.CourseTitle'}
		 ];

		 $scope.globalConfig = {
		 'isGlobalSearchActivated': true,
		 'isPaginationEnabled': false
		 };*/

		$scope.$watch('filter', function () {

			if ($scope.filter === false) {
				return;
			}

			FTSS.utils.log('Schedule Update');

			$scope.requests =
				[
				];

			SharePoint.read({

				                'source': 'Scheduled',
				                'params': {
					                '$filter': $scope.filter,
					                '$expand': 'Course',
					                '$select':
						                [
							                'Id',
							                'UnitId',
							                'CourseId',
							                'Start',
							                'End',
							                'InstructorId',
							                'Host',
							                'Other'
						                ]
				                }

			                }).then(function (data) {

				                        FTSS.utils.log('Schedule Loaded');

				                        $scope.requests = data;

				                        $scope.count.results = _.keys($scope.requests || {}).length;

				                        if ($scope.count.results < 1) {

					                        utils.$message('empty');

				                        } else {

					                        _.each($scope.requests, function (req) {

						                        req = utils.$decorate($scope, req);

					                        });

					                        utils.$loading(false);

				                        }

				                        utils.tagHighlight($scope.requests);

				                        $scope.$watch('groupBy', function () {

					                        $scope.groups = _.groupBy($scope.requests, function (req) {
						                        return req.Course[$scope.groupBy] || req[$scope.groupBy];
					                        });

				                        });

				                        $scope.groupBy = $scope.groupBy || 'MDS';

			                        }, utils.$ajaxFailure);

		});

	});


}()
	);