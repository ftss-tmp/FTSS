_.templateSettings.interpolate = /\{\{(.+?)\}\}/g;

var FTSS;
FTSS = (function ($) {

	var _internal = {

		// Set to enable various console outputs and breakpoints for debugging
		'debug': true,

		// The URL used for oData REST queries (ListData.svc)
		'baseURL': 'https://sheppard.eis.aetc.af.mil/982TRG/373TRS/Det306/scheduling/_vti_bin/ListData.svc/',

		'cached': {},

		// A collection of private functions used by the library
		'fn': {

			/**
			 * Compresses received SharePoint data by removing unused metadata fields
			 *
			 * @param data
			 * @returns {{data: (Array), json: (XML|string|void)}}
			 */
			'reduce': function (data) {

				var reduced, clean;

				// Some queries seem to return data.results while others do not
				reduced = data.results || data;

				clean = function (item) {

					try {

						delete item['__metadata'];

					} catch (e) {

					}

					if (_.isObject(item)) {

						_.each(item, clean);

					}

				}

				clean(reduced);

				// Return the reduced reduced/JSON data
				return {
					'data': reduced,
					'json': JSON.stringify(reduced).replace(_internal.baseURL, '')
				}

			},

			/**
			 * Uses the modified field from a list to act as a timestamp to cache the entire list
			 * @param options
			 */
			'cache': function (options) {

				// First, disable caching on future requests (to prevent infinite loops)
				options.cache = false;

				// Perform an inquire of the list requesting only the last modified timestamp
				_api.read({
					'source': options.source,
					'params': {
						'$select': 'Modified',
						'$orderby': 'Modified desc',
						'$top': '1'
					},
					'success': function (timeStamp) {

						var link = 'FTSS_Cache_' + options.source;

						if (localStorage[link + '_Stamp'] && localStorage[link + '_Stamp'] === timeStamp.json) {

							var data = JSON.parse(localStorage[link + '_Data']);

							options.success({
								'data': data,
								'json': localStorage[link + '_Data']
							});

							_internal.cached[options.source] = data;

						} else {

							var finalSuccess = options.success;

							(function () {

								options.success = function (finalData) {

									finalSuccess(finalData);

									_internal.cached[options.source] = finalData.data;

									localStorage[link + '_Stamp'] = timeStamp.json;
									localStorage[link + '_Data'] = finalData.json;

								};

								_api.read(options);

							}());

						}

					}
				});

			}

		}
	};

	var _api = {

		'cached': _internal.cached,

		/**
		 * Reads data using the SharePoint REST API with caching/debugging if enabled and after data reduction
		 * @param options
		 */
		'read': function (options) {

			if (_internal.debug) {
				console.time(options.source);
			}

			if (options.cache) {

				_internal.fn.cache(options);

			} else {

				_.each(options.params, function (param, key) {
					if (param instanceof Array) {
						options.params[key] = param.join(',');
					}
				});
				console.log(options.params);

				var http = $.getJSON(_internal.baseURL + options.source, options.params || null);

				http.done(function (data) {

					data = data.d;

					if (_internal.debug) {
						console.timeEnd(options.source);
						console.log(data);
					}

					// Send the data through the reduce() function first
					options.success(_internal.fn.reduce(data));

				});

			}

		}

	};

	return _api;

}(jQuery));

/*
 FTSS.read({
 cache: true,
 source: 'MasterCourseList',
 params: {
 '$select': 'PDS,MDS,Days,Hours,MinStudents,MaxStudents,AFSC,CourseTitle,CourseNumber,Id'
 },
 success: function (data) {

 $('#placeholder').append('Master Course List loaded.<br>');

 }
 });


 FTSS.read({
 cache: true,
 source: 'Units',
 params: {
 '$select': 'Base,Detachment,Contact,DSN,Id'
 },
 success: function (data) {

 $('#placeholder').append('Units loaded.<br>');

 }
 });*/


FTSS.read({
	params: {
		'$filter': 'Completed eq false',
		'$expand':
			[
				'Students',
				'ScheduledClass/Instructor'
			],
		'$select':
			[
				'Id',
				'Students/Name',
				'Students/WorkEMail',
				'Students/WorkPhone',
				'ScheduledClassId',
				'ScheduledClass/DetachmentId',
				'ScheduledClass/CourseId',
				'ScheduledClass/Start',
				'ScheduledClass/End',
				'ScheduledClass/Instructor/Name'
			]
	},
	source: 'RequestsPending',
	success: function (data) {

		$('#placeholder').html('<pre>' + data.json.length + '\n\n' + JSON.stringify(data.data, undefined, 2) + '</pre>');

	}
});


FTSS.read({
	params: {
		'$filter': 'Completed eq false',
		'$expand':
			[
				'Students',
				'ScheduledClass/Instructor',
				'ScheduledClass/Course',
				'ScheduledClass/Detachment'
			],
		'$select':
			[
				'Id',
				'Students/Name',
				'Students/WorkEMail',
				'Students/WorkPhone',
				'ScheduledClassId',
				'ScheduledClass/Detachment/Base',
				'ScheduledClass/Detachment/Detachment',
				'ScheduledClass/Detachment/Contact',
				'ScheduledClass/Detachment/DSN',
				'ScheduledClass/CourseId',
				'ScheduledClass/Start',
				'ScheduledClass/End',
				'ScheduledClass/Instructor/Name',
				'ScheduledClass/Course/AFSC',
				'ScheduledClass/Course/CourseTitle',
				'ScheduledClass/Course/CourseNumber',
				'ScheduledClass/Course/Days',
				'ScheduledClass/Course/Hours',
				'ScheduledClass/Course/PDS',
				'ScheduledClass/Course/MDS',
				'ScheduledClass/Course/MinStudents',
				'ScheduledClass/Course/MaxStudents'
			]
	},
	source: 'RequestsPending',
	success: function (data) {

		$('#placeholder').html('<pre>' + data.json.length + '\n\n' + JSON.stringify(data.data, undefined, 2) + '</pre>');

	}
});

/*

 FTSS.read({
 params: {
 '$filter': 'Completed eq false',
 '$expand': 'Students, ScheduledClass',
 '$select': 'Students/Name,Students/WorkEMail,Students/WorkPhone,ScheduledClassId,Id,ScheduledClass/DetachmentId,ScheduledClass/CourseId,ScheduledClass/Start,ScheduledClass/End'
 },
 source: 'RequestsPending',
 success: function (data) {

 $('#placeholder').html('<pre>' + data.json.length + '\n\n' + JSON.stringify(data.data,undefined, 2) + '</pre>');

 }
 });

 */