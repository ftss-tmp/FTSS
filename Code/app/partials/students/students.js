/*global caches, FTSS, _ */

FTSS.ng.controller(

	'studentsController',

	[
		'$scope',
		function ($scope) {

			var self = FTSS.controller($scope, {

				'sort' : 'Name',
				'group': 'HostUnit',

				'grouping': {
					'ftdName' : 'FTD',
					'HostUnit': 'Unit'
				},

				'sorting': {
					'Name'    : 'Name',
					'HostUnit': 'Unit',
					'ftdName' : 'FTD'
				},

				'model': 'students',

				'edit': function () {

					FTSS.pasteAction = function (text) {

						var pattern = new RegExp(/^(\d+).*(AWACT)/gm),

							match,

							collection =
								[
								];

						while (match = pattern.exec(text)) {
							try {
								collection.push(_(caches.MasterCourseList).findWhere({'IMDS': match[1]}).Id);
							} catch (e) {}
						}

						FTSS.selectizeInstances.Requirements_JSON.setValue(collection);

					};

				}

			});

			self

				.bind('loaded')

				.then(function (data) {

					      self

						      .initialize(data)

						      .then(function (d) {

							            d.ftd = caches.Units[d.FTD];
							            d.ftdName = d.ftd.LongName;
							            d.Name = d.Student.Name;
							            d.firstName = d.Name.match(/[a-z]+,\s([a-z]+)/i)[1];


							            d.requirements = _.chain(d.Requirements_JSON)

								            .map(function (r) {

									                 var cache = caches.MasterCourseList[r] || false;
									                 return cache ? '<dt class="tiny">' + cache.PDS + '</dt><dd>' + cache.Number + '<br><small class="truncate">' + cache.Title + '</small></dd>' : '';

								                 })

								            .compact().sort().value().join('');

						            });


				      });

		}
	]);
