/*global caches, FTSS, _, moment */

FTSS.ng.controller(
	'studentsController',

	[
		'$scope',
		function ($scope) {

			var self = FTSS.controller($scope, {

				'sort' : 'Name',
				'group': 'HostUnit.Text',

				'grouping': {
					'ftd.LongName' : 'FTD',
					'HostUnit.Text': 'Unit'
				},

				'sorting': {
					'Name'   : 'Name',
					'numReqs': '# Courses',
					'days'   : 'Wait Time'
				},

				'model': 'students',

				'edit': function (scope, isNew) {

					if (isNew) {

						scope.data = {
							'ProcessDate': (new Date()),
							'StudentType': 1
						};

					}

					FTSS.pasteAction = function (text) {

						var pattern = new RegExp(/^(\d+).*(AWACT)/gm),

						    match,

						    collection =
							    [
							    ];

						while (match = pattern.exec(text)) {
							try {
								collection.push(_.findWhere(caches.MasterCourseList, {'IMDS': match[1]}).Id);
							} catch (e) {}
						}

						FTSS.selectizeInstances.Requirements_JSON.setValue(collection);

					};

				}

			});

			self

				.bind('filter')

				.then(function (data) {

					      FTSS.people.students = FTSS.people.students || {};

					      self

						      .initialize(data)

						      .then(function (d) {

							            var momentObj = moment(d.ProcessDate);

							            FTSS.people.students[d.StudentName] = null;

							            d.HostUnit = caches.Hosts[d.HostUnitId];
							            d.ftd = caches.Units[d.HostUnit.FTD];

							            d.days = moment().diff(momentObj, 'days');
							            d.wait = momentObj.fromNow();

							            d.numReqs = _.size(d.Requirements_JSON);

							            d.requirements = _(d.Requirements_JSON)

								            .map(function (r) {

									                 var course = caches.MasterCourseList[r] || false;

									                 d.priority = d.priority || course.CAFMCL || false;

									                 return course ? '<dt class="tiny">'
										                                + course.PDS
										                                + '</dt><dd>'
										                                + course.Number
										                                + '<br><small class="truncate">'
										                                + course.Title
										                 + '</small></dd>' : '';

								                 })

								            .compact().sort().value().join('');

						            });


				      });

		}
	]);
