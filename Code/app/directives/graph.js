/*global FTSS, Flotr */

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

					var wrapper = $('#pad-wrapper'), type = $attrs.type || 'bar';


					$el.width(
						Math.floor(parseInt(wrapper.width(), 10) * (Number($attrs.width) || 1))
					);

					$el.height(
						Math.floor(parseInt($attrs.width, 10) || 350)
					);

					$timeout(function () {

						var
							d1 = [],
							d2 = [],
							d3 = [],
							graph, i,
							horizontal = true, colors = ['#39B4D7',
							                             '#488EA1',
							                             '#13718C',
							                             '#69CEEB',
							                             '#8CD6EB',
							                             '#4966DD',
							                             '#5363A6',
							                             '#182F90',
							                             '#778EEE',
							                             '#97A8EE',
							                             '#37E36B',
							                             '#49AB67',
							                             '#129439',
							                             '#68F191',
							                             '#8CF1AB'
							];

						for (i = -10; i < 10; i++) {
							if (horizontal) {
								d1.push([Math.random(),
								         i
								        ]);
								d2.push([Math.random(),
								         i
								        ]);
								d3.push([Math.random(),
								         i
								        ]);
							} else {
								d1.push([i,
								         Math.random()
								        ]);
								d2.push([i,
								         Math.random()
								        ]);
								d3.push([i,
								         Math.random()
								        ]);
							}
						}
console.log(d1,d2,d3);
						graph = Flotr.draw($el[0], [
							{ data: d1, label: 'Serie 1' },
							{ data: d2, label: 'Serie 2' },
							{ data: d3, label: 'Serie 3' }
						], {
							                   colors: colors,
							                   legend: {
								                   position: 'ne'
							                   },
							                   bars  : (type === 'bar') ? {
								                   show      : true,
								                   stacked   : true,
								                   horizontal: horizontal,
								                   barWidth  : 0.6,
								                   lineWidth : 1,
								                   shadowSize: 0
							                   } : false,
							                   grid  : {
								                   verticalLines  : horizontal,
								                   horizontalLines: !horizontal
							                   },
							                   xaxis : { showLabels: false },
							                   yaxis : { showLabels: false },
							                   pie   : (type === 'pie') ? {
								                   show   : true,
								                   explode: 6
							                   } : false
						                   });


						$scope.$watch($el[0].textContent, function (t) {


						});

					});

				}
			};

		}
	]);

}());
