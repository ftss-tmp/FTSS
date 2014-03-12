/*global FTSS */

/**
 * jQuery .on() bindings
 */
(function () {

	'use strict';

	window.addEventListener("dragover", function (e) {
		e = e || event;
		e.preventDefault();
	}, false);
	window.addEventListener("drop", function (e) {
		e = e || event;
		e.preventDefault();
	}, false);

	var timeout, popover = {

		/**
		 * Internal data parser that converts [icon=someicon] into the SVG icon form FTSS.icons:
		 *
		 * [icon=info] => <div class="icon icon-info"><svg>...</svg></div>
		 *
		 * @param content
		 * @returns string
		 */
		'icon': function (content) {

			var svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="100%" height="100%" ';

			return content

				.replace(/\[icon\=([a-z]+)\]/g,

			             function (match, icon) {
				             return '<div class="icon icon-' + icon + '">' + svg + FTSS.icons[icon] + '</div>';
			             });

		},

		/**
		 *
		 */
		'enter': function () {

			var $el = $(this), title, content;

			timeout = setTimeout(function () {

				if (!$el.data('freeze')) {

					$('.popover').remove();

					if (!$el.data('bs.popover')) {

						content = $el.attr('content');

						if (content) {
							title = $el.attr('hover') || $el.attr('explain');
						} else {
							content = $el.attr('hover') || $el.attr('explain');
							content = FTSS.messages[content] || content;
						}

						if (content) {

							content = popover.icon(content);

							$el.popover(

								{
									'trigger'  : 'manual',
									'html'     : true,
									'title'    : title,
									'content'  : content,
									'placement': $el.attr('show') || 'auto'
								}

							);

						}

					}

					$el.popover('show');

					if (typeof $el.attr('no-arrow') === 'string') {

						$el.data('bs.popover').$tip.addClass('no-arrow');

					}

				}

			}, this.hasAttribute('instant') ? 50 : 500);

		},

		/**
		 *
		 */
		'exit': function () {

			clearTimeout(timeout);

			var $el = $(this);

			clearTimeout(timeout);

			if ($el.data('freeze') !== true) {

				popover.clear($el);

			}

		},

		/**
		 *
		 */
		'toggle': function () {

			var $el, tip;

			$el = $(this);

			if ($el.hasClass('btn')) {

				popover.clear($el);

			} else {

				tip = $el.data('bs.popover').$tip;

				$el.addClass('frozen');
				tip.addClass('frozen');

				$el.data('freeze', true);

				$('body *').not('.popover, .popover *').one('click', function () {
					popover.clear($el);
				});

			}

		},

		/**
		 *
		 * @param self
		 * @param tip
		 */
		'clear': function (self) {

			clearTimeout(timeout);

			var obj = self.data('bs.popover');

			self.removeClass('frozen');
			self.popover('hide');
			self.data('freeze', false);

			if (obj) {

				obj.$tip.removeClass('frozen');

			}

		}
	};

	// Use jQuery on() to bind to future elemnts
	$(document)

		// Bind to the click event of element with the [hover] attribute
		.on('click', '[hover]', popover.toggle)

		.on('mouseenter', '[hover]', popover.enter)

		.on('focusin', '[explain]', popover.enter)

		.on('mouseleave', '[hover]', popover.exit)

		.on('focusout', '[explain]', popover.exit);

}());