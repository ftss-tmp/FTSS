(function () {

	var filters, $updateView, utils;

	// Stores routes, maps for each page and a $add/$compile function to assemble the filters
	filters = {};

	utils = {};

	app.run(function ($rootScope, $location) {

		utils.$initPage = function () {

			$rootScope.count = {
				'results': 0
			};

			filters.$add($rootScope, $location.$$path);

			if ($updateView && FTSS.search && FTSS.search.getValue()) {

				utils.selectize.$onChange(FTSS.search.getValue(), true);

			} else {

				document.body.style.cursor = '';

			}

		};

		$rootScope.$on('$locationChangeStart', function ($rootScope) {

			document.body.style.cursor = 'wait';

		});

		$rootScope.$on('$locationChangeSuccess', utils.$initPage);

	});

	/**
	 *  This is the app-wide collection of custom filters used by the search box
	 */
	filters.route = {
		'/scheduled':
			[
				{'id': 'custom:test', 'text': 'Test Requests'}
			],
		'/requests':
			[
				{'id': 'custom:Status gt 1', 'text': 'Completed Requests'},
				{'id': 'custom:Status eq 1', 'text': 'Pending Requests'},
				{'id': 'custom:Status eq 2', 'text': 'Approved Requests'},
				{'id': 'custom:Status eq 3', 'text': 'Denied Requests'}
			]};

	/**
	 * This function handles updating the custom filter list when the view is chaned
	 */
	filters.$add = function ($scope, $path) {

		if (_.isObject(FTSS.search)) {

			_.each(_.flatten(filters.route), function (f) {

				FTSS.search.removeOption(f.id)

			});

			_.each(filters.route[$path], function (filter) {

				filter.optgroup = 'SMART FILTERS';
				FTSS.search.addOption(filter);

			});

		}

	};

	/**
	 * Filter Compile Function
	 *
	 * Converts user-selected tags{} into the SharePoint friendly filter query
	 *
	 * @param tags Object
	 * @returns {*}
	 */
	filters.$compile = function (tags) {

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

			filter = filter.length > 0 ? {'str': filter.join(' or '), 'tags': tags} : {'str': '', 'tags': tags};

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


	utils.$decorate = function ($scope, req) {

		var schedClass = req.ScheduledClass || req;

		req.course = $scope.MasterCourseList[schedClass.CourseId];

		req.det = $scope.Units[schedClass.DetachmentId];

		req.instructor = $scope.Instructors[schedClass.InstructorId].Instructor.Name || 'No Instructor Identified';

		req.start = FTSS.fixDate(schedClass.Start);

		req.end = FTSS.fixDate(schedClass.End);

		return req;

	};

	utils.selectize = (function () {

		var updating, delaySearch;

		return {

			'$onChange': function (val, instant) {

				if (!updating) {

					clearTimeout(delaySearch);

					if (val instanceof Array && val.length > 0) {

						if (val.slice(-1)[0] === '*') {

							document.body.style.cursor = 'wait';

							updating = true;
							FTSS.search.setValue('*');
							FTSS.search.lock();
							updating = false;

							$updateView({'str': null});

						} else {

							var loadView = function () {

								document.body.style.cursor = 'wait';

								var tags = {};

								_.each(val, function (v) {

									var split = v.split(':');

									tags[split[0]] = tags[split[0]] ||
										[
										];

									tags[split[0]].push(split[1]);

								});

								$updateView(filters.$compile(tags));

							};

							if (instant) {
								delaySearch = setTimeout(loadView, 750);
							} else {
								loadView();
							}

						}

					} else {
						FTSS.search.unlock();
					}

				}
			},

			'$onInitialize': function () {
				$('.hide').removeClass('hide');
				$('#spinner').hide();
				setTimeout(utils.$initPage, 250);
			},

			'$onType': function () {
				clearTimeout(delaySearch);
			},
			/**
			 * This is the callback for the searchbox reset button, clears out the search params
			 */
			'$reset': function () {
				clearTimeout(delaySearch);
				FTSS.search.clear();
			}

		}

	}());

	/**
	 * The main controller performs the initial caching functions as well as setting up other app-wide $scope objects
	 */
	app.controller('mainController', function ($scope, $location, $http, $q) {

		var cached;

		if ($updateView) {
			return;
		}

		// Messages is used to pass various messages regarding program state to the user (including errors);
		utils.$message = function (msg) {

			if (msg === 'ready') {
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

		// Add a reference to filters.$add() for our Selectize Directive to call
		$scope.filter = filters.$add;

		/**
		 * The Cached() function loads the FTSS.Read() return and adds it to the mainController $scope
		 *
		 * @param data Object
		 * @param options Object
		 */
		cached = function (data, options) {
			$scope[options.source || options] = data.data || data;
		};

		/**
		 * This event allows us to detect the completion of the searchbox option tag generation
		 */
		$scope.$on('rendered', function () {
			$scope.loaded = true;

			utils.$message('ready');
		});


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

		$q.all(
				[
				/**
				 * Load the MasterCourseList into the $scope from cache if able
				 */
					FTSS.read({
						'http': $http,
						'cache': true,
						'source': 'MasterCourseList',
						'params': {
							'$select':
								[
									'PDS',
									'MDS',
									'Days',
									'Hours',
									'MinStudents',
									'MaxStudents',
									'AFSC',
									'CourseTitle',
									'CourseNumber',
									'Id'
								]
						},
						'success': function (data, options) {

							cached(_.compact(_.uniq(_.pluck(data.data, 'AFSC'))), 'AFSC');
							cached(_.compact(_.uniq(_.pluck(data.data, 'MDS'))), 'MDS');

							cached(data, options);
						},
						'failure': utils.$ajaxFailure
					}),

					FTSS.read({
						'http': $http,
						'cache': true,
						'source': 'Units',
						'params': {
							'$select':
								[
									'Base',
									'Detachment',
									'Contact',
									'DSN',
									'Id'
								]
						},
						'success': cached,
						'failure': utils.$ajaxFailure
					}),

					FTSS.read({
						'http': $http,
						'cache': true,
						'source': 'Instructors',
						'params': {
							'$expand': 'Instructor',
							'$select':
								[
									'Id',
									'InstructorId',
									'Instructor/Name',
									'Instructor/WorkEMail',
									'Instructor/WorkPhone'
								]
						},
						'success': cached,
						'failure': utils.$ajaxFailure
					})
				])
			.then(function (resutls) {
			});

	});


	app.controller('requestsController', function ($scope, $http) {

		filters.map =
		{
			'd': 'ScheduledClass/DetachmentId eq ',
			'm': "ScheduledClass/Course/MDS eq '",
			'a': "ScheduledClass/Course/AFSC eq '",
			'i': 'ScheduledClass/InstructorId eq ',
			'c': 'ScheduledClass/CourseId eq '
		};

		$updateView = function (filter) {
			console.trace();
			FTSS.read({
				'http': $http,
				'params': {
					'$filter': filter.str,
					'$expand':
						[
							'Students',
							'ModifiedBy',
							'ScheduledClass/Course'
						],
					'$select':
						[
							'Id',
							'Notes',
							'Status',
							'ModifiedBy/Name',
							'ModifiedBy/WorkEMail',
							'ModifiedBy/WorkPhone',
							'Students/Name',
							'Students/WorkEMail',
							'Students/WorkPhone',
							'ScheduledClass/DetachmentId',
							'ScheduledClass/CourseId',
							'ScheduledClass/Start',
							'ScheduledClass/End',
							'ScheduledClass/HostReservedSeats',
							'ScheduledClass/OtherReservedSeats',
							'ScheduledClass/InstructorId'
						]
				},
				'source': 'Requests',
				'success': function (data) {

					$scope.requests = data.data;

					if ($scope.requests instanceof Array && $scope.requests.length < 1) {

						utils.$message({
							'class': 'warning',
							'intro': 'Nothing Found!  ',
							'message': "There doesn't seem to be anything that matches your request.  Maybe you should add some more tags to your search."
						});

					} else {

						$scope.count.results = _.keys($scope.requests).length;

						/*
						 var tags;

						 tags = FTSS.search.$control.find('.item');

						 _.each(FTSS.search.$control.find('.item'), function (item) {
						 console.log(item);
						 console.log(item.dataset.value)
						 });
						 */

						_.each($scope.requests, function (req) {

							req = utils.$decorate($scope, req);

							req.status = {'1': 'Pending', '2': 'Approved', '3': 'Denied'}[req.Status];
							req.icon = {'1': 'time', '2': 'thumbs-up', '3': 'thumbs-down'}[req.Status];

							req.mail = '?subject=' + encodeURIComponent('FTD Registration (' + req.course.CourseTitle + ')') + '&body=' + encodeURIComponent(req.start + ' - ' + req.end + '\n' + req.det.Base);

							req.notes = req.Notes || 'Requested by';

							req.openSeats = req.course.MaxStudents - req.ScheduledClass.HostReservedSeats - req.ScheduledClass.OtherReservedSeats;
							req.reqSeats = req.Students.results.length;

							req.openSeatsClass = req.reqSeats > req.openSeats ? 'danger' : 'success';
							req.reqSeatsText = req.reqSeats + ' Requested Seat' + (req.reqSeats > 1 ? 's' : '');

						});

					}

					document.body.style.cursor = '';

				},
				'failure': utils.$ajaxFailure
			});

		};

	});


	app.controller('scheduledController', function ($scope, $http) {

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
			'd': 'DetachmentId eq ',
			'm': "Course/MDS eq '",
			'a': "Course/AFSC eq '",
			'i': 'InstructorId eq ',
			'c': 'CourseId eq '
		};

		$updateView = function (filter) {

			console.trace();

			FTSS.read({
				'http': $http,
				'source': 'ScheduledClasses',
				'params': {
					'$filter': filter.str,
					'$expand': 'Course',
					'$select':
						[
							'Id',
							'DetachmentId',
							'CourseId',
							'Start',
							'End',
							'InstructorId',
							'HostReservedSeats',
							'OtherReservedSeats'
						]
				},
				'success': function (data) {

					$scope.requests = _.toArray(data.data);

					$scope.count.results = _.keys($scope.requests).length;

					if ($scope.requests instanceof Array && $scope.requests.length < 1) {

						utils.$message({
							'class': 'warning',
							'intro': 'Nothing Found!  ',
							'message': "There doesn't seem to be anything that matches your request.  Maybe you should add some more tags to your search."
						});

					} else {

						_.each($scope.requests, function (req) {

							req = utils.$decorate($scope, req);

						});

					}

					document.body.style.cursor = '';

				},
				'failure': utils.$ajaxFailure
			});

		};

	});


}());