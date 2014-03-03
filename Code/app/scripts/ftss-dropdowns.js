/*global FTSS, _, caches, utils */

(function () {

	"use strict";

	var dropdown, selectizeCollection;

	dropdown = function (scope, opts) {

		var loaded;

		return _(opts).defaults(

			{
				'maxItems'    : 1,
				'options'     : selectizeCollection[opts.select],
				'create'      : false,
				'hideSelected': true,
				'onChange'    : function (val) {

					scope.data[opts.field] = (val.map ? val.map(Number) : Number(val)) || val;

					scope.clean = !loaded;

					if (!loaded) {
						loaded = true;
					}

				},
				'onInitialize': function () {
					this.setValue(scope.data[opts.field]);
				}
			});

	};

	selectizeCollection = {};

	FTSS.dropdowns = {

		'initSelectize': function (scope, SharePoint) {

			return {
				'labelField'   : 'label',
				'valueField'   : 'id',
				'hideSelected' : true,
				'dataAttr'     : 'width',
				'persist'      : true,
				'optgroupOrder':
					[
						'SMART FILTERS',
						'DETACHMENT',
						'AFSC',
						'MDS',
						'INSTRUCTOR',
						'COURSE'
					],
				'plugins'      :
					[
						'optgroup_columns',
						'remove_button'
					],
				'type'         : function () {
					clearTimeout(FTSS.delaySearch);
				},
				'onChange'     : function (val, instant) {

					clearTimeout(FTSS.delaySearch);

					if (!FTSS.updating) {

						if (val instanceof Array && val.length > 0) {

							FTSS.delaySearch = setTimeout(function () {

								utils.updateSearch(function () {

									var tags = {};

									_.each(val, function (v) {

										var split = v.split(':');

										tags[split[0]] = tags[split[0]] ||
										                 [
										                 ];

										tags[split[0]].push(Number(split[1]) || split[1]);

									});

									utils.permaLink(tags);

								});

							}, (instant ? 1 : 500));

						} else {
							utils.loading(false);
							FTSS.search.unlock();
						}

					}
				},
				'onInitialize' : function () {

					var count = 0, CACHE_COUNT = 4;

					FTSS.search = this;

					var loaded = function (data, title, text) {

						// create the serachBox value of type:Id for eventual filter mapping
						var id = title.toLowerCase().charAt(0) + ':';

						selectizeCollection[title] = _.chain(data)

							// Run the reject Archived operation a second time as some lists will place in caches but not selectize
							.reject(function (d) {

								        return (d.Archived === true);

							        })

							.map(function (v) {

								     var Id, txt;

								     Id = (v.Id || v);
								     txt = text && text.call ? text(v) : v;

								     return {
									     'Id'      : Id,
									     'id'      : id + Id,
									     'optgroup': title,
									     'text'    : txt,
									     'label'   : v.label || txt
								     };

							     })

							// _.chain() requires value() to get the resultant dataset
							.value();

						// Add the option group (header) to our searchBox
						FTSS.search.addOptionGroup(title, {
							'label': title,
							'value': title
						});

						// Add the options to our searchBox
						FTSS.search.addOption(selectizeCollection[title]);

						// Keep track of our async loads and fire once they are all done (not using $q.all())
						if (++count > CACHE_COUNT) {

							FTSS.loaded();
							utils.$initPage();

							$('.hide').removeClass('hide');

						}

					};

					SharePoint

						.read(FTSS.models.catalog)

						.then(function (response) {

							      // Add MCL to Caches object if it not Archived
							      caches.MasterCourseList = response;

							      // Pull unique AFSC list from MCL & copy to Caches
							      caches.AFSC = _.compact(_.uniq(_.pluck(response, 'AFSC')));

							      // Pull unqiue MDS list from MCL & copy to Caches
							      caches.MDS = _.compact(_.uniq(_.pluck(response, 'MDS')));

							      // Add MCL to Selectize with row callback
							      loaded(caches.MasterCourseList, 'COURSE', function (v) {

								      /**
								       * Generates string format for dropdown display
								       *
								       * "<div><h5>U2I<em> - J4AMP2A6X6 A41B</em></h5><small>U-2S ELECTRICAL AND ENVIRONMENTAL SYSTEMS</small></div>"
								       *
								       * @type {*|string}
								       */
								      v.label =
								      [
									      '<div><h5>',
									      v.PDS,
									      '<em> - ',
									      v.Number,
									      '</em></h5>',
									      '<small>',
									      v.Title,
									      '</small></div>'
								      ].join('');

								      /**
								       * Generates string format for full-text search
								       *
								       * "U2I / J4AMP2A6X6 A41B / U-2S ELECTRICAL AND ENVIRONMENTAL SYSTEMS / U-2 / 2A6X6"
								       *
								       * @type {*|string}
								       */
								      v.text =
								      [
									      v.PDS,
									      v.Number,
									      v.Title,
									      v.MDS,
									      v.AFSC
								      ].join(' / ');

								      return v.text;
							      });

							      // Add MDS to Selectize
							      loaded(caches.MDS, 'MDS');

							      // Add AFSC to Selectize
							      loaded(caches.AFSC, 'AFSC');

						      });

					SharePoint

						.read(FTSS.models.units)

						.then(function (response) {

							      // Add Units to Caches object
							      caches.Units = response;

							      // Add Units to Selectize with row callback
							      loaded(response, 'DETACHMENT', function (v) {

								      // Use Det # to determine squadron 2XX for 372 TRS / 3XX for 373 TRS
								      v.Squadron = v.Det < 300 ? '372 TRS' : '373 TRS';

								      /**
								       * Generates string for label full-text search
								       *
								       * "Nellis 213 372 TRS 372trsdet13.pro@nellis.af.mil"
								       *
								       * @type {*|string}
								       */
								      v.text =
								      [
									      v.Base,
									      v.Det,
									      v.Squadron,
									      v.Email
								      ].join(' ');

								      /**
								       * Generates string for Selectize display
								       *
								       * "Nellis<em> (Det. 213)</em>"
								       *
								       * @type {*|string}
								       */
								      v.label =
								      [
									      '<b>',
									      v.Base,
									      '</b><right>&nbsp;(Det ',
									      v.Det,
									      ')</right>'
								      ].join('');

								      /**
								       * Generates LongName property for use throughout app
								       *
								       * "Nellis (Det. 213)"
								       *
								       * @type {*|string}
								       */
								      v.LongName =
								      [
									      v.Base,
									      ' (Det. ',
									      v.Det,
									      ')'
								      ].join('');

								      return v.text;
							      });

						      });

					SharePoint

						.read(FTSS.models.instructors)

						.then(function (response) {

							      caches.Instructors = response;

							      loaded(response, 'INSTRUCTOR', function (v) {

								      v.label = v.Instructor.Name.replace(/[^|<br>]\w+,\s\w+/g, '<b>$&</b>');

								      return  v.Instructor.Name;

							      });

						      });

				}
			};

		},

		'MasterCourseListMulti': function (scope) {

			var loaded;

			return dropdown(scope, {

				'select'      : 'COURSE',
				'plugins'     :
					[
						'remove_button'
					],
				'maxItems'    : 999,
				'onChange'    : function (val) {

					if (val.map) {

						scope.data.Courses_JSON = val.map(Number);

						scope.data.CoursesCount = val.length;

						scope.clean = !loaded;

						if (!loaded) {
							loaded = true;
						}

					}

				},
				'onInitialize': function () {
					this.setValue(_(scope.data.CoursesMap).pluck('Id'));
				}

			});

		},

		'MasterCourseList': function (scope) {

			return dropdown(scope, {

				'select': 'COURSE',
				'field' : 'CourseId'

			});

		},

		'AFSC': function (scope) {

			return dropdown(scope, {

				'select': 'AFSC',
				'field' : 'AFSC'

			});

		},

		'MDS': function (scope) {

			return dropdown(scope, {

				'select': 'MDS',
				'field' : 'MDS'

			});

		},

		'Units': function (scope) {

			return dropdown(scope, {

				'select': 'DETACHMENT',
				'field' : 'UnitId'

			});

		},

		'Instructors': function (scope) {

			return dropdown(scope, {

				'select': 'INSTRUCTOR',
				'field' : 'InstructorId'

			});

		}

	};

}());