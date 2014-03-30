/*global FTSS, utils */

/**
 * Page Help Message directive
 *
 * Provides user instructions for the current page
 */
(function () {

	"use strict";

	FTSS.ng.directive(

		'pageHelpMessage',

		function () {

			return {
				'restrict': 'E',
				'replace' : true,
				'templateUrl': '/partials/page-help-message.html',
				'scope': {},
				'link'    : function ($scope, $el) {

					var $parent = $scope.$parent,

					    page = $parent.fn.getPage();

					$parent.showHelp = (localStorage['FTSS_Pref_Help_' + page] !== 'false');

					$parent.pageMessage = FTSS.messages.page[page];

					$parent.hideHelp = function () {

						localStorage['FTSS_Pref_Help_' + page] = false;
						$el.remove();

					};

				}
			};

		});


}());
