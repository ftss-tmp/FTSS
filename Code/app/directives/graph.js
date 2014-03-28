/*global FTSS */

/**
 *
 */
(function () {

	"use strict";

	FTSS.ng.directive('graph', [

		'$timeout',

		function ($timeout) {

			return {
				'restrict': 'C',
				'link'    : function ($scope, $el, $attrs) {

					$timeout(function () {

						$el[0].size = {
							width: 500,
							height:350
						};

						$el.width(500);
						$el.height(350);

						var
							d1 = [],
							d2 = [],
							d3 = [],
							graph, i,
							horizontal = true;

						for (i = -10; i < 10; i++) {
							if (horizontal) {
								d1.push([Math.random(), i]);
								d2.push([Math.random(), i]);
								d3.push([Math.random(), i]);
							} else {
								d1.push([i, Math.random()]);
								d2.push([i, Math.random()]);
								d3.push([i, Math.random()]);
							}
						}

						graph = Flotr.draw($el[0],[
							{ data : d1, label : 'Serie 1' },
							{ data : d2, label : 'Serie 2' },
							{ data : d3, label : 'Serie 3' }
						], {
							                   legend : {
								                   backgroundColor : '#D2E8FF' // Light blue
							                   },
							                   bars : {
								                   show : true,
								                   stacked : true,
								                   horizontal : horizontal,
								                   barWidth : 0.6,
								                   lineWidth : 1,
								                   shadowSize : 0
							                   },
							                   grid : {
								                   verticalLines : horizontal,
								                   horizontalLines : !horizontal
							                   }
						                   });


						$scope.$watch($el[0].textContent, function (t) {


						});

					});

				}
			};

		}
	]);

}());
