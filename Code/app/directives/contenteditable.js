/*global FTSS */

/**
 * Contenteditable directive
 *
 * Allows ng-model binding to contenteditable
 *
 * Source: http://docs.angularjs.org/api/ng/type/ngModel.NgModelController
 *
 */
(function () {

	"use strict";

	FTSS.ng.directive(
		'contenteditable',

		function () {
			return {
				restrict: 'A', // only activate on element attribute
				require : '?ngModel', // get a hold of NgModelController
				link    : function (scope, element, attrs, ngModel) {
					if (!ngModel) {
						return;
					} // do nothing if no ng-model

					var onEnter = attrs.hasOwnProperty('onenter');

					// Specify how UI should be updated
					ngModel.$render = function () {
						element.text(ngModel.$viewValue || '');
					};

					element.on('keydown', function (e) {
						if (onEnter && e.which === 13) {
							scope.$eval(attrs.onenter);
							e.preventDefault();
							e.stopImmediatePropagation();
						}
					});

					// Listen for change events to enable binding
					element.on('blur keyup change', function () {
						scope.$apply(read);
					});

					read(); // initialize

					// Write data to the model
					function read() {
						ngModel.$setViewValue(element.text().replace(/[^\w.,*?[\]()!=]/mg, ' '));
					}
				}
			};
		});

}());