var app, FTSS;

app = angular.module('FTSS',
		[
			'ngRoute',
			'angular-selectize',
			'ui.bootstrap',
		    'smartTable.table'
		])
	.directive('onFinishRender', function ($timeout) {
		return {
			restrict: 'A',
			link: function (scope, element, attr) {
				if (scope.$last === true) {
					$timeout(function () {
						scope.$emit(attr.onFinishRender);
					});
				}
			}
		}
	});

/*
 * The AngularJS Router will be used to handle various page mappings and links to the HTML Partials for FTSS
 */
app.config(function ($routeProvider) {
	$routeProvider

		// route for the home page
		.when('/', {
			templateUrl: 'partials/home.html'
		})

		// route for the requests page
		.when('/scheduled', {
			templateUrl: 'partials/scheduled.html',
			controller: 'scheduledController'
		})

		// route for the requests page
		.when('/requests', {
			templateUrl: 'partials/requests.html',
			controller: 'requestsController'
		})

		// route for the requests page
		.when('/requests', {
			templateUrl: 'partials/requests.html',
			controller: 'requestsController'
		})

		.otherwise({
			redirectTo: '/'
		})

});

FTSS = (function ($) {

	var _internal = {

		// Load some data locally for development purposes
		'offline': true,

		// Set to enable various console outputs and breakpoints for debugging
		'debug': true,

		// The URL used for oData REST queries (ListData.svc)
		'baseURL': 'https://sheppard.eis.aetc.af.mil/982TRG/373TRS/Det306/scheduling/_vti_bin/ListData.svc/',

		// Collection of actions to be done before the page closes
		'unloadables':
			[
			],

		// A collection of private functions used by the library
		'fn': {

			/**
			 * Compresses received SharePoint data by removing unused metadata fields
			 *
			 * @param data
			 * @returns {{data: (Array), json: (XML|string|void)}}
			 */
			'reduce': function (data) {

				var translated, reduced, clean;

				// Some queries seem to return data.results while others do not
				reduced = data.results || data;

				// This function will recursively delete the __metadata property from collections
				clean = function (item) {

					try {

						delete item['__metadata'];

					} catch (e) {

					}

					if (_.isObject(item)) {

						_.each(item, clean);

					}

				}

				// Call the previously defined clean() function on the dataset
				clean(reduced);

				try {

					// In order to speed up cache lookups, this will map the item.Id from SharePoint to the the key for each object
					if (reduced[0].Id) {

						translated = _.reduce(reduced, function (o, v) {
							o[v.Id] = v;
							return o;
						}, {});

					} else {
						translated = reduced;
					}

				} catch (e) {
					translated = reduced;
				}

				// Return the reduced data/JSON data
				return {
					'data': translated,
					'json': JSON.stringify(translated).replace(_internal.baseURL, '')
				}

			},

			/**
			 * Uses the modified field from a list to act as a timestamp to cache the entire list
			 * @param options
			 */
			'cache': function (options) {

				// First, disable caching on future requests (to prevent infinite loops)
				options.cache = false;

				var success = function (timeStamp) {

					var link = 'FTSS_Cache_' + options.source;

					if (_internal.offline ||
						[
							link + '_Stamp'
						] && localStorage[link + '_Stamp'] === timeStamp.json) {

						var data = JSON.parse(localStorage[link + '_Data']);

						return options.success({
							'data': data,
							'json': localStorage[link + '_Data']
						}, options);

					} else {

						var finalSuccess = options.success;

						options.success = function (finalData) {

							finalSuccess(finalData, options);

							localStorage[link + '_Stamp'] = timeStamp.json;
							localStorage[link + '_Data'] = finalData.json;

						};

						return _api.read(options);

					}

					//return options.http;

				}

				if (_internal.offline) {
					return success();
				}

				// Create a SharePoint query to get the last modified item's timestamp of a given list (options.source)
				return _api.read({

					// The SharePoint list to check against
					'source': options.source,

					// Select only the highest last modified field
					'params': {
						'$select': 'Modified',
						'$orderby': 'Modified desc',
						'$top': '1'
					},

					//  Process the received timestamp
					'success': success,

					'failure': options.failure
				});

			}

		}
	};

	var _api = {

		/**
		 * Iterates through _internal.unloadables to handle any last-minute cleanup actions before the page closes
		 */
		'exit': function () {

			_.each(_internal.unloadables, function (item) {

				try {
					item.apply();
				} catch (e) {
				}

			});

		},

		'log': function (data) {

			if (_internal.debug) {
				console.log((new Date).getTime(), data);
				//console.trace();
			}

		},

		/**
		 * Converts SharePoint Date format into a the locale date string.
		 *
		 * This function uses a closure to store a cache of dates since runtime to reduce the (tiny) parsing overhead
		 */
		'fixDate': (function () {

			// Load the dateCache from localStorage or create a new one
			var dCache = JSON.parse(localStorage.getItem('FTSS_dateCache')) || {};

			// Add a function to _internal.unloadables to save current dateCache back to localStorage on exit
			_internal.unloadables.push(function () {
				localStorage['FTSS_dateCache'] = JSON.stringify(dCache);
			});

			return function (date) {

				if (!dCache[date]) {

					dCache[date] = new Date(Number(date.replace(/[^\d.]/g, ''))).toLocaleDateString();

				}

				return dCache[date];

			}

		}()),

		/**
		 * Reads data using the SharePoint REST API with caching/debugging if enabled and after data reduction
		 * @param options
		 */
		'read': function (options) {

			console.time(options.source);

			// If caching is enabled, first run fn.cache()
			if (options.cache) {

				return _internal.fn.cache(options);

			} else {

				// Join the params list if it is an array
				_.each(options.params, function (param, key) {
					if (param instanceof Array) {
						options.params[key] = param.join(',');
					}
				});

				// If options.failure() is not defined, just call _api.log() with the details
				options.failure = options.failure || function (req) {
					_api.log(
						[
							'Failure:',
							this.type,
							'(' + req.status + ')',
							this.url
						].join(' '));
					_api.log(
						[
							options.source,
							options.params
						]);
				};

				// Use AngularJS $http() if passed; otherwise, just use jQuery's $.ajax()
				options.http = options.http || $.ajax;

				//  Return the options.http() function for AngularJS promises to work properly
				return options.http({
					'method': 'GET',
					'dataType': 'json',
					'url': _internal.baseURL + options.source,
					'data': options.params || null,
					'params': options.params || null
				})

					// On success, log and trim the data and pass to options.success()
					.success(function (data) {

						data = data.d;

						console.timeEnd(options.source);
						_api.log(data);

						// Send the data through the reduce() function first
						options.success(_internal.fn.reduce(data), options);

					})

					// Otherwise, send an error
					.error(options.failure);

			}

		}

	};

	return _api;

}(jQuery));

window.onbeforeunload = FTSS.exit;