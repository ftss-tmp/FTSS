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

	app.directive('icon', function () {

		return {
			'restrict': 'E',
			'replace' : true,
			'template': '<img ng-src="{{icon}}" class="icon" title="{{hover}}"/>',
			'scope'   : {
				'path' : '@',
				'hover': '@'
			},
			'link'    : function ($scope) {

				$scope.icon = FTSS.icons[$scope.path];

			}
		};

	});

	app.directive('sorter', function () {

		return {
			'restrict': 'A',
			'template': '<a href="" ng-click="sort()">{{name}}</a>',
			'scope'   : true,
			'link'    : function ($scope, $el, $attrs) {

				var last, field, $parent;

				field = $attrs.sorter;
				$parent = $scope.$parent;
				$scope.name = $attrs.text || $attrs.sorter;

				$scope.sort = function () {

					var sorter = function (data) {

						return last ? _.sortBy(data, field).reverse() : _.sortBy(data, field);

					};

					last = (last === field) ? false : field;

					if ($parent.groups) {

						_.each($parent.groups, function (data, group) {

							$parent.groups[group] = sorter(data);

						});

					} else {

						$parent.data = sorter($parent.data);

					}

					$el.addClass('active').siblings().removeClass('active');
					$('.sorter-'+field).addClass('active').siblings().removeClass('active');

				};

				if ($attrs.hasOwnProperty('default')) {

					$parent.sort = $scope.sort;

				}

			}
		}

	});

}());