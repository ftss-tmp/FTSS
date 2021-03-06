/*global _, FTSS, angular */

(function () {

	"use strict";

	var filters = {},

	    routes = {
		    'scheduled'   : [
			    {'q': "Start ge datetime'TODAY'", 'label': 'Not Started'},
			    {'q': "End le datetime'TODAY'", 'label': 'Completed'},
			    {'q': "(Start le datetime'TODAY' and End ge datetime'TODAY')", 'label': 'In Progress'}
		    ],
		    'requests'    : [
			    {'q': 'Status gt 1', 'label': 'Completed Requests'},
			    {'q': 'Status eq 1', 'label': 'Pending Requests'},
			    {'q': 'Status eq 2', 'label': 'Approved Requests'},
			    {'q': 'Status eq 3', 'label': 'Denied Requests'}
		    ],
		    'requirements': [
			    {'q': '', 'label': ''}
		    ],
		    'backlog': [
			    {'q': '', 'label': ''}
		    ]

	    },

	    filterMaps = {
		    'scheduled'   : {
			    'u': 'UnitId',
			    'm': "Course/MDS",
			    'a': "Course/AFSC",
			    'i': 'InstructorId',
			    'c': 'CourseId'
		    },
		    'requests'    : {
			    'u': 'Scheduled/UnitId',
			    'm': "Scheduled/Course/MDS",
			    'a': "Scheduled/Course/AFSC",
			    'i': 'Scheduled/InstructorId',
			    'c': 'Scheduled/CourseId'
		    },
		    'requirements': {
			    'h': 'HostId',
			    'u': 'UnitId'
		    },
		    'backlog'     : {
			    'h': 'HostId'
		    }
	    },

	    max = {
		    'backlog': 1,
		    'requirements': 1
	    };

	/**
	 *  This is the app-wide collection of custom filters used by the search box
	 */
	filters.route = (function () {

		var today, routeWrap = {};

		// Store today's value throughout the app's lifecycle as it will be used numerous times
		today = angular.injector(
			[
				"ng"
			]).get("dateFilter")(new Date(), 'yyyy-MM-dd');

		_(routes).each(function (filter, name) {

			var route = routeWrap[name] =
			            [
			            ];

			_(filter).each(function (f, id) {

				f.id = 'q:' + name.charAt(0) + id;
				f.q = f.q.replace(/TODAY/g, today);
				f.optgroup = 'SMART FILTERS';

				route.push(f);

			});

		});

		return function (all) {

			return all ? _.flatten(routeWrap) : routeWrap[FTSS._fn.getPage()];

		};

	}());

	filters.map = function () {

		return filterMaps[FTSS._fn.getPage()];

	};

	/**
	 * When the view is updated, this will remove custom filters and then add the custom filters for this view
	 * as defined by filters.route().
	 */
	filters.$refresh = (function () {

		var options, userOptions;

		// return the real function for filters.$refresh now that we have today cached in a closure
		return function () {

			var page = FTSS._fn.getPage();

			// create a cloned backup of our options & userOptions before we change them up
			options = options || _.clone(FTSS.search.options);
			userOptions = userOptions || _.clone(FTSS.search.userOptions);

			// empty the options--how wild is that!?@!
			FTSS.search.options = {};
			FTSS.search.userOptions = {};

			// Add our custom searches back for this page
			_.each(filters.route(), function (filter) {

				FTSS.search.addOption(filter);

			});

			// Temporary list of valid filter keys for this page
			var validFilters = _.keys(filterMaps[page]);

			// Add everything else back in that is a valid filter for this page
			_(userOptions).each(function (opt, key) {

				if (_.contains(validFilters, key.charAt(0))) {
					FTSS.search.options[key] = _.clone(options[key]);
					FTSS.search.userOptions[key] = _.clone(userOptions[key]);
				}

			});

			var settings = FTSS.search.settings;

			settings.maxItems = max[page] || 20;
			settings.mode = (settings.maxItems === 1) ? 'single' : 'multi';

			// Need to redraw selectize with our updated options!
			FTSS.search.refreshOptions(false);

		};

	}());

	/**
	 * Filter Compile Function
	 *
	 * Converts user-selected tags{} into the SharePoint friendly filter query
	 *
	 * @param tags Object
	 * @returns {*}
	 */
	filters.$compile = function (tags) {

		try {

			var maps = filters.map(), filter =
				[
				];

			if (tags) {

				if (tags.q) {
					filter.push('(' + tags.q.join(' or ') + ')');
				}

				_.each(maps, function (map, key) {

					var isString = (key === 'm' || key === 'a'), fTemp =
						[
						];

					_.each(tags[key], function (tag) {

						if (isString) {

							fTemp.push(
								[
									map,
									" eq '",
									tag.trim(),
									"'"
								].join(''));

						} else {

							fTemp.push(
								[
									map,
									'eq',
									tag
								].join(' '));

						}

					});

					if (fTemp.length) {

						filter.push('(' + fTemp.join(' or ') + ')');

					}

				});

				filter = filter.length > 0 ? filter.join(' and ') : '';

				return filter;

			}

		} catch (e) {

			return 'TAG COMPILATION ERROR';

		}

	};

	FTSS.filters = filters;

}());