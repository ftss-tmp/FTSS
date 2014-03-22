/*global utils, FTSS, _, LZString */

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
	var exp = expression.split('.'), retVal;

	// Recursively read the object using a do-while loop, uses short-circuit for invalid properties
	do {
		retVal = (retVal || data)[exp.shift()] || false;
	} while (retVal !== false && exp.length);

	// Return our retVal or false if not found
	return retVal || false;

};


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


utils.compress = function (str) {
	return LZString.compressToBase64(str).match(/.{1,5}/g).join('-').replace(/=/g, '');
};

utils.decompress = function (str) {
	return LZString.decompressFromBase64(str.replace(/\-/g, ''));
};