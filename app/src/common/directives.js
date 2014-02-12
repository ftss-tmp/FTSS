/*global _, $, FTSS, app */

(function () {

	"use strict";

	app.directive('navLink', function () {
		return {
			restrict   : 'E',
			templateUrl: 'src/main/navigation.html',
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

				console.log($scope.$$watchers);

			}
		};
	});

	app.directive('icon', function () {

		return {
			'restrict': 'E',
			'replace' : true,
			'scope'   : {},
			'link'    : function ($scope, $el, $attrs) {

				var size, title, icon;

				size = $attrs.size || '1.1em';
				title = $attrs.hover || '';
				icon = FTSS.icons[$attrs.path];

				if (icon) {

					$el[0].outerHTML = '<img src="' + FTSS.icons[$attrs.path] + '" style="height:' + size + '" class="icon" title="' + title + '"/>';

				} else {

					$el.remove();

				}

			}
		};

	});

	app.directive('photo', function () {

		return {
			'restrict': 'E',
			'replace' : true,
			'scope'   : {},
			'link'    : function ($scope, $el, $attrs) {

				if ($attrs.data) {

					var size, shape, height;

					size = $attrs.size || '100px';
					shape = $attrs.shape || 'circle';
					height = (shape === 'circle') ? ';height:' + size : ';height:185px';

					$el[0].outerHTML = '<div class="mask-img ' + shape + '" style="width:' + size + height + ';"><img src="' + $attrs.data + '" /></div>';

				} else {

					$el.remove();

				}

			}
		};

	});


	app.directive('ngOnce',
	              [
		              '$timeout',
		              function ($timeout) {
			              return {
				              'restrict'  : 'EA',
				              'priority'  : 500,
				              'transclude': true,
				              'template'  : '<div ng-transclude></div>',
				              'compile'   : function () {
					              return function postLink(scope) {
						              $timeout(scope.$destroy.bind(scope), 0);
					              };
				              }
			              };
		              }
	              ]);

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

						return last ? _.sortBy(data, field) : _.sortBy(data, field).reverse();

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
					$('.sorter-' + field).addClass('active').siblings().removeClass('active');

				};

				if ($attrs.hasOwnProperty('default')) {

					$el.addClass('active');

					$parent.sort = $scope.sort;

				}

			}
		};

	});

}());