/*global FTSS, PRODUCTION */

/**
 *
 */
(function () {

	"use strict";

	FTSS.ng.run(
		['$timeout',
		 '$modal',
		 '$rootScope',
		 function ($timeout, $modal, $rootScope) {

			 if (true || PRODUCTION) {

				 $timeout(function () {

					 if (!sessionStorage.consent) {

						 var actions = $rootScope.$new();

						 actions.agree = function () {

							 sessionStorage.consent = true;
							 FTSS.consent.hide();

						 };

						 FTSS.consent = $modal({
							                       'scope'              : actions,
							                       'contentTemplate'    : '/partials/dod-consent.html',
							                       'keyboard'           : false,
							                       'backdrop'           : 'static',
							                       'animation'          : 'am-fade-and-scale',
							                       'backgroundAnimation': 'am-fade',
							                       'placement'          : 'center'
						                       });

					 }

				 });

			 }

		 }
		]
	);

}());
