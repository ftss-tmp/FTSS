/*global _, $, angular, LZString */
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
		                         'angular-selectize',
		                         'ui.bootstrap',
		                         'monospaced.elastic',
		                         'partials'
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
				}

				last = stamp;

			}

		};

	}());


	FTSS.ng.factory('SharePoint',
	                [
		                '$http',
		                function ($http) {

			                var writeParams = function (opt) {

				                // Join the params list if it is an array
				                _.each(opt.params, function (param, key) {
					                if (param instanceof Array) {
						                opt.params[key] = param.join(',');
					                }
				                });

			                };

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

								                      return _.toArray(response.data.d);

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

						                if (field.indexOf('_JSON')) {
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

					                var getData, cacheString;

					                cacheString = options.cache ? 'SP_REST_Cache_' + options.source + JSON.stringify(options.params).replace(/[^\w]/gi, '_').replace(/(\_)\1+/g, '$1') : '';

					                getData = function (opt) {

						                writeParams(opt);

						                if (options.params && _.isEmpty(options.params.$filter)) {
							                delete options.params.$filter;
						                }

						                return $http({
							                             'dataType': 'json',
							                             'method'  : 'GET',
							                             'url'     : _internal.baseURL + opt.source,
							                             'params'  : opt.params || null
						                             })

							                .then(function (response) {

								                      var i = 0, data = response.data.d.results || response.data.d, decoder, json =
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

					                if (_internal.noCache) {
						                options.cache = false;
					                }

					                if (!options.cache) {

						                return getData(options);

					                } else {

						                return {

							                'then'   : function (callback) {

								                var item, filter, timestamp, opts;

								                item = localStorage.getItem(cacheString + 'Data');

								                if (_internal.offline && item) {

									                callback(JSON.parse(LZString.decompressFromUTF16(item)));

								                } else {

									                timestamp = localStorage.getItem(cacheString + 'Stamp') || false;

									                if (timestamp) {

										                opts = JSON.parse(JSON.stringify(options));

										                filter = "(Timestamp gt " + timestamp + ')';

										                opts.params.$filter = filter + (opts.params.$filter ? ' and ' + opts.params.$filter : '');

									                }

									                timestamp = FTSS.utils.getTimeStamp();

									                getData(opts || options)

										                .then(function (data) {

											                      var cached = localStorage[cacheString + 'Data'];

											                      try {
												                      cached = JSON.parse(LZString.decompressFromUTF16(cached));
											                      } catch (e) {
												                      cached = {};
											                      }

											                      if (data !== {}) {

												                      _(data).each(function (row) {
													                      cached[row.Id] = row;
												                      });

												                      // Set our timestamp back 5 minutes from GMT to handle small time inaccuracies
												                      localStorage[cacheString + 'Stamp'] = timestamp;

												                      // Convert new cached object to JSON and compress to UTF16 (for IE compatibility)
												                      localStorage[cacheString + 'Data'] = LZString.compressToUTF16(JSON.stringify(cached));

												                      if (timestamp) {

													                      _(data).each(function (row) {
														                      cached[row.Id].updated = true;
													                      });

												                      }

											                      }

											                      callback(cached);

										                      });

								                }

							                },
							                'catch'  : function () {
							                },
							                'finally': function () {
							                }

						                };


					                }

				                }

			                };

			                return FTSS.SP;
		                }
	                ]);


}());