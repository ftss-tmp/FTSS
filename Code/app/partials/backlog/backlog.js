/*global FTSS, caches, _, moment, utils, angular */

FTSS.ng.controller(
	'backlogController',

	[
		'$scope',
		'SharePoint',
		'$timeout',
		function ($scope, SharePoint, $timeout) {

			var self = FTSS.controller($scope, {

				    'static': true,

				    'sort' : 'course.PDS',
				    'group': 'course.MDS',

				    'grouping': {
					    'course.MDS' : 'MDS',
					    'CAFMCL'     : 'CAF/MCL',
					    'course.AFSC': 'AFSC'
				    },

				    'sorting': {
					    'course.PDS'         : 'PDS',
					    'days'               : 'Wait Time',
					    'requirements.length': '# Requirements'
				    },

				    'modal': 'backlog',

				    'edit': function (scope, isNew, courses) {

					    var m = moment(),

					        month = {

						        'm1': m.month(),
						        'd1': m.format('MMM YY'),
						        'm2': m.add(1, 'month').month(),
						        'd2': m.format('MMM YY'),
						        'm3': m.add(1, 'month').month(),
						        'd3': m.format('MMM YY')

					        };

					    courses.month = moment().add('months', 3).toISOString();

					    _(courses).each(function (course) {

						    course.limit = 3;

						    course.History = angular.copy(month);

						    course.students = _(course.requirements).map(function (req) {

							    return req.selected ? req : false;

						    }).filter().value();

					    });

					    scope.courses = courses;

					    scope.local = courses[0].detRequest.distanceInt < 50;

					    scope.funded = false;

				    },

				    'submit': function (scope) {

					    scope.submitted = true;

					    var odataCall = {

						    'requirement': {

							    'cache': true,

							    '__metadata': 'Requirements',

							    'UnitId': scope.courses[0].detRequest.Id,

							    'HostId': $scope.host.Id,

							    'DateNeeded': scope.courses.month,

							    'Funded': scope.local || scope.funded,

							    'TDY': !scope.local,

							    'Notes': scope.notes,

							    'Requirements_JSON': []

						    }

					    };

					    _(scope.courses).each(function (course) {

						    var req = [
							    // Course
							    course.course.Id,

							    // Priority
							    course.priority,

							    // Notes
							    course.CourseNotes || '',

							    // Students
							    [],

							    // History
							    course.History
						    ];

						    _(course.requirements)

							    .filter('selected')

							    .each(function (requirement) {

								          req[3].push(
									          [
										          // IMDS Id
										          requirement.id,

										          // IMDS Grade
										          requirement.grade,

										          // Name
										          requirement.name,

										          // Course date
										          requirement.dueDate
									          ]);

							          });

						    odataCall.requirement.Requirements_JSON.push(req);

					    });

					    SharePoint.batch(odataCall).then(function (result) {

						    if (result.success) {

							    self.reload();

							    scope.$hide();
							    utils.alert.create();

							    scope.submitted = false;

						    } else {

							    utils.alert.error('Batch 898 Creation failure');

						    }

					    });

				    }

			    }),

			    timeAvg = function (time, length) {

				    return moment.duration(Math.ceil(time.days / length), 'days').humanize();

			    },

			    timeMax = function (reqs) {

				    return moment.duration(_(reqs).pluck('days').max().value(), 'days').humanize();

			    },

			    parseText = function (text) {

				    // This is the header for our AAA text dump
				    $scope.$parent.viewPaste = 'NAME                EMP #  GRD   DAFSC  PAFSC     COURSE                          STATUS    DATE\n\n';

				    var _collection = {},

				        // Keep track of the IMDS user ID (we're outside the closure to handle multi-page data
				        last = false,

				        // Keep track of the text value of last
				        mLast = false,

				        // The result of our string sanitization
				        parsed = text

					        // Strip the page header junk
					        .replace(/PERSONAL\sDATA[\s\S]+?EVT\-ID/gim, '')

					        // Strip the page footer junk
					        .replace(/^PCN\s.*/gim, '')

					        // Strip ANG prefix from some names -- why would they do that anyway?!?!?!
					        .replace(/^ANG\s/gi, '')

					        // First, remove all QUAL & COMP text (but don't remove line in case this is the name line)
					        .replace(/(\s([\d]{6})\s).+(QUAL|COMPL).*$/gim, '')

					        // Strip blank lines
					        .replace(/^\s+$/gm, '')

					        // Strip all extra line-breaks
					        .replace(/\n+/gm, '\n');

				    // Iterate over each line
				    _(parsed.split('\n')).each(function (s) {

					    s

						    // Match the last, first, CAMSID and grade for each student
						    .replace(/^([a-z]+)\s([a-z]+).*\s(\d{5})\s+([\da-z]{3})/gi,

					                 function (match, lastName, firstName, CAMSID, grade) {

						                 // remember the last match
						                 mLast = match;

						                 last = {

							                 // Concat the first + last
							                 'name' : firstName + ' ' + lastName,

							                 // Last name
							                 'last' : lastName,

							                 // First name
							                 'first': firstName,

							                 // Trim the IMDS(CAMS)ID in case we need to use later
							                 'id'   : CAMSID.trim(),

							                 // This is used by the hover so add some HTML decoration
							                 'text' : '<h4>' + match + '</h4>',

							                 // Try to guess the grade of this student (not very reliable right now)
							                 'grade': (function () {

								                 // We have to do some guessing about the grade as GS & enlisted grades overlap
								                 grade = parseInt(grade, 10);

								                 switch (true) {

									                 // Invalid INT--might be "CON" or missing so we'll assume civilian
									                 case !grade:
										                 return 3;

									                 // Typically grades 6 and below are enlisted guys
									                 case grade < 7:
										                 return 1;

									                 case grade < 13:
										                 return 3;
								                 }

								                 // Everyone else seems to be an officer
								                 return 2;
							                 }())

						                 };

						                 // return our CAMSID
						                 return ' ' + CAMSID + ' ';

					                 })

						    // Look for each course code left (always a six-digit number)
						    .replace(/\s([\d]{6})\s/,

					                 function (match, courseCode, offset, str) {

						                 // Test if the courseCode is listed in our course catalog
						                 if (caches.IMDS.indexOf(courseCode) > -1) {

							                 // Add to the course array if it already exists
							                 _collection[courseCode] = _collection[courseCode] || [];

							                 // Add the matching text to our hover info
							                 last.text += '<br>' + str;

							                 // Now find the first date if it exists
							                 s.replace(/\d\d\s[a-z]{3}\s\d\d/i, function (match) {

								                 // Create a moment() object based on the match
								                 last.date = moment(match);

								                 // Also, just copy the text for display
								                 last.dueDate = match;
							                 });

							                 // Now add the student to the course collection
							                 _collection[courseCode].push(angular.copy(last));

							                 // This lets us show a dump of the parsed data for verification
							                 $scope.$parent.viewPaste += (mLast + s + '\n')

								                 .replace(/\s{10,}/g, '          ');

						                 }

					                 });


				    });

				    // Done, send the _collection back now
				    return _collection;

			    };

			/* $scope.filter causes a page navigation action (updates the page URL for bit.ly/bookmark stuff) so we'll
			 * we'll just keep a copy of it in the FTSS object for now...
			 *
			 * @todo this is a really dumb hack that should be refactored.
			 */
			FTSS.temp898 = FTSS.temp898 || false;

			// Bind to $scope.filter for now just because it's easy---but probably should be refactored in FTSS.controller
			self.bind('filter').then(function (val) {

				var courses = {};

				// Only do work if the data was already parsed
				if (FTSS.temp898) {

					// Wrap in $timeout() to notify Angular's digest cycle of the change
					$timeout(function () {

						// Read the host object from our dropdown selection
						$scope.host = FTSS.search.options[FTSS.search.getValue()].data || {};

						// Using the host.FTD property (if it exists) add the ftd object
						$scope.ftd = $scope.host.FTD ? caches.Units[$scope.host.FTD] : false;

						// Iterate over all the requirements
						_(FTSS.temp898).each(function (c, k) {

							// This should always work--but just in case, get our course data from the course catalog
							var course = _.findWhere(caches.MasterCourseList, {'IMDS': k}) || {};

							// If it's valid, add the course to the courses object
							if (course.Id) {

								courses[course.Id] = {
									'requirements': c,
									'course'      : course,
									'priority'    : course.CAFMCL,
									'CAFMCL'      : course.CAFMCL ? 'CAF/MCL Course(s)' : 'Regular Course(s)',
									'listFTD'     : []
								};

							}

						});

						// This will loop over each FTD and add then add itself to any courses in our list
						_(caches.Units).each(function (u) {

							//var counted = false,

							var unit = angular.copy(u);

							_(unit.Courses_JSON).each(function (c) {

								var course = courses[c];

								if (course) {

									// Local if the host's FTD is requested
									course.local = ($scope.ftd.Id === unit.Id);

									// Add the unit to the list of available FTDs for this course
									course.listFTD.push(unit);

									if (course.local) {

										// For local, set the distance text to Local and distanceInt to 0 for sorting
										unit.distance = 'Local';
										unit.distanceInt = 0;

									} else {

										// Not local so attempt to do our Cartesian calculation for a distance estimate
										var d = utils.distanceCalc($scope.host.Location, unit.Location) || 'unknown';

										// If the results aren't valid, just set distanceInt to past the Sun--yes, overkill?
										unit.distanceInt = parseInt(d, 10) || 99999999;

										// we can't just use toLocale() thanks to our favorite browser (IE)...grrrr
										unit.distance = utils.prettyNumber(d);
										/*
										 if (!counted) {
										 counted = true;
										 $scope.totals.reqsTDY++;
										 }*/
									}

								}

							});

						});

						self

							// Send the generated data through the controller init function
							.initialize(courses)

							.then(function (d) {

								      // Sort the available FTDs by distance (closest first)
								      d.listFTD = _.sortBy(d.listFTD, 'distanceInt');

								      d.requirements = _.sortBy(d.requirements, 'date');

								      // Pre-check our closest FTD if available
								      d.detRequest = d.listFTD[0] || false;


							      });

					});

				}

				// Need to call setLoaded() to finish the page load
				$scope.fn.setLoaded();

			});

			// Reset our requests object
			$scope.requests = {
				'display': false
			};

			/**
			 * Our on-click operation for adding or removing students to the 898 pre-check list
			 */
			$scope.checkStudent = (function () {

				// We store a data object for the life of the controller as checkStudent() is called for each click
				var data = {};

				return function (row) {

					// Get the count of checked students
					var count = row ? _(row.requirements).filter('selected').size() : false;

					if (count) {

						// set over/under/count/type data
						row.Over = count > row.course.Max;
						row.Under = count < row.course.Min;
						row.Count = count;
						row.Type = $scope.requestType(row);

						data[row.course.Id] = row;

					} else {

						// Everyone is removed so reset over/under and delete the request
						row.Over = row.Under = false;
						delete data[row.course.Id];

					}

					// Reset request count
					$scope.requests.count = 0;

					// We hav to use _.size() since this is an ojbect no array
					$scope.requests.display = _.size(data) ?

						// There is data so groupBy the FTD
						                      _.groupBy(data, function (gp) {

							                      // Add the count to our total count
							                      $scope.requests.count += gp.Count;

							                      // Return the FTD base for data grouping
							                      return gp.detRequest.Base;

						                      }) : false;

				};

			}());

			/**
			 * Handles CSS class creation for TDY, local or unavailable courses
			 *
			 * @param row
			 * @returns {string}
			 */
			$scope.requestType = function (row) {

				if (row.detRequest) {
					switch (true) {
						case (row.detRequest.distanceInt < 50):
							return 'info';

						case (row.detRequest.distanceInt > 49):
							return 'warning';
					}
				}

				return 'danger';

			};


			FTSS.pasteAction = function (text) {

				FTSS.temp898 = parseText(text);

				self.reload();

				/*      $scope.totals.pctStudents =
				 Math.floor($scope.totals.students / $scope.totals.allStudents * 100);

				 $scope.totals.avg = timeAvg($scope.totals,
				 $scope.totals.students)
				 .match(/^(\S+)\s(.*)/);

				 $scope.totals.max = moment

				 .duration(_.max($scope.totals.max), 'days')
				 .humanize()
				 .match(/^(\S+)\s(.*)/);
				 */

			};

		}
	])
;
