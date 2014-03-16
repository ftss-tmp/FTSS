/**
 * Selectize directive
 *
 * generates selectizeJS dropdown menus
 */
(function () {

	"use strict";

	FTSS.ng.directive(

		'selectize',
		[
			'$timeout',
			'SharePoint',
			function ($timeout, SharePoint) {
				return {
					// Restrict it to be an attribute in this case
					'restrict': 'A',
					// responsible for registering DOM listeners as well as updating the DOM
					'link'    : function (scope, element, attrs) {
						$timeout(function () {

							var opts;

							if (attrs.bind) {

								opts = FTSS.dropdowns.build(scope, {
									'select'  : attrs.selectize,
									'field'   : attrs.bind,
									'create'  : attrs.hasOwnProperty('create'),
									'maxItems': attrs.hasOwnProperty('multiple') ? 999 : 1
								});

							} else {

								opts = FTSS.dropdowns[attrs.selectize](scope, SharePoint, attrs.field);

							}

							if (attrs.watch) {

								var init, filter, refresh;

								filter = function (f) {

									return _(FTSS.dropdowns.options[attrs.selectize])

										.filter(function (o) {
											        return (o.data[attrs.watch] === f);
										        });

								};

								refresh = function (f) {

									if (init) {

										var select = element[0].selectize;

										if (select) {

											select.clearOptions();
											select.addOption(filter(f));
											select.setValue(scope.data[opts.field]);

										}

									} else {
										init = true;
									}

								};

								scope.$watch('data.' + attrs.watch, refresh);

								opts.options = filter(scope.data[attrs.watch]);

							}

							FTSS.selectizeInstances[opts.field] = $(element).selectize(opts)[0].selectize;

						});
					}
				};
			}
		]);

}());