/*global FTSS, _ */

/**
 * FTSS Directives
 *
 *
 */
(function () {

	"use strict";

	var svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="100%" height="100%" ';

	FTSS.ng.directive(

		'selectize',
		[
			'$timeout',
			'SharePoint',
			function ($timeout, SharePoint) {
				return {
					// Restrict it to be an attribute in this case
					restrict: 'A',
					// responsible for registering DOM listeners as well as updating the DOM
					link    : function (scope, element, attrs) {
						$timeout(function () {

							var opts;

							if (attrs.bind) {

								opts = FTSS.dropdowns.build(scope, {
									'select': attrs.selectize,
									'field' : attrs.bind,
									'create': attrs.hasOwnProperty('create'),
									'maxItems': attrs.hasOwnProperty('multiple') ? 999 : 1
								});

							} else {

								opts = FTSS.dropdowns[attrs.selectize](scope, SharePoint, attrs.field);

							}

							if (attrs.watch) {

								var filter, refresh;

								filter = function (f) {

									return _(FTSS.dropdowns.options[attrs.selectize])

										.filter(function (o) {
											        return (o.data[attrs.watch] === f);
										        });

								};

								refresh = function (f) {

									var select = element[0].selectize;

									if (select) {

										select.running = true;

										select.clearOptions();
										select.addOption(filter(f));
										select.setValue(scope.data[opts.field]);

										select.running = false;

									}

								};

								scope.$watch('data.' + attrs.watch, refresh);

								opts.options = filter(scope.data[attrs.watch]);

								$(element).selectize(opts);


							} else {

								$(element).selectize(opts);

							}

						});
					}
				};
			}
		]);

	FTSS.ng.directive(

		'navLink',

		[
			'$timeout',
			function ($timeout) {
				return {
					restrict: 'E',
					template: '<li class="{{link}}"><div class="pointer"><div class="arrow"></div><div class="arrow_border"></div></div><span class="link" ng-click="navigate()"><icon path="{{icon}}" size="1.5em"></icon><span>{{name}}</span></span></li>',
					replace : true,
					scope   : {
						link: '@',
						icon: '@',
						name: '@'
					},
					link    : function ($scope) {

						$scope.navigate = function () {
							window.location.hash =
							[
								'',
								$scope.link,
								$scope.$parent.permaLink
							].join('/');
						};

						$timeout(function () {
							$scope.$$watchers =
							[
							];
						}, 1);

					}
				};
			}
		]);

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

					$el[0].outerHTML = '<div class="' + classes + hover + style + '">' + svg + icon + '</div>';

				} else {

					$el.remove();

				}

			}
		};

	});

	FTSS.ng.directive('updated', function () {

		return {
			'restrict': 'E',
			'replace' : true,
			'link'    : function ($scope, $el) {

				if (eval('$scope.' + $el[0].innerText + '.updated')) {

					$el[0].outerHTML = '<div class="icon icon-flag" hover="Updated since your last visit.">' + svg + FTSS.icons.flag + '</div>';

				} else {

					$el.remove();

				}

			}
		};

	});

	FTSS.ng.directive('fixedHeader', function () {

		return {
			'restrict': 'A',
			'link'    : function ($scope, $el) {

				$el.stickyTableHeaders();

			}
		};

	});

	FTSS.ng.directive('spinner', function () {

		var spinner = '<img style="_STYLE_" src="data:image/gif;base64,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" />';

		return {
			'restrict': 'E',
			'replace' : true,
			'scope'   : {},
			'link'    : function ($scope, $el, $attrs) {

				var id, classes, style;

				id = $el[0].id ? 'id="' + $el[0].id + '"' : '';
				classes = ' class="' + ($el[0].className || '') + '"';
				style = $attrs.size ? 'height:' + $attrs.size : 'width:10%;margin: 10% 40%';

				$el[0].outerHTML = '<div ' + id + classes + ' style="width:100%;height:100%">' + spinner.replace('_STYLE_', style) + '</div>';

			}
		};

	});

	FTSS.ng.directive('photo', function () {

		var noPhoto = 'data:image/png;base64,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';

		return {
			'restrict': 'E',
			'replace' : true,
			'link'    : function ($scope, $el, $attrs) {

				var data = eval('$scope.' + $attrs.data) || {};

				if (data.Photo || $attrs.force) {

					var size, shape, height, path;

					size = $attrs.size || '100px';
					shape = $attrs.shape || 'circle';
					height = (shape === 'circle' || shape === 'square') ? ';height:' + size : ';height:185px';
					path = data.Photo ? 'bios/' + data.Id + '.jpg' : noPhoto;

					$el[0].outerHTML = '<div class="mask-img ' + shape + '" style="width:' + size + height + ';"><img src="' + path + '" /></div>';

				} else {

					$el.remove();

				}

			}
		};

	});


	FTSS.ng.directive(

		'ngOnce',
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

}());