/*global _, $, FTSS, app */

(function () {

	"use strict";

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

				/*var svg, size, title;

				 size = parseInt($attrs.size, 10) || 20;
				 title = $attrs.hover || '';

				 svg = new Raphael($el[0], size, size);

				 svg.add(FTSS.icons[$attrs.path]);*/
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

	app.directive('noWatch', function ($timeout) {

		return {
			'restrict': 'A',
			'link'    : function ($scope) {

				$timeout(function () {
					$scope.$$watchers =
						[
						];
				});

			}
		};

	});

	/*

	 // Version for IE8 compatibility without PIE
	 app.directive('photo', function () {

	 return {
	 'restrict': 'E',
	 'replace' : true,
	 'template': '<div ng-if="bio" class="circle-img" style="width:{{size}};height:{{size}}"><img ng-src="{{bio}}" /><img class="circle-img-border white" ng-src="{{icons.bio_mask_white}}"/><img class="circle-img-border alt"  ng-src="{{icons.bio_mask_alt}}"/><img class="circle-img-border blue"  ng-src="{{icons.bio_mask_blue}}"/></div>',
	 'scope'   : {},
	 'link'    : function ($scope, $el, $attrs) {

	 $scope.bio = $attrs.data;
	 $scope.size = $attrs.size || '100px';
	 $scope.icons = FTSS.icons;

	 }
	 };

	 });*/

	app.directive('ngOnce', function () {
		return {
			restrict  : 'EA',
			priority  : 500,
			transclude: true,
			template  : '<div ng-transclude></div>',
			compile   : function () {

				return function postLink(scope) {

				};
			}
		};
	});

	app.directive('leanRepeat', function ($compile) {
		return {
			//priority: 2000,
			//restrict: 'A', // This is implicit
			replace: true,
			//template: "<tr ng-repeat='{{ngRepeatExp}}' ng-class-even=\"'even'\" ng-transclude></tr>"
			link   : function ($scope, $element, $attr) {

				var match, m1, m2, template, valueIdentifier, keyIdentifier;
				match = $attr.leanRepeat.split(' in ');

				m1 = match[1];
				m2 = match[0];

				match = m2.match(/^(?:([\$\w]+)|\(([\$\w]+)\s*,\s*([\$\w]+)\))$/);

				valueIdentifier = match[3] || match[1];
				keyIdentifier = match[2] || m2;

				template = $element.html();

				$element.empty();

				_.each($scope[m1], function (val, key) {

					var tmp = $scope.$new();

					tmp[keyIdentifier] = key;
					tmp[valueIdentifier] = val;

					$element.append($compile(template)(tmp));

				});
				/*
				 var unwatch = $scope.$watch(m1, function() {});

				 unwatch();*/

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