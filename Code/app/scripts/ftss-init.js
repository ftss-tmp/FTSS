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
		                         'ngSharePoint',
		                         'mgcrea.ngStrap',
		                         'monospaced.elastic',
		                         'partials',
		                         'angularFileUpload'
	                         ]);

	/*
	 * The AngularJS Router will be used to handle various page mappings and links to the HTML Partials for FTSS
	 */
	FTSS.ng.config(
		[
			'$routeProvider',
			'$modalProvider',
			function ($routeProvider, $modalProvider) {

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

				angular.extend($modalProvider.defaults, {
					'container': 'body',
					'animation': 'am-fade-and-scale'
				});

			}
		]);

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

	FTSS.utils.log = (function () {

		var last = (new Date()).getTime();

		return function (data, noStamp) {

			if (_internal.debug && console) {

				var stamp = (new Date()).getTime();

				if (noStamp) {
					console.info(data);
				} else {
					console.log(stamp, data, stamp - last);
					//console.trace();
				}

				last = stamp;

			}

		};

	}());

}());