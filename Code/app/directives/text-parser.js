/**
 * Text Parser directive
 *
 * Sends drag & drop text to FTSS.pasteAction
 */
(function () {

	"use strict";

	var readText = function (evt) {

		var file, reader;

		try {
			file = evt.dataTransfer.files[0];
		} catch (e) {
			file = evt.target.files[0];
		}

		if (file.type === 'text/plain') {

			reader = new FileReader();

			reader.onload = function () {

				FTSS.pasteAction(reader.result);

			};

			reader.readAsText(file);

		}

	};

	FTSS.ng.directive('textParser', function () {

		return {

			'restrict'   : 'A',
			'templateUrl': '/partials/text-parser.html',
			'link'       : function (scope, $el, $attrs) {

				if (window.FileReader !== null) {

					$el.find('input').bind('change', readText);

					$el.find('label').append($attrs.textParser);

				} else {

					$el.remove();

				}

			}

		};

	});

	FTSS.ng.directive('ngAnyDrop',
	                  [
		                  '$timeout',
		                  function ($timeout) {

			                  return function (scope, elem) {

				                  if ('draggable' in document.createElement('span')) {

					                  var cancel = null;

					                  elem[0].addEventListener("dragover", function (evt) {
						                  $timeout.cancel(cancel);
						                  evt.stopPropagation();
						                  evt.preventDefault();
						                  elem.addClass("dragover");
					                  }, false);

					                  elem[0].addEventListener("dragleave", function () {
						                  cancel = $timeout(function () {
							                  elem.removeClass("dragover");
						                  });
					                  }, false);

					                  elem[0].addEventListener("drop", function (evt) {

						                  evt.stopPropagation();
						                  evt.preventDefault();

						                  elem.removeClass("dragover");

						                  var txt = evt.dataTransfer.getData('Text');

						                  if (txt) {

							                  FTSS.pasteAction(txt);

						                  } else {

							                  readText(evt);

						                  }

					                  }, false);
				                  }
			                  };
		                  }

	                  ]);

}());