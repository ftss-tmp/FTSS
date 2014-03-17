/*global utils, FTSS, caches, _, Sifter, angular */

/**
 * FTSS.controller()
 *
 * Utility for page controllers to process SP REST data
 *
 * @param $scope
 * @param opts
 * @returns {{$scope: *, bind: 'bind', initialize: 'initialize', process: 'process', scheduledClass: 'scheduledClass', postProcess: 'postProcess'}}
 */
FTSS.controller = (function () {

	var timeout, modal, sharePoint;

	FTSS.ng.run(
		[
			'$timeout',
			'$modal',
			'SharePoint',
			function ($timeout, $modal, SharePoint) {
				timeout = $timeout;
				modal = $modal;
				sharePoint = SharePoint;
			}
		]);

	return function ($scope, opts) {

		var model, process, actions;

		// The tagBox controls whether the search or tagBox are shown
		$scope.$parent.tagBox = opts.tagBox || false;

		// Specify the groupBy parameter
		$scope.$parent.grouping = opts.grouping || false;

		// Specify the sortBy parameter
		$scope.$parent.sorting = opts.sorting || false;

		actions = {

			// Enable access to $scope externally
			'$scope': $scope,

			/**
			 * Creates a $scope.$watcher to perform actions on change.  This function will call sharePoint.read() and pass
			 * the returned data to a promise, then().
			 *
			 * @param String prop the $scope property to watch, "loaded" will be a bind-once watcher, "filter" will stay
			 * bound and add the filter to model.params.$filter before passing the promise.
			 *
			 * @returns {{then: 'then'}}
			 */
			'bind': function (prop) {

				// If loaded we only want to bind the first time
				var single = (prop === 'loaded');

				// Copy the model to a local variable for reuse without affecting the original model
				model = angular.copy(FTSS.models[opts.model]);

				// Bind archive() to all scopes as it will only be called if specified in the view anyway
				$scope.archive = actions.archive;

				// Pass opts.edit to actions.edit for binding to the scope
				$scope.edit = actions.edit(opts.edit);

				// Return the promise, then()
				return {
					'then': function (callback) {

						// Create a $scope.$watch and unwatch = to the return value for unbinding
						var unwatch = $scope.$watch(prop, function (watch) {

							// Only act if there is a valid change to our watch
							if (watch) {

								actions.reload = function () {

									if (prop === 'filter') {
										model.params.$filter = watch;
									}

									sharePoint

										.read(model)

										.then(callback);

								};

								actions.reload();

								// If this is a bind-once and has been called, delete the watch
								if (single) {
									unwatch();
								}

							}
						});

					}
				};

			},

			/**
			 * Initializes the received data and calls any extra init functions from the controller
			 *
			 * @param data
			 * @returns {{then: 'then'}}
			 */
			'initialize': function (data) {

				// Pass the response to actions.data for access externally
				actions.data = data;

				/**
				 * Updates the page count/overload class and passes user messages for no data
				 *
				 * @param count
				 * @param overload
				 */
				$scope.counter = function (count, overload) {

					$scope.$parent.count = count;
					$scope.$parent.overload = overload;

					if (count < 1) {
						// Inform users there were no results
						utils.$message('empty');
					} else {
						// Remove the user message box because we had some results
						utils.$message(false);
					}

				};

				// If there was no data found pass the User Empty Message and abort the operation
				if (_.keys(data || {}).length < 1) {

					// Inform users there were no results
					utils.$message('empty');

					// We must still pass a then() promise to prevent an error, we're just not executing the callback
					return {
						'then': function () {
						}
					};

				} else {

					return {
						/**
						 * The success promise that takes a processCallback to pre-process received data.
						 * The pre-processor is stored internally and used by action.process().
						 *
						 * @param processCallback
						 */
						'then': function (processCallback) {

							// Add our pre-processor (optional), if undefined it just won't be called by actions.process.
							process = processCallback;

							// Call the internal pre-processor
							actions.process(data);

						}
					};

				}
			},

			/**
			 *
			 * @param data
			 */
			'process': function (data) {

				// Use data if valid, otherwise actions.data
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

			/**
			 *
			 * @param req
			 */
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

			/**
			 *
			 * @param data
			 */
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

					FTSS.loaded();

				}

			},

			'edit': function (callback) {

				return function () {

					var scope, instance;

					scope = $scope.$new(true);
					scope.data = angular.copy(this.row);

					instance = modal({
						                 'scope'          : scope,
						                 'backdrop'       : 'static',
						                 'contentTemplate': '/partials/modal-' + opts.model + '.html'
					                 });

					scope.submit = actions.update(scope, instance.destroy);

					scope.traverse = actions.update(scope, function (forward) {

						timeout(function () {

							var rows, row, pointer, data;

							rows = $('tr.ng-scope');

							row = $('#row-' + scope.data.Id);

							pointer = rows.index(row);

							if (forward) {

								data = rows.eq(++pointer).data() || rows.first().data();

							} else {

								data = rows.eq(--pointer).data() || rows.last().data();

							}

							scope.data = angular.copy(data.$scope.row);

							scope.modal.$setPristine();

							$('.ng-dirty').removeClass('ng-dirty');

						});

					});

					if (callback) {
						callback(scope);
					}

				};

			},

			'archive': function () {

				var data = this.row;

				// Double check that this model can actually perform this action
				if (data && data.hasOwnProperty('Archived')) {

					var send = {
						'Archived'  : !data.Archived,
						'__metadata': data.__metadata,
						'cache'     : true
					};

					// Call sharePoint.update() with our data and handle the success/failure response
					sharePoint.update(send).then(function (resp) {

						// HTTP 204 is the status given for a successful update, there will be no body
						if (resp.status === 204) {

							// Update the etag so we can rewrite this data again during the session if we want
							data.__metadata.etag = resp.headers('etag');

							data.Archived = !data.Archived;

							// Copy the updated back to the original dataset
							actions.data[data.Id] = angular.copy(data);

							// Call actions.process() to reprocess the data by our controllers
							actions.process();

						}

					}, utils.$ajaxFailure);

				} else {

					FTSS.utils.log('Invalid call to Archive()');

				}

			},

			/**
			 * Performs our update to the SP model.  Sends only changes to the server for efficiency and handles update response
			 *
			 * @param scope
			 * @returns {Function}
			 */
			'update': function (scope, callback) {

				callback = callback || function () {};

				return function (eventData) {

					var old, fields, send = {};

					if (scope.modal.$dirty) {

						// Used by modal.footer.html to disable the submit button
						scope.submitted = true;

						// Keep a copy of the original data for comparison
						old = actions.data[scope.data.Id];

						// angular.copy() so we don't overwrite the original model
						fields = angular.copy(model.params.$select);

						//  Compare each field from the list of fields to the old data
						_(fields).each(function (field) {

							var data = scope.data[field];

							// First check for valid fields as the model includes expanded and temporary that can not be sent
							if (old.hasOwnProperty(field) && old[field] !== data) {

								send[field] = data;

							}

						});

					}

					// If nothing was updated then fire the callback with false
					if (_(send).isEmpty()) {

						scope.submitted = false;
						callback(eventData, false);

					} else {

						// Use the model's cache setting & __metadata
						send.cache = model.cache;
						send.__metadata = scope.data.__metadata;

						// Call sharePoint.update() with our data and handle the success/failure response
						sharePoint.update(send).then(function (resp) {

							scope.submitted = false;

							// HTTP 204 is the status given for a successful update, there will be no body
							if (resp.status === 204) {

								// Update the etag so we can rewrite this data again during the session if we want
								scope.data.__metadata.etag = resp.headers('etag');

								// Mark the data as updated for the <updated> directive
								scope.data.updated = true;

								// Copy the updated back to the original dataset
								actions.data[scope.data.Id] = angular.copy(scope.data);

								// Call actions.process() to reprocess the data by our controllers
								actions.process();

								callback(eventData, true);

							}

						}, utils.$ajaxFailure);

					}

				};

			}


		};

		return actions;

	};

}());