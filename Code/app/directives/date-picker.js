/*global FTSS */

/**
 * Date-Picker Directive
 *
 * calls the jQuery datepicker plugin for an element
 */
(function () {

	"use strict";

	FTSS.ng.directive('datePicker', function () {

		return {
			'link': function ($scope, $el) {

				$el.datepicker({
					               format            : "MM d, yyyy",
					               weekStart         : 1,
					               endDate           : "today",
					               daysOfWeekDisabled: "0,6",
					               autoclose         : true,
					               todayHighlight    : true
				               });

			}
		};

	});

}());
