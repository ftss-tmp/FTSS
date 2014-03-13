/*global utils, FTSS, _, RawDeflate */

/**
 * Misc utilities
 *
 */
utils.deepRead = (function () {

	var dict = {};

	return function (data, exp) {

		var e = dict[exp] = dict[exp] || exp.split('.');

		switch (e.length) {

			case 1:
				return data[e[0]];

			case 2:
				return data[e[0]][e[1]];

			case 3:
				return data[e[0]][e[1]][e[2]];

			default:
				return data;

		}

	};

}());


utils.modal = (function () {

	var modal;

	FTSS.ng.run(
		[
			'$modal',
			function ($modal) {
				modal = $modal;
			}
		]);

	return function (opts) {

		modal

			.open({
				      'backdrop'   : 'static',
				      'keyboard'   : true,
				      'templateUrl': opts.templateUrl,
				      'controller' : opts.controller
			      });

	};

}());


/**
 * Performs highlighting of matched search tags to allow users to see exactly what search terms had hits
 *
 * @param {Array} [data] - the data returned from SharePoint.read()
 */
utils.tagHighlight = function (data) {

	try {

		var test, map;

		test =
		[
		];
		map = FTSS.filters.map();

		// First, generate the array of tags to test against
		_(FTSS.tags).each(function (tag, key) {

			_(tag).each(function (t) {

				if (key !== 'custom') {

					if (map[key]) {

						test.push({
							          id       : key + ':' + t,
							          testField: map[key].split('/'),
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

				var field;

				// In order to handle nested values (up to 2), switch on the t.testField.length
				switch (t.testField.length) {

					case 1:
						field = req[t.testField[0]];
						break;

					case 2:
						field = req[t.testField[0]][t.testField[1]];
						break;

					default:
						field = req[t.testField[0]][t.testField[1]][t.testField[2]];

				}

				/**
				 *  If field and testValue match, add Matched class and delete test-- we shouldn't touch the DOM
				 *  from a controller but for performance reasons, this is much faster than relying on
				 *  AngularJS.
				 */
				if (field === t.testValue) {

					FTSS.search.$control.find('.item[data-value="' + t.id + '"]').addClass('matched');
					delete test[k];

				}

			});

			// Always test to ensure there are still tags to test against, otherwise exit the loop
			return (test.length > 0);

		});

	} catch (e) {
		debugger;
		console.log(e);
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

	var loader = $('#content')[0], loadingState;

	return function (loading) {

		try {

			utils.$message(false);

			if (loadingState !== loading) {

				if (loading) {
					document.body.style.cursor = loader.className = 'wait';
					if (FTSS.search) {
						FTSS.search.close();
						FTSS.search.blur();
					}
				} else {
					document.body.style.cursor = loader.className = '';
				}

				loadingState = loading;

			}

		} catch (e) {

		}

	};

}());


/**
 *
 * @param req
 */
utils.$ajaxFailure = function (req) {
	utils.$message({
		               'newLine': true,
		               'class'  : 'danger',
		               'intro'  : 'Hmmm, something went wrong:',
		               'message':
			               [
				               this.type,
				               '(' + req.status + ')',
				               this.url
			               ].join(' ')
	               });
};


utils.deflate64 = function (str) {
	return btoa(decodeURI(encodeURIComponent(RawDeflate.deflate(str)))).match(/.{1,5}/g).join('.').replace(/=/g, '');
};

utils.inflate64 = function (str) {
	return RawDeflate.inflate(decodeURIComponent(decodeURI(atob(str.replace(/\./g, '')))));
};

utils.deflate = function (str) {
	return decodeURI(encodeURIComponent(RawDeflate.deflate(str)));
};

utils.inflate = function (str) {
	return RawDeflate.inflate(decodeURIComponent(encodeURI(str)));
};