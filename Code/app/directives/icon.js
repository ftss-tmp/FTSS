/*global FTSS */

/**
 * Icon directives
 *
 * creates SVG-based icons
 */
(function () {

	"use strict";

	FTSS.ng.directive('icon', function () {

		return {
			'restrict': 'E',
			'replace' : true,
			'scope'   : {},
			'link'    : function ($scope, $el, $attrs) {

				var size, icon, classes, style, hover;

				size = $attrs.size || '1.25em';
				icon = FTSS.icons[$attrs.path || $el[0].textContent];
				classes = ($el[0].className || '') + ' icon icon-' + $attrs.path;
				style = 'style="height:' + size + ';width:' + size;
				hover = $attrs.hover ? '" hover="' + $attrs.hover + '" ' : '" ';

				if (icon) {

					$el[0].outerHTML = '<div class="' + classes + hover + style + '">' + FTSS.icons._svg + icon + '</div>';

				} else {

					$el.remove();

				}

			}
		};

	});

}());
