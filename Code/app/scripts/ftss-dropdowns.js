/*global FTSS, _, caches, utils */

(function () {

	"use strict";

	var options = {};

	FTSS.dropdowns = {

		'options': options,

		'build': function (scope, opts) {

			var loaded, modal;

			// AngularUI tabs creates a new scope so this will let us handle either situation
			modal = scope.modal || scope.$parent.modal;

			return _(opts).defaults(

				{
					'maxItems'    : 1,
					'options'     : options[opts.select] || null,
					'plugins'     : opts.maxItems > 1 ?
					                [
						                'remove_button'
					                ] : null,
					'onChange'    : function (val) {

						// Do not run when initializing the value
						if (loaded) {

							// Update the field with the value(s)
							scope.data[opts.field] = (val && val.map ? val.map(Number) : Number(val)) || val;

							// Flip the $dirty flag on this modal
							modal.$dirty = true;

							this.$control.addClass('ng-dirty');

							// Make sure we add the value to the list if it's new
							if (opts.create && val) {

								options[opts.select]

									.push({
										      'label': val,
										      'Id'   : val
									      });

							}

							// So that Angular will update the model immediately rather than waiting until we click somewhere else
							scope.$apply();

						}

					},
					'onInitialize': function () {

						// Set the value based on the current model
						this.setValue(scope.data[opts.field]);

						// Mark the first load as done
						loaded = true;

					}
				});

		},

		'initialize': function (scope, SharePoint) {

			var doSearch = function (val) {

				if (!FTSS.updating) {

					if (val && val.length > 0) {

						utils.updateSearch(function () {

							var tags = {};

							_.each(val, function (v) {

								var split = v.split(':');

								tags[split[0]] = tags[split[0]] ||
								                 [
								                 ];

								tags[split[0]].push(Number(split[1]) || split[1]);

							});

							utils.permaLink(tags);

						});

					}

					FTSS.search.$control.find('.item').addClass('processed');

				}

			};

			return {
				'valueField'     : 'id',
				'persist'        : true,
				'optgroupOrder'  :
					[
						'SMART FILTERS',
						'Units',
						'AFSC',
						'MDS',
						'Instructors',
						'MasterCourseList'
					],
				'plugins'        :
					[
						'optgroup_columns',
						'remove_button'
					],
				'onEnter'        : doSearch,
				'onDropdownClose': function () {
					doSearch(this.getValue());
				},
				'onInitialize'   : function () {

					var count = 0, CACHE_COUNT = 7;

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
									     'search'  : JSON.stringify(v).replace(/([,{]"\w+":)|([{}"])/gi, ' ').toLowerCase()
								     };

							     })

							// _.chain() requires value() to get the resultant dataset
							.value();

						// We don't want to add the Students list to the tagBox but will keep it for other uses
						if (group !== 'Students' && group !== 'HostUnits') {

							var headers = {
								'Units'           : 'FTD',
								'MasterCourseList': 'Course',
								'Instructors'     : 'Instructor'
							};

							// Add the option group (header) to our searchBox
							FTSS.search.addOptionGroup(group, {
								'label': headers[group] || group,
								'value': group
							});

						}

						// Keep track of our async loads and fire once they are all done (not using $q.all())
						if (++count === CACHE_COUNT) {

							var tagBoxOpts = options.AFSC.concat(options.MDS, options.MasterCourseList, options.Units, options.Instructors);

							// Add the options to our searchBox
							FTSS.search.addOption(tagBoxOpts);

							FTSS.loaded();
							utils.$initPage();

							$('.hide').removeClass('hide');

						}

					};

					SharePoint

						.read(FTSS.models.catalog)

						.then(function (response) {

							      // Pull unique AFSC list from MCL & copy to Caches
							      loaded(_.compact(_.uniq(_.pluck(response, 'AFSC'))), 'AFSC');

							      // Pull unqiue MDS list from MCL & copy to Caches
							      loaded(_.compact(_.uniq(_.pluck(response, 'MDS'))), 'MDS');

							      // Add MCL to Selectize with row callback
							      loaded(response, 'MasterCourseList', function (v) {

								      /**
								       * Generates string format for dropdown display
								       *
								       * "<div><h5>U2I<em> - J4AMP2A6X6 A41B</em></h5><small>U-2S ELECTRICAL AND ENVIRONMENTAL SYSTEMS</small></div>"
								       *
								       * @type {*|string}
								       */
								      v.label =
								      [
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
								      v.text =
								      [
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
								      v.text =
								      [
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
								      v.label =
								      [
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
								      v.LongName =
								      [
									      v.Base,
									      ' (Det. ',
									      v.Det,
									      ')'
								      ].join('');

								      return v.text;
							      });

						      });

					SharePoint

						.read(FTSS.models.instructors)

						.then(function (response) {

							      loaded(response, 'Instructors', function (v) {

								      v.label = v.Instructor.Name.replace(/[^|<br>]\w+,\s\w+/g, '<b>$&</b>');

								      return  v.Instructor.Name;

							      });

						      });

					SharePoint

						.read(FTSS.models.students)

						.then(function (response) {

							      loaded(_.compact(_.uniq(_.pluck(response, 'HostUnit'))), 'HostUnits');

							      loaded(response, 'Students', function (v) {

								      v.label = v.Student.Name.replace(/[^|<br>]\w+,\s\w+/g, '<b>$&</b>');

								      return  v.Student.Name;

							      });

						      });

				}
			};

		},

		'people': function (scope, SharePoint, field) {

			return FTSS.dropdowns

				.build(scope, {
					       'field'       : field,
					       'labelField'  : 'Name',
					       'valueField'  : 'Id',
					       'sortField'   : 'Name',
					       'searchField' : 'Name',
					       'persist'     : false,
					       'maxItems'    : scope.peopleMax,
					       'create'      : false,
					       'plugins'     :
						       [
							       'remove_button'
						       ],
					       'load'        : function (query, callback) {

						       //	if (query.indexOf(', ') > 1) {                      <-- only limit queries on the production server

						       SharePoint.people(query).then(callback);

						       //	}

					       },
					       'onInitialize': function () {

						       this.addOption({
							                      'Id'  : scope.data[field],
							                      'Name': scope.data.Name
						                      });

						       this.setValue(scope.data[field]);

					       }
				       });


		}

	};

}()
	);