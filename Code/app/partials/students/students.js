/*global caches, FTSS, _ */

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
					'Name'         : 'Name',
					'HostUnit.Text': 'Unit',
					'ftd.LongName' : 'FTD'
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

							            FTSS.people.students[d.StudentName] = null;

							            d.HostUnit = caches.Hosts[d.HostUnitId];
							            d.ftd = caches.Units[d.HostUnit.FTD];
							            d.firstName = d.StudentName.match(/[a-z]+,\s([a-z]+)/i)[1];

							            d.requirements = _(d.Requirements_JSON)

								            .map(function (r) {

									                 var cache = caches.MasterCourseList[r] || false;
									                 return cache ? '<dt class="tiny">' + cache.PDS + '</dt><dd>' + cache.Number + '<br><small class="truncate">' + cache.Title + '</small></dd>' : '';

								                 })

								            .compact().sort().value().join('');

						            });


				      });

		}
	]);
