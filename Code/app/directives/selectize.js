/*global FTSS, _, caches, PRODUCTION */

/**
 * Selectize directive
 *
 * generates selectizeJS dropdown menus
 */
(function () {

	"use strict";

	var builder, custom, options = {}, timeout;

	builder = function (scope, opts) {

		var loaded, modal;

		// AngularUI tabs creates a new scope so this will let us handle either situation
		modal = scope.modal || scope.$parent.modal;

		return _.defaults(
			opts,

			{
				'maxItems'    : 1,
				'options'     : options[opts.select] || null,
				'plugins'     : opts.maxItems > 1 ? [
					'remove_button'
				] : null,
				'onChange'    : function (val) {

					// Do not run when initializing the value
					if (loaded) {

						var self = this;

						// So that Angular will update the model immediately rather than waiting until we click somewhere else
						timeout(function () {

							// Update the field with the value(s)
							scope.data[opts.field] =
							(val && val.map ? val.map(Number) : Number(val)) || val;

							// Flip the $dirty flag on this modal
							modal.$setDirty();

							// Add ng-dirty class manually as we aren't really a ngForm control
							self.$control.addClass('ng-dirty');

							// Make sure we add the value to the list if it's new
							if (opts.create && val) {

								options[opts.select]

									.push({
										      'label': val,
										      'Id'   : val
									      });

							}

						});

					}

				},
				'onInitialize': function () {

					var self, setup;

					self = this;

					setup = function () {

						loaded = false;

						// Set the value based on the current model
						self.setValue(scope.data[opts.field]);

						self.refreshOptions(false);

						// Mark the first load as done
						loaded = true;

					};

					scope.$watch('data.Id', setup);

					setup();

				}
			});

	};

	custom = {

		'appInit': function (scope, SharePoint) {

			var doSearch = function (val) {

				if (val && val.length > 0) {

					var tags = FTSS.tags = {};

					_.each(val, function (v) {

						var split = v.split(':');

						tags[split[0]] = tags[split[0]] || [];

						tags[split[0]].push(Number(split[1]) || split[1]);

						scope.fn.setPermaLink();
						scope.fn.doNavigate();

					});

				}

				FTSS.search.$control.find('.item').addClass('processed');

			};

			return {
				'valueField'     : 'id',
				'persist'        : true,
				'optgroupOrder'  : [
					'SMART FILTERS',
					'Units',
					'AFSC',
					'MDS',
					'Instructors',
					'MasterCourseList',
					'Hosts'
				],
				'plugins'        : [
					'optgroup_columns',
					'remove_button'
				],
				'onEnter'        : doSearch,
				'onDropdownClose': function () {
					doSearch(this.getValue());
				},
				'onInitialize'   : function () {

					var count = 0, CACHE_COUNT = 6;

					FTSS.search = this;

					var loaded = function (data, group, text) {

						// Add the dataset to the caches object for global access
						caches[group] = data;

						// create the serachBox value of type:Id for eventual filter mapping
						var id = group.toLowerCase().charAt(0) + ':';

						options[group] = _.chain(data)

							// Run the reject Archived operation a second time as some lists will place in caches but not selectize
							.reject(function (d) {

								        return (d.Archived === true);

							        })

							.map(function (v) {

								     var Id, txt;

								     Id = (v.Id || v);
								     txt = text && text.call ? text(v) : v;

								     return {
									     'Id'      : Id,
									     'id'      : id + Id,
									     'optgroup': group,
									     'label'   : v.label || txt,
									     'data'    : v,
									     'search'  : JSON.stringify(v)
										     .replace(/([,{]"\w+":)|([{}"])/gi, ' ')
										     .toLowerCase()
								     };

							     })

							// _.chain() requires value() to get the resultant dataset
							.value();

						var headers = {
							'Units'           : 'FTD',
							'MasterCourseList': 'Course',
							'Instructors'     : 'Instructor',
							'Hosts'           : 'Host Unit'
						};

						// Add the option group (header) to our searchBox
						FTSS.search.addOptionGroup(group, {
							'label': headers[group] || group,
							'value': group
						});

						// Keep track of our async loads and fire once they are all done (not using $q.all())
						if (++count === CACHE_COUNT) {

							var tagBoxOpts = []

								.concat(options.AFSC,
							            options.MDS,
							            options.MasterCourseList,
							            options.Units,
							            options.Instructors,
							            options.Hosts);

							// Add the options to our searchBox
							FTSS.search.addOption(tagBoxOpts);

							scope.fn.doInitPage(true);

							$('.hide').removeClass('hide');

						}

					};

					SharePoint

						.read(FTSS.models.catalog)

						.then(function (response) {

							      // Pull unique AFSC list from MCL & copy to Caches
							      loaded(_(response).pluck('AFSC').uniq().compact().value(), 'AFSC');

							      // Pull unqiue MDS list from MCL & copy to Caches
							      loaded(_(response).pluck('MDS').uniq().compact().value(), 'MDS');

							      // Add MCL to Selectize with row callback
							      loaded(response, 'MasterCourseList', function (v) {

								      // Save for later  our unit listings
								      v.Units = {};

								      /**
								       * Generates string format for dropdown display
								       *
								       * "<div><h5>U2I<em> - J4AMP2A6X6 A41B</em></h5><small>U-2S ELECTRICAL AND ENVIRONMENTAL SYSTEMS</small></div>"
								       *
								       * @type {*|string}
								       */
								      v.label = [
									      '<div><h5>',
									      v.PDS,
									      '<em> - ',
									      v.Number,
									      '</em></h5>',
									      '<small>',
									      v.Title,
									      '</small></div>'
								      ].join('');

								      /**
								       * Generates string format for full-text search
								       *
								       * "U2I / J4AMP2A6X6 A41B / U-2S ELECTRICAL AND ENVIRONMENTAL SYSTEMS / U-2 / 2A6X6"
								       *
								       * @type {*|string}
								       */
								      v.text = [
									      v.PDS,
									      v.Number,
									      v.Title,
									      v.MDS,
									      v.AFSC
								      ].join(' / ');

								      return v.text;
							      });

						      });

					SharePoint

						.read(FTSS.models.units)

						.then(function (response) {

							      // Add Units to Selectize with row callback
							      loaded(response, 'Units', function (v) {

								      // Use Det # to determine squadron 2XX for 372 TRS / 3XX for 373 TRS
								      v.Squadron = v.Det < 300 ? '372 TRS' : '373 TRS';

								      /**
								       * Generates string for label full-text search
								       *
								       * "Nellis 213 372 TRS 372trsdet13.pro@nellis.af.mil"
								       *
								       * @type {*|string}
								       */
								      v.text = [
									      v.Base,
									      v.Det,
									      v.Squadron,
									      v.Email
								      ].join(' ');

								      /**
								       * Generates string for Selectize display
								       *
								       * "Nellis<em> (Det. 213)</em>"
								       *
								       * @type {*|string}
								       */
								      v.label = [
									      '<b>',
									      v.Base,
									      '</b><right>&nbsp;(Det ',
									      v.Det,
									      ')</right>'
								      ].join('');

								      /**
								       * Generates LongName property for use throughout app
								       *
								       * "Nellis (Det. 213)"
								       *
								       * @type {*|string}
								       */
								      v.LongName = [
									      v.Base,
									      ' (Det. ',
									      v.Det,
									      ')'
								      ].join('');

								      return v.text;

							      });

							      SharePoint

								      .read(FTSS.models.hosts)

								      .then(function (hosts) {

									            loaded(hosts, 'Hosts', function (v) {

										            v.Text = v.Unit;

										            v.label = [
											            '<b>',
											            v.Unit,
											            '</b><right>Det. ',
											            caches.Units[v.FTD].Det,
											            '</right>'
										            ].join('');

										            return v.Unit;

									            });

								            });
						      });

					SharePoint

						.read(FTSS.models.instructors)

						.then(function (response) {

							      loaded(response, 'Instructors', function (val) {

								      val.label = val.InstructorName.replace(/[^|<br>]\w+,\s\w+/g, '<b>$&</b>');

								      return  val.InstructorName;

							      });

						      });

				}
			};

		},

		'people': function (scope, SharePoint, field) {

			var filter = scope.picker.filter;

			return {
				'labelField' : 'label',
				'valueField' : 'Name',
				'sortField'  : 'Name',
				'searchField': 'Name',
				'persist'    : false,
				'create'     : true,
				'plugins'    : [
					'remove_button'
				],
				'onChange'   : function (val) {

					var self = this;

					timeout(function () {

						scope.data[field + 'Name'] = val;
						scope.data[field + 'Email'] = (self.options[val] || {}).WorkEMail || '';

					});

				},
				'load'       : function (query, callback) {

					if (!PRODUCTION || query.indexOf(',') > 1) {

						SharePoint.people(query, filter)

							.then(function (data) {

								      _(data).each(function (d) {
									      d.label = '<div><h5>'
										                + d.Name
										                + '</h5><small>'
										                + d.WorkEMail
										      + '</small></div>';
								      });

								      callback(data);

							      });

					}

				}
			};
		}

	};

	FTSS.ng.directive('selectize', [
		'$timeout',
		'SharePoint',
		function ($timeout, SharePoint) {

			return {

				// Restrict it to be an attribute
				'restrict': 'A',

				// Responsible for registering DOM listeners as well as updating the DOM
				'link'    : function (scope, element, attrs) {

					timeout = $timeout;

					setTimeout(function () {

						var opts;

						if (attrs.bind) {

							opts = builder(scope, {
								'select'  : attrs.selectize,
								'field'   : attrs.bind,
								'create'  : attrs.hasOwnProperty('create'),
								'maxItems': attrs.hasOwnProperty('multiple') ? 999 : 1
							});

						} else {

							opts = custom[attrs.selectize](scope, SharePoint, attrs.field);

						}

						if (attrs.watch) {

							var init, filter, refresh;

							filter = function (f) {

								return _.filter(options[attrs.selectize], function (o) {
									return (o.data[attrs.watch] === f);
								});

							};

							refresh = function (f) {

								if (init) {

									var select = element[0].selectize;

									if (select) {

										select.clearOptions();
										select.addOption(filter(f));
										select.setValue(scope.data[opts.field]);

									}

								} else {
									init = true;
								}

							};

							scope.$watch('data.' + attrs.watch, refresh);

							opts.options = filter(scope.data[attrs.watch]);

						}

						var selectize = FTSS.selectizeInstances[opts.field] = $(element).selectize(opts)[0].selectize;

						scope.modal && scope.modal

							.$addControl(
							{
								'$setPristine': function () {
									selectize.$control.removeClass('ng-dirty');
								}
							});
					});
				}
			};
		}
	]);

}());