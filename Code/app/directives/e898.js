/*global FTSS, utils */

/**
 * E898 Directive
 *
 * Generates an XFDL 898
 *
 */
(function () {

	"use strict";

	FTSS.ng.directive(
		'e898',

		[
			'$templateCache',
			function ($templateCache) {

				return {
					'restrict': 'E',
					'link'    : function ($scope, $el) {

						var wrapper = $templateCache.get('/partials/e898-wrapper.html'),

						    header = $templateCache.get('/partials/e898-header.html'),

						    courseRow = $templateCache.get('/partials/e898-course.html'),

						    data = angular.copy($scope.data),

						    offset = 272,

						    offsetTitle = 311,

						    formData = _.template(header, data),

						    courseData = '';

						_.each(data.Requirements, function (course) {

							course.offset = offset;
							course.offsetTitle = offsetTitle;
							course.cafmcl = course.priority ? 'yes' : 'no';

							courseData += _.template(courseRow, course)

								.replace(/_INDEX_/g, course.course.Id);

							offset += 85;
							offsetTitle += 85;

						});

						$el[0].outerHTML = wrapper.replace('{{formData}}',
						                                   formData.replace('<!-- COURSES-->', courseData));

					}
				};

			}

		]);

}());
