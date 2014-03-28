/*global caches, FTSS, utils, PRODUCTION */

FTSS.ng.controller('instructorsController',

                   [
	                   '$scope',
	                   '$timeout',
	                   function ($scope, $timeout) {

		                   var self = FTSS.controller($scope, {

			                   'sort' : 'Name',
			                   'group': 'Unit.LongName',

			                   'grouping': {
				                   'Squadron'     : 'Squadron',
				                   'Unit.LongName': 'Detachment',
				                   'AFSC'         : 'AFSC'
			                   },

			                   'sorting': {
				                   'Instructor.Name': 'Name',
				                   'AFSC'           : 'AFSC'
			                   },
			                   'model'  : 'instructors',

			                   'edit': function (scope) {

				                   scope.onFileSelect = function ($files) {

					                   var reader = new FileReader();

					                   reader.onload = function (result) {

						                   var rawBuffer = result.target.result,

							                   rand = utils.generateUUID();

						                   $.ajax({
							                          'url'        : (PRODUCTION ? 'https://cs3.eis.af.mil/sites/OO-ED-AM-11/FTSS/Prototype' : 'http://dev') + '/_vti_bin/ListData.svc/Bios',
							                          'type'       : 'POST',
							                          'data'       : rawBuffer,
							                          'processData': false,
							                          'contentType': 'multipart/form-data',
							                          'headers'    : {
								                          'accept': "application/json;odata=verbose",
								                          'slug'  : '/sites/OO-ED-AM-11/FTSS/Prototype/Bios/' + rand + '.jpg'
							                          },
							                          'success'    : function () {
								                          $timeout(function () {

									                          scope.data.Photo = rand;
									                          scope.modal.$setDirty();

								                          });
							                          },
							                          error        : function (err) {
								                          FTSS.utils.log(err);
							                          }
						                          });
					                   };

					                   reader.readAsArrayBuffer($files[0]);

				                   };

			                   }

		                   });


		                   self

			                   .bind()

			                   .then(function (data) {

				                         self

					                         .initialize(data)

					                         .then(function (d) {

						                               d.Unit = caches.Units[d.UnitId];
						                               d.firstName = d.InstructorName.match(/[a-z]+,\s([a-z]+)/i)[1];

					                               });


			                         });

	                   }
                   ]);
