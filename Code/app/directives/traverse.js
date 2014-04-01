/*global FTSS, angular */

/**
 *
 */
(function () {

	"use strict";

	FTSS.ng.directive(

		'traverse',

		[
			'$timeout',
			function ($timeout) {

				return {
					'restrict'   : 'E',
					'templateUrl': '/partials/traverse.html',
					'link'       : function (scope, $el) {

						var view = $('#mainView'),

						    content = $('#content');

						if (!scope.createData) {

							// Let the view CSS know about this modal so we can do some fun stuff
							view.addClass('hasModal');

							$('#row-' + scope.data.Id).addClass('modal-selected');

							// Bind the traverse action which allows navigating between records without closing/opening the modal
							scope.traverse = scope.update(scope, function (forward) {

								// Wrap in $timeout due to the async callback required--this was simpler than a promise
								$timeout(function () {

									var rows, row, pointer;

									// Array of all tr's on the page (with a scope)
									rows = $('tr.ng-scope').removeClass('modal-selected');

									// The currently selected row
									row = $('#row-' + scope.data.Id);

									// Our current row index
									pointer = rows.index(row);

									// Map to the new row dependent on the forward variable
									if (forward) {
										row = rows.eq(++pointer).length && rows.eq(pointer) || rows.first();
									} else {
										row = rows.eq(--pointer).length && rows.eq(pointer) || rows.last();
									}

									// Add .modal-selected to the new row
									row.addClass('modal-selected');

									content.scrollTop(content.scrollTop() + row.offset().top - 250);

									// Copy data back into new scope.data variable
									scope.data = angular.copy(row.data().$scope.row);

									// Reset the form state
									scope.modal.$setPristine();

								});

							});

							// Watch for the destruction of this element and then remove .modal-selected class
							$el.on("$destroy", function () {
								view.removeClass('hasModal');
								$('tr.ng-scope').removeClass('modal-selected');
							});

						} else {

							$el.remove();

						}

					}

				};

			}
		]

	);

}());
