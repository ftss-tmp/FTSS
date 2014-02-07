/*global _, $, jQuery, FTSS, app, angular */

(function () {

	"use strict";

	FTSS.models = {

		'bios': {

			'cache' : true,
			'source': 'Bios',
			'params': {
				'$select': 'Name'
			}

		},

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
						'Number'
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
						'Phone'
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
						'Instructor/WorkPhone'
					]
			}

		},

		'requests': {

			'source': 'Requests',
			'params': {
				'$expand':
					[
						'Students',
						'CreatedBy',
					    'Scheduled'
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
						'Scheduled/InstructorId'
					]
			}

		},

		'scheduled': {

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