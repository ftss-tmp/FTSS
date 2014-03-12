/*global _, $, angular, RawDeflate */
/**
 * FTSS Initializer
 *
 * @type {{}}
 */

var FTSS = {}, utils = {}, caches = {};

(function () {

	"use strict";

	var _internal;

	/**
	 * Creat the Angular module & declare dependencies
	 *
	 * @type {module}
	 */
	FTSS.ng = angular.module('FTSS',
	                         [
		                         'ngRoute',
		                         'ui.bootstrap',
		                         'monospaced.elastic',
		                         'partials',
	                             'angularFileUpload'
	                         ]);

	FTSS.ng.filter('html',
	               [
		               '$sce',
		               function ($sce) {
			               return function (text) {
				               return $sce.trustAsHtml(text);
			               };
		               }
	               ]);


	/*
	 * The AngularJS Router will be used to handle various page mappings and links to the HTML Partials for FTSS
	 */
	FTSS.ng.config(
		[
			'$routeProvider',
			function ($routeProvider) {

				var routes =
					[
						'home',
						'requirements',
						'scheduled',
						'requests',
						'instructors',
						'students',
						'catalog',
						'units',
						'error'
					];

				_.each(routes, function (route) {

					$routeProvider.when('/' + route + '/:link?', {

						'templateUrl': '/partials/' + route + '.html',
						'controller' : route + 'Controller'

					});

				});

				$routeProvider.otherwise({'redirectTo': '/error'});

			}
		]);

	_internal = {
		//'baseURL': 'https://sheppard.eis.aetc.af.mil/982TRG/373TRS/Det306/scheduling/_vti_bin/ListData.svc/',
		'baseURL': 'http://dev/_vti_bin/ListData.svc/',
		'userURL': 'http://dev/_layouts/userdisp.aspx?Force=True',
		//'pplURL' : 'https://cs3.eis.af.mil/_vti_bin/ListData.svc/UserInformationList',
		'pplURL' : 'http://dev/_vti_bin/ListData.svc/UserInformationList',
		'debug'  : true,
		'offline': false,
		'noCache': false
	};

	FTSS.utils = {};

	FTSS.peopleCache = {};

	/**
	 * Converts SharePoint Date format into a the locale date string.
	 *
	 * This function uses a closure to store a cache of dates since runtime to reduce the (tiny) parsing overhead
	 */
	FTSS.utils.fixDate = (function () {

		var dCache = {};

		return function (date, time) {

			time = time || false;

			if (!dCache[date + time]) {

				var tmp = new Date(Number(date.replace(/[^\d.]/g, '')));

				dCache[date + time] = time ? tmp.toLocaleString() : tmp.toLocaleDateString();

			}

			return dCache[date + time];

		};

	}());

	/**
	 * Generate a timestamp offset from 1 Jan 2014 (EPOCH was too large and causing SP to throw a 500 error) :-/
	 *
	 * @returns {number} timestamp
	 */
	FTSS.utils.getTimeStamp = function () {
		return Math.floor((new Date(new Date())).getTime() / 1000 - 1388552400);
	};

	FTSS.utils.log = (function () {

		var last = (new Date()).getTime();

		return function (data, noStamp) {

			if (_internal.debug && console) {

				var stamp = (new Date()).getTime();

				if (noStamp) {
					console.info(data);
				} else {
					console.log(stamp, data, stamp - last);
					console.trace();
				}

				last = stamp;

			}

		};

	}());


	FTSS.ng.factory('SharePoint',
	                [
		                '$http',
		                function ($http) {

			                FTSS.SP = {

				                'people': (function () {

					                return function (search) {

						                return $http({
							                             'dataType': 'json',
							                             'method'  : 'GET',
							                             'cache'   : true,
							                             'url'     : _internal.pplURL,
							                             'params'  : {
								                             '$select': 'Id,Name',
								                             '$filter': "startswith(Name,'" + search + "')",
								                             '$top'   : 5
							                             }
						                             })

							                .then(function (response) {

								                      var data = _.toArray(response.data.d);

								                      _(data).each(function (d) {

									                      FTSS.peopleCache[d.Id] = d.Name;

								                      });

								                      return data;

							                      });

					                };

				                }()),
				                'user'  : function ($scope, sField) {

					                var scopeField = sField || 'user';

					                try {

						                var data = localStorage.getItem('SP_REST_USER');

						                if (data) {

							                data = JSON.parse(data);

							                if (new Date().getTime() - data.updated < 2592000000) {

								                $scope[scopeField] = data;

							                }

						                }

					                } catch (e) {
					                }

					                return $http({
						                             'method': 'GET',
						                             'cache' : true,
						                             'url'   : _internal.userURL
					                             })

						                .then(function (response) {

							                      var data, html;

							                      data = {
								                      'id'     : parseInt(response.data.match(/_spuserid=(\d+);/i)[1], 10),
								                      'updated': new Date().getTime()
							                      };

							                      html = $(response.data.replace(/[ ]src=/g, ' data-src='));

							                      html.find('#SPFieldText').each(function () {

								                      var field1, field2;

								                      field1 = this.innerHTML.match(/FieldName\=\"(.*)\"/i)[1];
								                      field2 = this.innerHTML.match(/FieldInternalName\=\"(.*)\"/i)[1];

								                      data[field1] = data[field2] = this.innerText.trim();

							                      });

							                      localStorage.SP_REST_USER = JSON.stringify(data);

							                      $scope[scopeField] = data;

						                      });

				                },

				                'create': function (options) {

					                return $http({
						                             'method': 'POST',
						                             'url'   : _internal.baseURL + options.source,
						                             'data'  : options.params
					                             });

				                },

				                'update': function (scope) {

					                var meta = scope.__metadata;
					                delete scope.__metadata;

					                if (scope.cache) {
						                scope.Timestamp = FTSS.utils.getTimeStamp();
						                delete scope.cache;
					                }

					                _(scope).each(function (s, field) {

						                if (field.indexOf('_JSON') > 0) {
							                scope[field] = JSON.stringify(s);
						                }

					                });

					                return $http({
						                             'method' : 'POST',
						                             'url'    : meta.uri,
						                             'data'   : scope,
						                             'headers': {
							                             'If-Match'     : meta.etag,
							                             'X-HTTP-Method': 'MERGE'
						                             }
					                             });

				                },

				                'read': function (options) {

					                var getData, getCache, cacheString;

					                // If this request uses caching, then we need to create a localStorage key
					                cacheString = options.cache ?

					                              'SP_REST_Cache_' +

						                              // Include the SP List name
					                              options.source +

					                              JSON.stringify(options.params)

						                              // Remove all the junk from our JSON string of the model
						                              .replace(/[^\w]/gi, '_').replace(/(\_)\1+/g, '$1')

						                : '';

					                /**
					                 * getData $http wrapper, wraps the $http service with some SP-specific garbage
					                 *
					                 * @param opt Object
					                 * @returns {*|Promise}
					                 */
					                getData = function (opt) {

						                // Join the params list if it is an array
						                _(opt.params).each(function (param, key) {
							                if (param instanceof Array) {
								                opt.params[key] = param.join(',');
							                }
						                });

						                if (opt.params && _.isEmpty(opt.params.$filter)) {
							                delete opt.params.$filter;
						                }

						                return $http({
							                             'dataType': 'json',
							                             'method'  : 'GET',
							                             'url'     : _internal.baseURL + opt.source,
							                             'params'  : opt.params || null
						                             })

							                .then(function (response) {

								                      var i = 0,

									                      data = response.data.d.results || response.data.d,

									                      decoder,

									                      json =
										                      [
										                      ];

								                      if (data.length) {

									                      _.chain(data[0])

										                      .keys()

										                      .each(function (f) {
											                            if (f.indexOf('_JSON') > 1) {
												                            json.push(f);
											                            }
										                            });

									                      if (json.length) {

										                      decoder = function (v) {

											                      _(json).each(function (field) {

												                      v[field] = JSON.parse(v[field]);

											                      });

											                      return v;

										                      };

									                      }

									                      try {

										                      data = _.reduce(data, function (o, v) {
											                      o[v.Id || i++] = json ? decoder(v) : v;
											                      return o;
										                      }, {});

									                      } catch (e) {
									                      }

								                      }

								                      return data;

							                      });

					                };

					                /**
					                 * getCache custom cache resolver/awesomeness generator
					                 * This will attempt to read localStorage for any previously cached data and merge
					                 * updates with the cache.
					                 *
					                 * YOU MUST HAVE A SP FIELD NUMBER FIELD NAMES "Timestamp" FOR THIS TO WORK
					                 *
					                 * The Modified field WOULD have been perfect if SP oData requests filtered times properly :-/
					                 *
					                 * @param callback
					                 */
					                getCache = function (callback) {

						                var cachedData, timestamp, opts;

						                // Load the cached data, if it doesn't actually exist we'll deal with it later on
						                cachedData = localStorage.getItem(cacheString + 'Data');

						                // Offline enabled and the item exists, just return it without checking SP
						                if (_internal.offline && cachedData) {

							                callback(JSON.parse(RawDeflate.inflate(cachedData)));

						                } else {

							                // Check to see if localStorage already has a cache of this data
							                timestamp = localStorage.getItem(cacheString + 'Stamp') || false;

							                // If we already have cached data we need to add the timestamp to the filter
							                if (timestamp) {

								                // Lazy man's deep object clone
								                opts = JSON.parse(JSON.stringify(options));

								                // Start our new filter with the timestamp lookup--just in case SP is being dumb about SQL optimization
								                opts.params.$filter = '(Timestamp gt ' + timestamp + ')' +  (opts.params.$filter ? ' and ' + opts.params.$filter : '')

							                }

							                // Set a new timestamp before our network call (so we don't miss anything)
							                timestamp = FTSS.utils.getTimeStamp();

							                // Call getData() with the custom opts or options as applicable
							                getData(opts || options)

								                .then(function (data) {

									                      // There are a lot of ways to slice this, but this is the easiest and most reliable
									                      try {
										                      cachedData = JSON.parse(RawDeflate.inflate(cachedData));
									                      } catch (e) {
										                      cachedData = {};
									                      }

									                      // There was some data so we can add that to our cache and update everything
									                      if (data !== {}) {

										                      try {

											                      // Merge our updates with the cache
											                      _(data).each(function (row) {
												                      cachedData[row.Id] = row;
											                      });

											                      // Convert new cached object to JSON and compress to UTF16 (for IE compatibility)
											                      localStorage[cacheString + 'Data'] = RawDeflate.deflate(JSON.stringify(cachedData));

											                      // Set the timestamp AFTER updating the cache (just in case something goes wrong)
											                      localStorage[cacheString + 'Stamp'] = timestamp;

											                      // Add a helpful little updated property to our response (but only after caching without it)
											                      _(data).each(function (row) {
												                      cachedData[row.Id].updated = true;
											                      });

										                      } catch (e) {


										                      }

									                      }

									                      // All done, do the callback
									                      callback(cachedData);

								                      });

						                }

					                };

					                // If caching is disabled for the service, then override the request
					                if (_internal.noCache) {
						                options.cache = false;
					                }

					                // Return the getData or getCache promises
					                return !options.cache ?

						                // Return getData()'s $http promises, no caching
						                   getData(options) :

						                // Return getCache()'s custom promises, caching is enabled
						                   {

							                   'then'   : getCache,
							                   'catch'  : function () {
							                   },
							                   'finally': function () {
							                   }

						                   };
				                }

			                };

			                return FTSS.SP;
		                }
	                ]);


}());