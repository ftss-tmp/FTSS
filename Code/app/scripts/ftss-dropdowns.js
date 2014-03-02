/*global FTSS, _ */

(function () {

	"use strict";

	var dropdown = function (scope, opts) {

		var loaded;

		return _(opts).defaults(

			{
				'maxItems'    : 1,
				'options'     : FTSS.selectize[opts.select],
				'create'      : false,
				'hideSelected': true,
				'onChange'    : function (val) {
					scope.data[opts.field] = val;

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

	FTSS.dropdowns = {

		'MasterCourseList': function (scope) {

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