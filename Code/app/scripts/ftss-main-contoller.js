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
			function ($scope, $location, SharePoint, $routeParams, $timeout) {

				FTSS.loaded = function () {
					utils.loading(false);
					$scope.loaded = true;
				};

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
							utils.loading(false);
							msg = {
								'class'  : 'warning',
								'intro'  : 'Nothing Found!  ',
								'message': "There doesn't seem to be anything that matches your request.  Maybe you should add some more tags to your search."
							};
							break;

						case 'ready':
							utils.loading(false);
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

				utils.$initPage = function () {

					if ($scope.loaded) {

						FTSS.filters.$refresh();

						if (FTSS.pending) {

							(function () {

								var valMap, tagMap, customFilters;

								valMap =
								[
								];
								tagMap = {};

								customFilters = FTSS.filters.route();

								if (FTSS.pending.special) {

									utils.updateSearch(function () {

										$scope.noSearch = true;
										FTSS.search.disable();
										FTSS.search.addOption({
											                      'id'      : 'custom:' + FTSS.pending.special,
											                      'label'   : FTSS.pending.text || 'Special Lookup',
											                      'optgroup': 'SMART FILTERS'
										                      });
										FTSS.search.setValue('custom:' + FTSS.pending.special);
										$scope.filter = FTSS.pending.special;
										$scope.permaLink = '';

									});

								} else {

									_.each(FTSS.pending, function (filterItems, filterGroup) {

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

												tagMap[filterGroup] = tagMap[filterGroup] ||
												                      [
												                      ];
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

								FTSS.pending = false;

							}());

						} else {

							utils.updateSearch('');
							utils.$message('ready');

						}

					}

				};

				utils.permaLink = function (tag, pg) {

					$scope.permaLink = LZString.compressToBase64(JSON.stringify(tag));
					$timeout(function () {

						$scope.permaLink = utils.compress(JSON.stringify(tag));

						$location.path(
							[
								'',
								pg || FTSS.page(),
								$scope.permaLink
							].join('/'));

					});

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
					FTSS.search.clear();
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

					if (FTSS.search) {
						$scope.noSearch = false;
					}

					(FTSS.searchWatch || Function)();

					$scope.pageLimit = 25;
					$scope.count = '-';
					$scope.overload = false;
					$scope.filter = false;
					$scope.sortBy = {};
					$scope.groupBy = {};
					$scope.searchText = $scope.searchText || {};
					FTSS.selectizeInstances = {};
					FTSS.pasteAction = false;

					utils.loading(true);

				});

				$scope.$on('$routeChangeSuccess', function () {

					if ($routeParams.link) {

						$scope.permaLink = $routeParams.link;

						FTSS.pending = JSON.parse(LZString.decompressFromBase64($scope.permaLink));

					}

					utils.$initPage();

				});

			}
		]);


}()
	);