/*global _, $, FTSS, app, LZString */

var utils = {}, caches = {}, watcher;

(function () {

	"use strict";

	var firstRun = true, filters, search;

	app.controller('user', function ($scope, SharePoint) {

		SharePoint.user($scope);

	});

	/**
	 * The main controller performs the initial caching functions as well as setting up other app-wide $scope objects
	 */
	app.controller('mainController', function ($scope, $location, SharePoint, $routeParams) {

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

					if (val instanceof Array && val.length > 0) {

						if (val.slice(-1)[0] === '*') {

							utils.updateSearch(function () {

								if (val.length > 1) {
									search.setValue('*');
									search.lock();
								}

								utils.permaLink(false);

							});

						} else {

							delaySearch = setTimeout(function () {

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

			if (search) {
				$scope.noSearch = false;
				search.enable();
			}

			$scope.filter = false;

			utils.$loading(true);

		});

		$scope.$on('$routeChangeSuccess', function () {

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

					var count = 0, CACHE_COUNT = 4;

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

						if (++count > CACHE_COUNT) {

							$scope.loaded = true;
							utils.$initPage();

						}

					};

				}());

				SharePoint.read(FTSS.models.catalog).then(function (response) {

					caches.MasterCourseList = response;

					caches.AFSC = _.compact(_.uniq(_.pluck(response, 'AFSC')));
					caches.MDS = _.compact(_.uniq(_.pluck(response, 'MDS')));

					loaded(caches.MasterCourseList, 'COURSE', function (v) {
						return (
							[
								v.PDS,
								v.Number,
								v.Title,
								v.MDS,
								v.AFSC
							].join(' / '));
					});

					loaded(caches.MDS, 'MDS');

					loaded(caches.AFSC, 'AFSC');

				});

				SharePoint.read(FTSS.models.units).then(function (response) {

					caches.Units = response;

					loaded(response, 'DETACHMENT', function (v) {
						return (
							[
								v.Base,
								' (Det. ',
								v.Det,
								')'
							].join(''));
					});

				});

				SharePoint.read(FTSS.models.instructors).then(function (response) {

					caches.Instructors = response;

					SharePoint.read(FTSS.models.bios).then(function (bios) {

						_.each(bios, function (img) {

							var i = parseInt(img.Name.split('.')[0], 10);

							//							caches.Instructors[i].bio = img.__metadata.media_src;
							caches.Instructors[i].bio = 'http://dev/_layouts/bios/' + img.Name;

						});

						loaded(response, 'INSTRUCTOR', function (v) {

							return  v.Instructor.Name;

						});
					});


				});

			}
		};


		watcher = function () {

			var watchers =
				[
				];

			function getWatchCount(scope, scopeHash) {
				// default for scopeHash
				if (scopeHash === undefined) {
					scopeHash = {};
				}

				// make sure scope is defined and we haven't already processed this scope
				if (!scope || scopeHash[scope.$id] !== undefined) {
					return 0;
				}

				var watchCount = 0;

				if (scope.$$watchers) {
					watchers.push(_.map(scope.$$watchers,function(exp) {
						return exp.exp.exp || exp.exp;
					}));

					watchCount = scope.$$watchers.length;
				}
				scopeHash[scope.$id] = watchCount;

				// get the counts of children and sibling scopes
				// we only need childHead and nextSibling (not childTail or prevSibling)
				watchCount += getWatchCount(scope.$$childHead, scopeHash);
				watchCount += getWatchCount(scope.$$nextSibling, scopeHash);

				return watchCount;
			}



			return [watchers, getWatchCount($scope)];

		};

	});


}()
	);