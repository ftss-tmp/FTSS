/*global _, $, jQuery, FTSS, app, angular */

/**
 * FTSS Models
 *
 * 		'$inlinecount': 'allpages',
 *      '$top'        : 25,
 *
 */
(function () {

	"use strict";

	FTSS.models = {

		'catalog': {

			'cache' : true,
			'source': 'MasterCourseList',
			'params': {
				'$select':
					[
						'Id',
						'PDS',
						'MDS',
						'Days',
						'Hours',
						'Min',
						'Max',
						'AFSC',
						'Title',
						'Number',
					    'IMDS',
					    'CAFMCL',
					    'Archived'
					]
			}

		},

		'units': {

			'cache' : true,
			'source': 'Units',
			'params': {
				'$select':
					[
						'Id',
						'Base',
						'Det',
						'Email',
						'Phone',
					    'Courses_JSON'
					]
			}

		},

		'instructors': {

			'cache' : true,
			'source': 'Instructors',
			'params': {
				'$expand': 'Instructor',
				'$select':
					[
						'Id',
						'UnitId',
						'AFSC',
						'InstructorId',
						'Instructor/Name',
						'Instructor/WorkEMail',
						'Instructor/WorkPhone',
					    'Photo',
					    'Archived'
					]
			}

		},

		'requests': {

			'cache': true,
			'source': 'Requests',
			'params': {
				'$expand':
					[
						'Students',
						'CreatedBy',
						'Scheduled/Course',
						'Scheduled/Requests/Students'
					],
				'$select':
					[
						'Id',
						'Notes',
						'Status',
						'Created',
						'CreatedBy/Name',
						'CreatedBy/WorkEMail',
						'CreatedBy/WorkPhone',
						'Response',
						'Students/Name',
						'Students/WorkEMail',
						'Students/WorkPhone',
						'Scheduled/UnitId',
						'Scheduled/CourseId',
						'Scheduled/Start',
						'Scheduled/End',
						'Scheduled/Host',
						'Scheduled/Other',
						'Scheduled/InstructorId',
						'Scheduled/Requests/Status',
						'Scheduled/Requests/Students/Id'
					]
			}

		},

		'scheduled': {

			'cache': true,
			'source': 'Scheduled',
			'params': {
				'$expand':
					[
						'Course',
						'Requests/Students'
					],
				'$select':
					[
						'Id',
						'UnitId',
						'CourseId',
						'Start',
						'End',
						'InstructorId',
						'Host',
						'Other',
						'Requests/Status',
						'Requests/Students/Id'
					]
			}

		}

	};

}());