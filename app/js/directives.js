/*global _, $, jQuery, FTSS, app, angular */

(function () {

	"use strict";

	app.directive('onFinishRender', function ($timeout) {
		return {
			restrict: 'A',
			link    : function (scope, element, attr) {
				if (scope.$last === true) {
					$timeout(function () {
						scope.$emit(attr.onFinishRender);
					});
				}
			}
		};
	});

	app.directive('navLink', function () {
		return {
			restrict   : 'E',
			templateUrl: 'partials/nav-link.html',
			replace    : true,
			scope      : {
				link: '@',
				icon: '@',
				name: '@'
			},
			link       : function ($scope) {

				$scope.$parent.$on('$routeChangeSuccess', function () {
					$scope.className = $scope.$parent.isPage($scope.link);
					$scope.permaLink = $scope.$parent.permaLink;
				});

				if ($scope.link !== 'home') {

					$scope.$parent.$watch('count.results', function (val) {
						$scope.count = val;
					});

				}

			}
		};
	});

}());