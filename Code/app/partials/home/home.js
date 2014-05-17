/*global app, utils, caches, FTSS, _, moment */

(function () {

	"use strict";

	FTSS.ng.controller(
		'homeController',

		['$scope',

		 'SharePoint',

		 function ($scope, SharePoint) {

			 var html = $('html');

			 $scope.pref = FTSS.prefs;

			 SharePoint

				 .read(FTSS.models.updates)

				 .then(function (data) {

					       $scope.updates = _(data)

						       .sortBy('Created')

						       .reverse()

						       .map(function (d) {
							            d.date = moment(d.Created).format('ll');
							            return d;
						            })

						       .value();

				       });

			 $scope.$parent.$watch(
				 'cleanSlate',

				 function (res) {

					 if (res) {

						 $scope.courseUpdates = _.filter(caches.MasterCourseList, 'updated');

						 utils.loading(false);

					 }

				 });

			 $scope.$watch(
				 'pref',

				 function (val, old) {

					 if (val && val !== old) {

						 localStorage.FTSS_prefs = JSON.stringify(val);

						 html.attr('id', FTSS.prefs.animate ? '' : 'noAnimate');

					 }

				 }, true);

		 }
		]);


}());