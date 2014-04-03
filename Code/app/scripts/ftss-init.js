/*global _, angular, LOG, FTSS */
/**
 * FTSS Initializer
 *
 */

var LOG;

(function () {

	"use strict";

	var debug = true;

	/**
	 * Create the Angular module & declare dependencies
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
		                         'angularFileUpload',
		                         'ngAnimate',
		                         'ngSanitize'
	                         ]);

	/*
	 * The AngularJS Router will be used to handle various page mappings and links to the HTML Partials for FTSS
	 */
	FTSS.ng.config(
		[
			'$routeProvider',
			'$modalProvider',
			'$datepickerProvider',
			'$locationProvider',
			function ($routeProvider, $modalProvider, $datepickerProvider, $locationProvider) {

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
						    'backlog',
						    'hosts'
					    ];

				_.each(routes, function (route) {

					$routeProvider.when('/' + route + '/:link?/:view?', {

						'templateUrl': '/partials/' + route + '.html',
						'controller' : route + 'Controller'

					});

				});

				$routeProvider.otherwise({'redirectTo': '/home'});

				$locationProvider.html5Mode(false);

				angular.extend($modalProvider.defaults, {
					'container': 'body',
					'animation': 'am-fade-and-scale'
				});

				angular.extend($datepickerProvider.defaults, {
					'dateFormat': 'd MMM yyyy',
					'startWeek' : 1,
					'autoclose' : true,
					'animation' : false
				});

			}
		]);


	/**
	 * Description:
	 *     removes white space from text. useful for html values that cannot have spaces
	 * Usage:
	 *   {{some_text | nospace}}
	 */
	FTSS.ng.filter('nospace', function () {
		return function (value) {
			return (!value) ? '' : value.replace(/ /g, '');
		};
	})

	/**
	 * Quick filter to return the first name of a person (AF GAL format)
	 */
	FTSS.ng.filter('firstName', function () {
		return function (input) {
			var match = input && input.match(/[a-z]+,\s([a-z]+)/i);
			return match && match[1] || input || 'John or Jane Doe';
		};
	});

	FTSS.ng.filter('courseNumber', function () {
		return function (input) {
			return input || 'Some Random Course?';
		};
	});

	FTSS.people = {};
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

	LOG = FTSS.utils.log = (function () {

		var last = (new Date()).getTime();

		return function (data, noStamp) {

			if (debug && console) {

				var stamp = (new Date()).getTime();

				if (noStamp) {
					console.dir(data);
				} else {
					console.log(stamp);
					console.dir(data);
					console.info(stamp - last);
				}

				last = stamp;

			}

		};

	}());

}());