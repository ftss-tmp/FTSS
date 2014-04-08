/*global FTSS */

/**
 * ScrollTo Directive
 *
 * Scrolls a #scrollTarget div to make an element visible & then highlight it
 *
 */
(function () {

	"use strict";

	jQuery.fn.scrollTo = function (elem) {

		var self = $(this);
		self.animate({
			             scrollTop: self.scrollTop() -
			                        self.offset().top +
			                        elem.offset().top
		             }, 500);
		return this;
	};

	FTSS.ng.directive('scrollTo', function () {

		return {
			'link': function ($scope, $el, $attrs) {

				var scrollTarget = $('#scrollTarget'),

				    selector = $('#' + $scope.$eval($attrs.scrollTo));

				$el.on('click', function () {

					scrollTarget.scrollTo(selector);

					setTimeout(function () {
						selector.css('background', '#fbf8b2');

						setTimeout(function () {

							selector.css('background', '');

						}, 750);

					}, 400);
				});

			}
		};

	});

}());
