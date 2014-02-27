/*global FTSS, _ */

(function () {

	"use strict";

	FTSS.dropdowns = {

		'MasterCourseList': function (scope) {

			var loaded, data = scope.data;

			return {

				'options'     : FTSS.selectize.COURSE,
				'create'      : false,
				'plugins'     :
					[
						'remove_button'
					],
				'onChange'    : function (val) {

					val = val ||
						[
						];
					data.CoursesCount = val.length;
					data.Courses = val.length ? val.join('|') : null;

					scope.clean = !loaded;

					if (!loaded) {
						loaded = true;
					}

				},
				'onInitialize': function () {
					this.setValue(_(data.CoursesMap).pluck('Id'));
				}

			};

		},

		'AFSC': function (scope) {

			var loaded, data = scope.data;

			return {

				'maxItems'    : 1,
				'options'     : FTSS.selectize.AFSC,
				'create'      : false,
				'onChange'    : function (val) {
					data.AFSC = val;

					scope.clean = !loaded;

					if (!loaded) {
						loaded = true;
					}
				},
				'onInitialize': function () {
					this.setValue(data.AFSC);
				}
			};

		},

		'MDS': function (scope) {

			var loaded, data = scope.data;

			return {

				'maxItems'    : 1,
				'options'     : FTSS.selectize.MDS,
				'create'      : true,
				'onChange'    : function (val) {
					data.MDS = val;

					scope.clean = !loaded;

					if (!loaded) {
						loaded = true;
					}
				},
				'onInitialize': function () {
					this.setValue(data.MDS);
				}

			};

		},

		'Units': function (scope) {

			var loaded, data = scope.data;

			return {

				'maxItems'    : 1,
				'options'     : FTSS.selectize.DETACHMENT,
				'create'      : false,
				'onChange'    : function (val) {
					data.UnitId = val;

					scope.clean = !loaded;

					if (!loaded) {
						loaded = true;
					}
				},
				'onInitialize': function () {
					this.setValue(data.UnitId);
				}

			};

		}


	};

}());