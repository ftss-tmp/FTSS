var app, FTSS = {};

(function () {

	"use strict";

	app = angular.module('FTSS', [
			'ngRoute', 'angular-selectize', 'ui.bootstrap'
		]).directive('onFinishRender', function ($timeout) {
			             return {
				             restrict: 'A',
				             link: function (scope, element, attr) {
					             if (scope.$last === true) {
						             $timeout(function () {
							             scope.$emit(attr.onFinishRender);
						             });
					             }
				             }
			             };
		             });

	var _internal, utils = {};

	_internal = {
		//'baseURL': 'https://sheppard.eis.aetc.af.mil/982TRG/373TRS/Det306/scheduling/_vti_bin/ListData.svc/',
		'baseURL': 'http://dev/_vti_bin/ListData.svc/',
		'userURL': 'http://dev/_layouts/userdisp.aspx?Force=True',
		'debug': true,
		'offline': true,
		'noCache': false
	};

	FTSS.utils = utils;

	/**
	 * Compresses received SharePoint data by removing unused metadata fields
	 *
	 * @param data
	 * @returns {{data: (Array), json: (XML|string|void)}}
	 */
	utils.reduce = function (data) {

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

		};

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

	};


	/**
	 * Converts SharePoint Date format into a the locale date string.
	 *
	 * This function uses a closure to store a cache of dates since runtime to reduce the (tiny) parsing overhead
	 */
	utils.fixDate = (function () {

		// Load the dateCache from localStorage or create a new one
		var dCache = JSON.parse(localStorage.getItem('FTSS_dateCache')) || {};

		// Add a function to _internal.unloadables to save current dateCache back to localStorage on exit
		/*
		 _internal.unloadables.push(function () {
		 localStorage['FTSS_dateCache'] = JSON.stringify(dCache);
		 });
		 */

		return function (date) {

			if (!dCache[date]) {

				dCache[date] = new Date(Number(date.replace(/[^\d.]/g, ''))).toLocaleDateString();

			}

			return dCache[date];

		}

	}());


	utils.log = (function () {

		var last = (new Date).getTime();

		return function (data, noStamp) {

			if (_internal.debug && console) {

				var stamp = (new Date).getTime();

				if (noStamp) {
					console.info(data);
				} else {
					console.log(stamp, data, stamp - last);
				}

				last = stamp;

			}

		}
	}());


	app.factory('SharePoint', function ($http) {

		var writeParams = function (opt) {

			// Join the params list if it is an array
			_.each(opt.params, function (param, key) {
				if (param instanceof Array) {
					opt.params[key] = param.join(',');
				}
			});

		};

		FTSS.SP = {

			'user': function () {

				return $http({
					             'method': 'GET',
					             'cache': true,
					             'url': _internal.userURL
				             }).then(function (response) {

					                     return {
						                     'id': parseInt(response.data.match(/userId\:[\d]*/)[0].split(':')[1], 10),
						                     'name': $(response.data.replace(/[ ]src=/g, ' data-src=')).find('a#zz15_Menu span').text()
					                     }

				                     });

			},

			'create': function (options) {

				return $http({
					             'method': 'POST',
					             'url': _internal.baseURL + options.source,
					             'data': options.params
				             });

			},

			'read': function (options) {

				var getData, checkCache;

				getData = function (opt) {

					writeParams(opt);

					if (options.params && _.isEmpty(options.params.$filter)) {
						delete options.params.$filter;
					}

					return $http({
						             'dataType': 'json',
						             'method': 'GET',
						             'url': _internal.baseURL + opt.source,
						             'params': opt.params || null
					             }).then(function (response) {

						                     var i = 0, data = response.data.d.results || response.data.d;

						                     try {

							                     data = _.reduce(data, function (o, v) {
								                     o[v.Id || i++] = v;
								                     return o;
							                     }, {});

						                     } catch (e) {
						                     }

						                     return data;

					                     });

				};


				checkCache = function (timeStamp, callback) {

					var link = 'SP_REST_Cache_' + options.source;

					if (localStorage.getItem(link + '_Stamp') === timeStamp) {

						callback(JSON.parse(localStorage[link + '_Data']));

					} else {

						options.cache = false;

						getData(options).then(function (response) {

							localStorage[link + '_Stamp'] = timeStamp;
							localStorage[link + '_Data'] = JSON.stringify(response);

							callback(response);

						});

					}

				};

				if (_internal.noCache) {
					options.cache = false;
				}

				if (!options.cache) {

					return getData(options);

				} else {

					return {

						'then': function (callback) {

							if (_internal.offline) {

								callback(JSON.parse(localStorage.getItem('SP_REST_Cache_' + options.source + '_Data')));

							} else {

								getData({

									        // The SharePoint list to check against
									        'source': options.source,

									        // Select only the highest last modified field
									        'params': {
										        '$select': 'Modified',
										        '$orderby': 'Modified desc',
										        '$top': '1'
									        }

								        }).then(function (data) {

									                checkCache(data[0].Modified, callback);

								                });

							}

						},
						'catch': function (callback) {
						},
						'finally': function (callback) {
						}

					}


				}

			}

		}

		return FTSS.SP;
	});


}());
/*

 function asdf(options) {

 console.time(options.source);

 // If caching is enabled, first run fn.cache()
 if (options.cache) {

 return _internal.fn.cache(options);

 } else {


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

 */
/*	// On success, log and trim the data and pass to options.success()
 .success(function (data) {



 })
 */
/*
 .then(function (response) {

 var data = response.data.d;

 console.timeEnd(options.source);
 utils.log(data);

 // Send the data through the reduce() function first
 if (options.success) {
 options.success(_internal.fn.reduce(data), options);
 }

 return
 [
 _internal.fn.reduce(data).data,
 options
 ];

 })

 */

/*
 * The AngularJS Router will be used to handle various page mappings and links to the HTML Partials for FTSS
 */
app.config(function ($routeProvider) {
	$routeProvider

		// route for the home page
		.when('/', {
			      templateUrl: 'partials/home.html',
			      controller: 'homeController'
		      })

		// route for the requests page
		.when('/scheduled/:link?', {
			      templateUrl: 'partials/scheduled.html',
			      controller: 'scheduledController'
		      })

		// route for the requests page
		.when('/requests/:link?', {
			      templateUrl: 'partials/requests.html',
			      controller: 'requestsController'
		      })

		// route for the requests page
		.when('/requests/:link?', {
			      templateUrl: 'partials/requests.html',
			      controller: 'requestsController'
		      })

		.otherwise({
			           redirectTo: '/'
		           })

});