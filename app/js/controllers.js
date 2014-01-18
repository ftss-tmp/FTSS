(function () {

	var filters, search, $updateView, utils, loaded = false;

	// Stores routes, maps for each page and a $add/$compile function to assemble the filters
	filters = {};

	utils = {};

	app.run(function ($rootScope, $location) {

		utils.$loading = function (loading) {

			utils.$message(false);

			if (loading) {
				document.body.style.cursor = $rootScope.loading = 'wait';
				if (search) {
					search.close();
					search.blur();
				}
			} else {
				document.body.style.cursor = $rootScope.loading = '';
			}

		};

		utils.$initPage = function () {

			if (loaded) {

				FTSS.utils.log('Init Page');

				filters.$add($rootScope, $location.$$path);

				$rootScope.count = {
					'results': 0
				};

				if ($updateView && search.getValue()) {

					utils.selectize.$onChange(search.getValue(), true);

				}

				utils.$loading(false);

			}

		};

		$rootScope.$on('$locationChangeStart', function ($rootScope) {

			FTSS.utils.log('Location Change Start');

			utils.$loading(true);

		});


	});

	/**
	 *  This is the app-wide collection of custom filters used by the search box
	 */
	filters.route =
	{
		'/scheduled':
			[
				{'id': "custom:Start ge datetime'TODAY'", 'text': 'Not Started'},
				{'id': "custom:End le datetime'TODAY'", 'text': 'Completed'},
				{'id': "custom:(Start le datetime'TODAY' and End ge datetime'TODAY')", 'text': 'In Progress'}
			],
		'/requests':
			[
				{'id': 'custom:Status gt 1', 'text': 'Completed Requests'},
				{'id': 'custom:Status eq 1', 'text': 'Pending Requests'},
				{'id': 'custom:Status eq 2', 'text': 'Approved Requests'},
				{'id': 'custom:Status eq 3', 'text': 'Denied Requests'}
			]
	};

	/**
	 * This function handles updating the custom filter list when the view is chaned
	 */
	filters.$add =
		(function () {

			var today, date = new Date();

			today =
				[
					date.getFullYear(),
					('0' + date.getMonth() + 1).slice(-2),
					('0' + date.getDate()).slice(-2)
				]
					.join('-');

			return function ($scope, $path) {

				FTSS.utils.log('Add Filters');

				_.each(_.flatten(filters.route), function (f) {

					search.removeOption(f.id)

				});

				_.each(filters.route[$path], function (filter) {

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
				];

			if (tags) {

				if (tags.custom) {
					filter = tags.custom;
				}

				_.each(filters.map, function (map, key) {

					_.each(tags[key], function (tag) {

						filter.push(map + tag + (map.substr(map.length - 1) === "'" ? "'" : ""));

					});

				});

			}

			filter = filter.length > 0 ? filter.join(' or ') : '';

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
			'class': 'danger',
			'intro': 'Hmmm, something went wrong:',
			'message':
				[
					this.type,
					'(' + req.status + ')',
					this.url
				].join(' ')
		});
	};


			FTSS.utils.log('Decorate', true);

			try {

				var schedClass = req.Scheduled || req;

				req.course = $scope.MasterCourseList[schedClass.CourseId];

				req.det = $scope.Units[schedClass.UnitId];

				req.instructor = $scope.Instructors[schedClass.InstructorId].Instructor || {};

				req.instructor = req.instructor.Name || 'No Instructor Identified';

				req.start = FTSS.utils.fixDate(schedClass.Start);

				req.end = FTSS.utils.fixDate(schedClass.End);


	utils.selectize = (function () {

		var updating, delaySearch;

		return {

			'$onChange': function (val, instant) {

				FTSS.utils.log('Selectize Change');

				clearTimeout(delaySearch);

				if (!updating) {

					if (val instanceof Array && val.length > 0) {

						if (val.slice(-1)[0] === '*') {

							FTSS.utils.log('Selectize *');

							utils.$loading(true);

							if (val.length > 1) {
								updating = true;
								search.setValue('*');
								search.lock();
								updating = false;
							}

							$updateView(false);

						} else {

							delaySearch = setTimeout(function () {

								FTSS.utils.log('Selectize Filtered');

								utils.$loading(true);

								var tags = {};

								_.each(val, function (v) {

									var split = v.split(':');

									tags[split[0]] = tags[split[0]] ||
										[
										];

									tags[split[0]].push(split[1]);

								});


								$updateView(filters.$compile(tags));

							}, (instant ? 1 : 500));

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

				utils.$message('ready');
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

		}

	}());

	/**
	 * The main controller performs the initial caching functions as well as setting up other app-wide $scope objects
	 */
	app.controller('mainController', function ($scope, $location, SharePoint) {

		FTSS.utils.log('Main Controller');

		if ($updateView) {
			return;
		}

		// Messages is used to pass various messages regarding program state to the user (including errors);
		utils.$message = function (msg) {

			switch (msg) {

				case false:
					$scope.messages = {};
					return;

				case 'empty':
					msg = {
						'class': 'warning',
						'intro': 'Nothing Found!  ',
						'message': "There doesn't seem to be anything that matches your request.  Maybe you should add some more tags to your search."
					};
					break;

				case 'ready':
					msg = {
						'intro': "You're ready to go.  ",
						'message': 'To get started, use the search box below to create a tag list.  The page will update as you add more tags.'
					};

			}

			$scope.messages = {
				'newLine': msg.newLine || 'false',
				'class': msg.class || 'info',
				'intro': msg.intro || 'Quick Note:  ',
				'message': msg.message || ''
			};

		};

		utils.$message({
			'intro': 'One moment please, updating your local FTSS data (this makes everything else faster).'
		});

		$scope.isPage = function (page) {
			var currentRoute = $location.path().substring(1) || 'home';
			return page === currentRoute ? 'active' : '';
		};

		$scope.collapse = function () {
			$scope.wellCollapse = $scope.wellCollapse ? '' : 'collapsed';
		};

		(function () {

			var rCount = 0;

			/**
			 * This event allows us to detect the completion of the searchbox option tag generation
			 */
			$scope.$on('rendered', function () {

				if (++rCount > 4) {

					FTSS.utils.log('Caches Loaded');

					$scope.loaded = loaded = true;

				}

			});

		}());

		/**
		 * The Selectize init options
		 *
		 * @type {{labelField: string, valueField: string, hideSelected: boolean, sortField: string, dataAttr: string, optgroupOrder: string[], plugins: string[], onInitialize: 'onInitialize', type: 'type', onChange: 'onChange'}}
		 */
		$scope.selectizeOptions =
		{
			'labelField': 'text',
			'valueField': 'id',
			'hideSelected': true,
			'sortField': 'text',
			'dataAttr': 'width',
			'persist': true,
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
			'plugins':
				[
					'optgroup_columns',
					'remove_button'
				],
			'onInitialize': utils.selectize.$onInitialize,
			'type': utils.selectize.$onType,
			'onChange': utils.selectize.$onChange
		};

		SharePoint
			.get({

				'cache': true,
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

			})
			.then(function (response) {
				FTSS.utils.log('MasterCourseList');
				$scope.MasterCourseList = response;

				$scope.AFSC = _.compact(_.uniq(_.pluck(response, 'AFSC')));
				$scope.MDS = _.compact(_.uniq(_.pluck(response, 'MDS')));

			});


		SharePoint
			.get({

				'cache': true,
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

			})
			.then(function (response) {
				FTSS.utils.log('Units');
				$scope.Units = response;
			});

		SharePoint
			.get({

				'cache': true,
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

			})
			.then(function (response) {
				FTSS.utils.log('Instructors');
				$scope.Instructors = response;
			});

	});


	app.controller('homeController', function ($scope) {

		$updateView = function () {
		};

		utils.$loading(false);

	});


	app.controller('requestsController', function ($scope, SharePoint) {
		FTSS.utils.log('Request Controller');
		filters.map =
		{
			'd': 'Scheduled/UnitId eq ',
			'm': "Scheduled/Course/MDS eq '",
			'a': "Scheduled/Course/AFSC eq '",
			'i': 'Scheduled/InstructorId eq ',
			'c': 'Scheduled/CourseId eq '
		};

		$updateView = function (filter) {
			FTSS.utils.log('Request update');
			$scope.requests =
				[
				];

			SharePoint.get({

				'source': 'Requests',
				'params': {
					'$filter': filter,
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

					utils.$loading(false);

					if ($scope.count.results < 1) {

						utils.$message('empty');

					} else {

						_.each($scope.requests, function (req) {

							req = utils.$decorate($scope, req);

							req.status = {'1': 'Pending', '2': 'Approved', '3': 'Denied'}[req.Status];
							req.icon = {'1': 'time', '2': 'thumbs-up', '3': 'thumbs-down'}[req.Status];

							req.mail = '?subject=' + encodeURIComponent('FTD Registration (' + req.course.Title + ')') + '&body=' + encodeURIComponent(req.start + ' - ' + req.end + '\n' + req.det.Base);

							req.notes = req.Notes || 'Requested by';

							req.openSeats = req.course.Max - req.Scheduled.Host - req.Scheduled.Other;
							req.reqSeats = req.Students.results.length;

							req.openSeatsClass = req.reqSeats > req.openSeats ? 'danger' : 'success';
							req.reqSeatsText = req.reqSeats + ' Requested Seat' + (req.reqSeats > 1 ? 's' : '');

						});

					}

				}, utils.$ajaxFailure);

		}

		utils.$initPage();


	});


	app.controller('scheduledController', function ($scope, SharePoint) {

		FTSS.utils.log('Schedule Controller')
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

		filters.map =
		{
			'd': 'UnitId eq ',
			'm': "Course/MDS eq '",
			'a': "Course/AFSC eq '",
			'i': 'InstructorId eq ',
			'c': 'CourseId eq '
		};

		$scope.update.view = function (filter) {

			FTSS.utils.log('Schedule Update');

			$scope.requests =
				[
				];

			SharePoint.read({

				'source': 'Scheduled',
				'params': {
					'$filter': filter,
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

			})
				.then(function (data) {
					FTSS.utils.log('Schedule Loaded');
					$scope.requests = data;

					$scope.count.results = _.keys($scope.requests || {}).length;

					utils.$loading(false);

					if ($scope.count.results < 1) {

						utils.$message('empty');

					} else {

						_.each($scope.requests, function (req) {

							req = utils.$decorate($scope, req);

						});

					}

				}, utils.$ajaxFailure);

		};

		utils.$initPage();

	});


}());