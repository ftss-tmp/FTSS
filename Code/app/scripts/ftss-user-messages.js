/*global FTSS */

(function () {

	"use strict";

	FTSS.messages = {

		/**
		 * Top section, these items are displayed at the top of the main window on every page
		 */

		// The tag box at the top of the page that has courses/units/instructors/afsc/mds prefilled.
		'tagBox'         : '[icon=info]Use this search box to create custom queries that you can <i>bookmark or share</i>.  Combine as many as you like, the first row of tags in <i><b>bold-italics</b></i> are custom searches for this page.',

		// The alternate search box for cached lists (Catalog/Units/Instructors/Students)
		'searchBox'      : '[icon=info]This search box lets you do full-text instant searches.  The more words you add, the more specific your search will be.  I.e., "robins engines" would find any data that included <i>both</i> robins and engines.',

		// These are the four buttons in the top right corner of the page, listed from left-to-right
		'button-clear'   : 'Clear this search',
		'button-grouping': 'Change how data is grouped',
		'button-sorting' : 'Change the sorting order',
		'button-collapse': 'Toggle expanded or collapsed rows',
		'button-archive' : 'Toggle visibility of archived data',

		// The record count in the top-left corner next to the tag box
		'record-count'   : 'Displays the record  count for your search.  If the background is <span style="color:#d58512;font-weight:800">orange</span>, there were too many records found so you\'ll want to refine your search a little by adding more search tags.',


		'people-picker': 'Use this search box to find the name from the AFNET Global Address List.  The format should be the same as in Outlook.<example>Doe, John A SSgt...</example>',

		/**
		 * Dialog boxes, these are the various dialog box messages displayed in FTSS
		 */

		// The request seats dialog box, shown when someone tries to request seats for a class or submit a new training requirement (898)
		'request-seats-students'        : 'Search for students to add to the request.<example>Please ensure you have already loaded these students into FTSS.</example>',
		'request-seats-comments'        : 'Leave any comments for the FTD or MAJCOM as applicable (optional).',

		// Catalog page
		'catalog-edit-pds'              : 'The unique short-identifier.',
		'catalog-edit-number'           : '',
		'catalog-edit-imds'             : '',
		'catalog-edit-title'            : '',
		'catalog-edit-days'             : 'The number of training days.',
		'catalog-edit-hours'            : 'The number of training hours.',
		'catalog-edit-min'              : 'The minimum number of seats.',
		'catalog-edit-max'              : 'The maximum number of seats.',

		// Instructors page
		'instructors-edit-helpdesk'     : '<div>[icon=info]</div>Rank, unit and contact info are pulled from AFNET; contact the ESD to make changes',
		'instructors-edit-unit'         : 'Choose {{data.firstName}}&#39;s unit from the list.',
		'instructors-edit-afsc'         : 'Type in {{data.firstName}}&#39;s AFSC or choose one from the list.',

		// Units page
		'units-edit-number'             : 'Type the detachment number as 2XX or 3XX.<example>373 TRS/Det 6 is 306.</example>',
		'units-edit-email'              : 'This email address will be used to<br>send any FTD communications from FTSS.' + '<br>Try to use an organizational box if possible.',
		'units-edit-courses'            : 'List the courses taught by this FTD.',

		// Students page
		'students-training-requirements': 'This is a list of all the training requirements for this student.  When a student is scheduled for a given course, it is automatically removed from this list.<br><br><example>This data can also be imported from an IMDS 593 using one of three ways:<br><ol><li>Copy & paste the text anywhere on this screen.</li><li>Drag & drop the text file onto this window.</li><li>Click the import button below & load the text file.</li></ol></example>',
		'students-inprocessing-date'    : 'This is the in-processing date for the student,<br>it is used to sort students by longest wait-time.',
		'students-host-unit'            : 'The unit this student is assigned to.',
		'students-local-ftd'            : 'If applicable, the local FTD for this student.  This is used to determine if the seat request is a local or TDY allocation.',
		'students-category'             : 'Choose the student type, used in conjunction with TDY status to determine the seat request type.',

		'page': {

			'students': "In FTSS, you should add all Airmen requiring FTD training upfront.  By doing so, we can automate the backlog tracking required by AFI.  After establishing your training requirements here, you can generate 898 requirements from your backlog.  If you use IMDS to track FTD training, the course codes are already loaded into FTSS so you can just drag and drop a student's 593 to load their training requirements.",

			'hosts': "Before a student can be added to FTSS (required for 898s), the host unit must be added.  Use this page to add or edit hosts units.  If the unit has a local FTD, be sure to add that to the unit as this is used in determining if this is a local or TDY request.",

			'units': "Use this page to edit the info for FTDs.  Here you can add courses that are taught at a particular unit to FTSS as well as annotate the contact email.",

			'instructors': "Use this page to add, edit or archive instructors, instructor bio photos are optional.",

			'catalog': "TODO:  replace this text with instructions for the users regarding this page."

		}
	};

}());