/*global utils, FTSS, _, angular */

/**
 * Performs nested property lookups without eval or switch(e.length), removed try {} catch(){}
 * due to performance considerations.  Uses a short-circuit for invalid properties & returns false.
 *
 * data = {
 *   a1: { b1: "hello" },
 *	 a2: { b2: { c2: "world" } }
 *	}
 *
 * deepRead(data, "a1.b1") => "hello"
 *
 * deepRead(data, "a2.b2.c2") => "world"
 *
 * deepRead(data, "a1.b2") => false
 *
 * deepRead(data, "a1.b2.c2.any.random.number.of.non-existant.properties") => false
 *
 * @param {object} data - The collection to iterate over
 * @param {string} expression - The string expression to evaluate
 *
 * @return {various | boolean} retVal - Returns the found property or false if not found
 *
 */
utils.deepRead = function (data, expression) {

	// Cache a copy of the split expression, then set to exp
	var exp = (expression || '').split('.'), retVal;

	// Recursively read the object using a do-while loop, uses short-circuit for invalid properties
	do {
		retVal = (retVal || data || {})[exp.shift()] || false;
	} while (retVal !== false && exp.length);

	// Return our retVal or false if not found
	return retVal || false;

};

/**
 *  Generates a date offset UUID for our photo
 *  http://stackoverflow.com/a/8809472/467373
 */
utils.generateUUID = function () {
	var d = new Date().getTime();
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = (d + Math.random() * 16) % 16 | 0;
		d = Math.floor(d / 16);
		return (c === 'x' ? r : (r & 0x7 | 0x8)).toString(16);
	});
	return uuid;
};


/**
 * A simple watch destoyer for when we know we don't need all those dirty checks
 */
utils.ignore = (function () {

	var timeout;

	FTSS.ng.run(
		['$timeout',
		 function ($timeout) {
			 timeout = $timeout;
		 }
		]
	);

	return function (scope) {

		timeout(function () {
			scope.$$watchers = [];
		});

	};

}());

utils.masterReset = function () {

	try {

		window.localStorage.clear();
		window.indexedDB.deleteDatabase('FTSS');

	} catch (e) {

	}

	location.reload();

};

utils.watchCount = function (log) {
	var root = angular.element(document.getElementsByTagName('body'));
	var watchers = [];

	var f = function (element) {
		if (element.data().hasOwnProperty('$scope')) {
			angular.forEach(element.data().$scope.$$watchers, function (watcher) {
				log && console.log(watcher.last);
				watchers.push(watcher);
			});
		}

		angular.forEach(element.children(), function (childElement) {
			f(angular.element(childElement));
		});
	};

	f(root);

	return watchers.length;
};

/**
 * Performs highlighting of matched search tags to allow users to see exactly what search terms had hits
 *
 * @param {Array} [data] - the data returned from SharePoint.read()
 */
utils.tagHighlight = function (data) {

	try {

		var test, map;

		test = [
		];
		map = FTSS.filters.map();

		// First, generate the array of tags to test against
		_(FTSS.tags).each(function (tag, key) {

			_(tag).each(function (t) {

				if (key !== 'custom') {

					if (map[key]) {

						test.push({
							          id       : key + ':' + t,
							          testField: map[key].split('/').join('.'),
							          testValue: t
						          });

					}

				}

			});


		});

		// Perform tests against all data using the test[] already created, _.all() stops once all tags are marked (if applicable)
		_(data).all(function (req) {

			// Must use _.each() in case a data item matches multiple tags
			_(test).each(function (t, k) {

				/**
				 *  If field and testValue match, add Matched class and delete test-- we shouldn't touch the DOM
				 *  from a controller but for performance reasons, this is much faster than relying on
				 *  AngularJS.
				 */
				if (utils.deepRead(req, t.testField) === t.testValue) {

					FTSS.search.$control.find('.item[data-value="' + t.id + '"]').addClass('matched');
					delete test[k];

				}

			});

			// Always test to ensure there are still tags to test against, otherwise exit the loop
			return (test.length > 0);

		});

	} catch (e) {
		FTSS.utils.log(e);
	}

};

/**
 * Wrapper to handle search box value updates without triggering the onChange() event
 *
 * @param {function|string} [action] - calls the function or sets search to the given value if string
 */
utils.updateSearch = function (action) {

	FTSS.updating = true;

	if (typeof action === 'string') {

		FTSS.search.setValue(action);

	} else {

		action();

	}

	FTSS.updating = false;

};

/**
 * Handles the page loading indicators (mouse & spinner)
 *
 * @param loading
 */
utils.loading = (function () {

	var body = $('#content')[0], loadingState;

	return function (loading) {

		setTimeout(function () {

			if (loadingState !== loading) {

				loadingState = loading;

				document.body.style.cursor = body.className = loading ? 'wait' : '';
				FTSS.search && FTSS.search.close();

			}

		});

	};

}());

utils.distanceCalc = function (start, end) {

	if (start && end) {

		start = JSON.parse('[' + start + ']');
		end = JSON.parse('[' + end + ']');

		var deg2rad = function (deg) {
			return deg * (Math.PI / 180);
		};

		var R = 3963.1676; // Radius of the earth in miles
		var dLat = deg2rad(end[0] - start[0]);  // deg2rad below
		var dLon = deg2rad(end[1] - start[1]);
		var a = Math.sin(dLat / 2) *
		        Math.sin(dLat / 2) +
		        Math.cos(deg2rad(start[0])) *
		        Math.cos(deg2rad(end[0])) *
		        Math.sin(dLon / 2) *
		        Math.sin(dLon / 2);
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

		return Math.ceil(R * c); // Distance in miles

	}
};

/**
 * Our app-wide alert notification system, this will eventually replace all the other message garbage polluting MainController
 */
utils.alert = (function () {

	var $alert, builder;

	FTSS.ng.run(
		['$alert',
		 function (alert) {
			 $alert = alert;
		 }
		]
	);

	builder = function (opts) {

		$alert(_.defaults(opts || {}, {
			'title'    : 'Record Updated!',
			'content'  : 'Your changes were saved successfully.',
			'placement': 'top-right',
			'type'     : 'success',
			'duration' : 3,
			'show'     : true
		}));

	};

	return {

		'create': function () {
			builder({'title': 'Record Created!'});
		},

		'update': builder,

		'error': function (err) {

			FTSS.utils.log(err);

			builder({
						'type': 'danger',
				        'title'   : 'Sorry, something went wrong!',
				        'content'  : "Please refresh the page and try again.",
				        'duration': 10
			        });
		}
	};

}());