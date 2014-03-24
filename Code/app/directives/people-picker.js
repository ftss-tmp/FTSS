/*global FTSS, _, caches */

/**
 * People Picker directive
 *
 * Creates a selectize people picker that loads data from SharePoint
 */
(function () {

	"use strict";

	FTSS.ng.directive('peoplePicker', function () {

		return {
			'restrict'   : 'E',
			'templateUrl': '/partials/people-picker.html',
			'link'       : function ($scope, $el, $attrs) {

				if ($scope.createData) {

					var list = $attrs.filter ? FTSS.people[$attrs.filter] : false;
console.log(list);
					$scope.picker = {
						'field' : $attrs.field,
						'filter': list ? function (data) {

							return !list.hasOwnProperty(data.Id);

						} : false
					};

				} else {

					$el.remove();

				}

			}
		};

	});

}());
