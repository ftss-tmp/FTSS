/*global _, FTSS, utils */

/**
 * FTSS Main Controller
 *
 * Initializes the application and body controller
 *
 *
 */

(function () {

	"use strict";

	FTSS.ng.controller(
		'user',
		[
			'$scope',
			'SharePoint',
			function ($scope, SharePoint) {

				SharePoint.user($scope);

			}
		]);

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
			'$timeout',
			'$http',
			function ($scope, $location, SharePoint, $routeParams, $timeout, $http) {

				var _fn = $scope.fn = {

					'setLoaded': function (callback) {

						callback && callback();

						utils.loading(false);
						$scope.loaded = true;

					},

					'setPermaLink': function () {

						var view = {

							'g': $scope.groupBy.$,
							's': $scope.sortBy.$,
							'c': $scope.wellCollapse,
							'a': $scope.showArchive,
							'S': $scope.searchText.$

						};

						$scope.permaLink = [

								FTSS.tags && btoa(JSON.stringify(FTSS.tags)) || '',
								btoa(JSON.stringify(view)) || ''

						].join('/');

					},

					'getPage': function () {
						return  $location.path().split('/')[1];
					},

					'doNavigate': function (pg) {

						$timeout(function () {

							$location.path(
								[
									'',
									pg || _fn.getPage(),
									$scope.permaLink
								].join('/'));
						});

					},

					/**
					 * This is the callback for the searchbox reset button, clears out the search params
					 */
					'doResetSearch': function () {
						FTSS.search.clear();
						$scope.searchText.$ = '';
						FTSS.search.refreshOptions(false);
					},

					/**
					 * Toggles data well collapses
					 */
					'doToggleCollapse': function () {
						$scope.wellCollapse = $scope.wellCollapse ? '' : 'collapsed';
					},

					/**
					 * Toggles data archive visibility
					 */
					'doToggleArchive': function () {
						$scope.showArchive = $scope.showArchive ? '' : 'archived';
					},


					/**
					 * Bitly url generator--just because we can.  This will automatically use the 1.usa.gov domain
					 * as that's what usa.gov uses.  If it doesn't work, then it returns the long url instead
					 */
					'doMakeBitly': function () {

						var permaLink = $scope.permaLink || '',

						    pg = _fn.getPage(),

						    cacheLink = 'FTSS_bitly_' + pg + permaLink;

						var page, url;

						if (localStorage[cacheLink]) {

							$scope.bitlyResponse = localStorage[cacheLink];

						} else {

							$scope.bitlyResponse = '';

							page = encodeURIComponent(
								[
									'https://cs3.eis.af.mil/sites/OO-ED-AM-11/index.html#',
									pg,
									permaLink
								].join('/'));

							url = [
								'https://api-ssl.bitly.com/v3/shorten?',
								'access_token=4d2a55cd24810f5e392f6d6c61b0b5d3663ef554',
								'&formate=json',
								'&longUrl=',
								page,
								'&callback=JSON_CALLBACK'
							].join('');

							return $http({
								             'method': 'jsonp',
								             'url'   : url
							             })

								.then(function (data) {

									      $scope.bitlyResponse =

									      localStorage[cacheLink] =

									      ((data.status === 200) ? data.data.data.url : page).split('://')[1];

								      });

						}

					},

					'doInitPage': function () {

						if (FTSS.search || $scope.loaded) {

							if ($scope.tagBox) {

								FTSS.filters.$refresh();

								var pending =
									    $scope.permaLink && JSON.parse(atob($scope.permaLink));

								if (pending) {

									var valMap, tagMap, customFilters;

									valMap = [
									];
									tagMap = {};

									customFilters = FTSS.filters.route();

									if (pending.special) {

										utils.updateSearch(function () {

											$scope.noSearch = true;

											FTSS.search.disable();

											FTSS.search

												.addOption(
												{
													'id'      : 'custom:' + pending.special,
													'label'   : pending.text || 'Special Lookup',
													'optgroup': 'SMART FILTERS'
												});

											FTSS.search.setValue('custom:' + pending.special);

											$scope.filter = pending.special;

											$scope.permaLink = '';

										});

									} else {

										_.each(pending, function (filterItems, filterGroup) {

											_.each(filterItems, function (filter) {

												var valid = true, custom = false;

												if (filterGroup === 'q') {

													valid = _.some(customFilters, function (f) {
														return f.id === 'q:' + filter;
													});

													custom = 'q:' + filter;
													filter = customFilters[filter.charAt(1)].q;

												}

												if (valid) {

													tagMap[filterGroup] = tagMap[filterGroup] || [];
													tagMap[filterGroup].push(filter);
													valMap.push(custom || filterGroup + ':' + filter);
												}

											});

										});

										utils.updateSearch(function () {

											var filter = FTSS.filters.$compile(tagMap);

											FTSS.search.setValue(valMap);

											if (filter) {

												FTSS.tags = tagMap;
												$scope.filter = filter;

											}

										});

									}

									FTSS.search.$control.find('.item').addClass('processed');
									pending = false;

								} else {

									if ($scope.tagBox) {
										utils.updateSearch('');
										_fn.setLoaded();
									}

								}

							} else {

								$scope.cleanSlate = true;

							}

						}

					}

				};

				/**
				 * User feedback function, provides alerts, errors and general instructions to users
				 *
				 * @todo do something with this garbage code.....
				 * @param Object msg
				 */
				utils.$message = function (msg) {

					switch (msg) {

						case false:
							$scope.messages = {};
							return;

						case 'empty':
							utils.loading(false);
							msg = {
								'class'  : 'warning',
								'intro'  : 'Nothing Found!  ',
								'message': "There doesn't seem to be anything that matches your request.  Maybe you should add some more tags to your search."
							};
							break;

					}

					$scope.messages = {
						'newLine': msg.newLine || 'false',
						'class'  : msg.class || 'info',
						'intro'  : msg.intro || 'Quick Note:  ',
						'message': msg.message || ''
					};

				};

				/**
				 * Starts the loading indicators on navigation begin
				 */
				$scope.$on('$locationChangeStart', function () {

					utils.loading(true);

					if (FTSS.search) {
						$scope.noSearch = false;
					}

					$scope.pageLimit = 25;
					$scope.count = '-';
					$scope.overload = false;
					$scope.filter = false;
					$scope.sortBy = {};
					$scope.groupBy = {};
					$scope.searchText = {};


					FTSS.selectizeInstances = {};
					FTSS.pasteAction = false;

				});

				$scope.$on('$routeChangeSuccess', function () {

					var prefs = $routeParams.view ? JSON.parse(atob($routeParams.view)) : {};

					$scope.permaLink = $routeParams.link || '';

					$scope.sortBy.$ = prefs.s || '';
					$scope.groupBy.$ = prefs.g || '';
					$scope.searchText.$ = $scope.searchText.$ || prefs.S || '';
					$scope.showArchive = prefs.a || false;
					$scope.wellCollapse = prefs.c || false;

				});

				FTSS._fn = _fn;

			}
		]);


}()
	);