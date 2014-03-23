/*global FTSS */

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
				'scope'   : {},
				'templateUrl': '/partials/page-help-message.html',
				'link'    : function ($scope) {

					var page = FTSS.page();

					$scope.showHelp = (localStorage['FTSS_Pref_Help_' + page] !== 'false');

					$scope.pageMessage = FTSS.messages.page[page];

					$scope.hideHelp = function () {

						$scope.showHelp = localStorage['FTSS_Pref_Help_' + page] = false;

					};

				}
			};

		});


}());
