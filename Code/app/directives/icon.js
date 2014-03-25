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

				var size = $attrs.size || '1.25em',

					iconPath = $attrs.path || $el[0].textContent,

					icon = FTSS.icons[iconPath],

					classes = ($el[0].className || '') + ' icon icon-' + iconPath,

					style = 'style="height:' + size + ';width:' + size,

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
