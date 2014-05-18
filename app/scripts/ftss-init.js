/*global _, angular, LOG, FTSS */
/**
 * FTSS Initializer
 *
 */

var LOG;

(function () {

	"use strict";

	/**
	 * Create the Angular module & declare dependencies
	 *
	 * @type {module}
	 */
	FTSS.ng = angular.module(
		'FTSS',
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
					'autoclose' : true
				});

			}
		]);

	FTSS.people = {};
	FTSS.utils = {};

	FTSS.prefs = localStorage.FTSS_prefs ? JSON.parse(localStorage.FTSS_prefs) : {

		'limit': 35,

		'animate': true,

		'tooltips': true,

		'page': true,

		'hover': true

	};

	LOG = FTSS.utils.log = (function () {

		var last = (new Date()).getTime();

		return function (data, noStamp) {

			if (console) {

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