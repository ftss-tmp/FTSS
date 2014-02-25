/*global _, $, FTSS, LZString, utils, caches, watcher */

/**
 * FTSS Main Controller
 *
 * Initializes the application and body controller
 *
 *
 */

(function () {

	"use strict";

	var init, search, loader = $('#content')[0];

	FTSS.ng.controller(

		'user',
		[
			'$scope',
			'SharePoint',
			function ($scope, SharePoint) {

				SharePoint.user($scope);

			}
		]);

	init = function() {

	};

	/**
	 * The main controller performs the initial caching functions as well as setting up other app-wide $scope objects
	 */
	FTSS.ng.controller(

		'mainController',
		[
			'$scope',
			'$location',
			'SharePoint',
			'$routeParams',
			function ($scope, $location, SharePoint, $routeParams) {

				var pending, updating, delaySearch;

				/**
				 * Returns the current base page
				 * @returns String page
				 */
				$scope.page = FTSS.page = function () {
					return  $location.path().split('/')[1];
				};

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
								'intro'  : "You're ready to go.",
								'newLine': true,
								'message': 'To get started, use the search box above.  The page should update automagically. If the record count to the left of the search box is orange, there were too many results--you\'ll want to refine your search a little.'
							};

					}

					$scope.messages = {
						'newLine': msg.newLine || 'false',
						'class'  : msg.class || 'info',
						'intro'  : msg.intro || 'Quick Note:  ',
						'message': msg.message || ''
					};

				};

				/**
				 * Handles the page loading indicators (mouse & spinner)
				 *
				 * @param loading
				 */
				utils.$loading = function (loading) {

					try {

						utils.$message(false);

						if ($scope.loading !== loading) {

							if (loading) {
								document.body.style.cursor = loader.className = 'wait';
								if (search) {
									search.close();
									search.blur();
								}
							} else {
								document.body.style.cursor = loader.className = '';
							}

						}

					} catch (e) {

					}

				};

				utils.$initPage = function () {

					if ($scope.loaded) {

						FTSS.filters.$add();

						if (pending) {

							(function () {

								var valMap, tagMap, customFilters;

								valMap =
									[
									];
								tagMap = {};

								customFilters = FTSS.filters.route();

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

								} else {

									_.each(pending, function (filterItems, filterGroup) {

										_.each(filterItems, function (filter) {

											var valid = true;

											if (filterGroup === 'custom') {

												valid = _.some(customFilters, function (f) {
													return f.id === 'custom:' + filter;
												});

											}

											if (valid) {
												tagMap[filterGroup] = tagMap[filterGroup] ||
													[
													];
												tagMap[filterGroup].push(filter);
												valMap.push(filterGroup + ':' + filter);
											}

										});

									});

									utils.updateSearch(function () {

										var filter;

										search.setValue(valMap);

										filter = FTSS.filters.$compile(tagMap);

										if (filter || pending === '*') {

											$scope.tags = tagMap;
											$scope.filter = filter;

										}

									});

								}

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

						var test, map;

						test =
							[
							];
						map = FTSS.filters.map();

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

					$scope.permaLink = LZString.compressToBase64(JSON.stringify(tag));

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

							} else {
								utils.$loading(false);
								search.unlock();
							}

						}
					},

					'$onType': function () {
						clearTimeout(delaySearch);
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
				 * This is the callback for the searchbox reset button, clears out the search params
				 */
				$scope.reset = function () {
					clearTimeout(delaySearch);
					search.clear();
					$scope.searchText.$ = '';
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

					if (FTSS.searchWatch) {
						FTSS.searchWatch();
					}

					$scope.pageLimit = 25;
					$scope.count = '-';
					$scope.overload = false;
					$scope.filter = false;
					$scope.sortBy = {};
					$scope.groupBy = {};
					$scope.searchText = $scope.searchText || {};

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
				 * @type {{labelField: string, valueField: string, hideSelected: boolean, sortField: string, dataAttr: string, optgroupOrder: string[], plugins: string[],
		 * ialize: 'onInitialize', type: 'type', onChange: 'onChange'}}
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

								v.Squadron = v.Det < 300 ? '372 TRS' : '373 TRS';

								v.LongName =
									[
										v.Base,
										' (Det. ',
										v.Det,
										')'
									].join('');

								return v.LongName;
							});

						});

						SharePoint.read(FTSS.models.instructors).then(function (response) {

							caches.Instructors = response;

							loaded(response, 'INSTRUCTOR', function (v) {

								return  v.Instructor.Name;

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
							watchers.push(_.map(scope.$$watchers, function (exp) {
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


					var ret =
						[
							watchers,
							getWatchCount($scope)
						];

					return ret;

				};

			}
		]);


}()
	);