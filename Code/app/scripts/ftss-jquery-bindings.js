/*global FTSS, _ */

/**
 * jQuery .on() bindings
 */
(function () {

	'use strict';

	/**
	 * prevent dragover & drop from exiting the application if a user misses the drop target
	 */
	window.addEventListener("dragover", function (e) {
		e = e || event;
		e.preventDefault();
	}, false);
	window.addEventListener("drop", function (e) {
		e = e || event;
		e.preventDefault();
	}, false);

	var body, popover, pasteAction;

	body = $('body');

	/**
	 * Intercepts paste events and handles if we have a paste handler set (FTSS.pasteAction)
	 *
	 * @param e jQuery event
	 */
	pasteAction = function (e) {

		e.stopImmediatePropagation();

		if (FTSS.pasteAction) {

			e.preventDefault();
			FTSS.pasteAction(e.originalEvent.clipboardData.getData('Text'));

		}

	};

	popover = {

		/**
		 * Internal data parser that converts [icon=someicon] into the SVG icon form FTSS.icons:
		 *
		 * [icon=info] => <div class="icon icon-info"><svg>...</svg></div>
		 *
		 * @param content
		 * @returns string
		 */
		'icon': function (content) {

			return content

				.replace(/\[icon\=([a-z]+)\]/g,

			             function (match, icon) {
				             return '<svg class="icon icon-' + icon + '"><use xlink:href="#icon-' + icon + '"/></use></svg>';
			             });

		},

		/**
		 *
		 */
		'enter': function () {

			var $el = $(this), title, content, placement;

			if (!$el.data('freeze')) {

				$('.popover').remove();

				content = $el.attr('content');

				if (content) {
					title = $el.attr('hover') || $el.attr('explain');
				} else {
					content = $el.attr('hover') || $el.attr('explain');
					if (content === 'tagBox' || content === 'searchBox') {
						body.attr('id', content);
					} else {
						body.attr('id', '');
					}
					content = FTSS.messages[content] || content;
				}

				if (content) {

					content = popover.icon(content);

					_([
						  'left',
						  'right',
						  'top',
						  'bottom'
					  ])

						.each(function (p) {
							      if ($el[0].hasAttribute(p)) {
								      placement = p;
							      }
						      });

					$el.popover({
						            'trigger'  : 'manual',
						            'html'     : true,
						            'title'    : title,
						            'content'  : content,
						            'placement': placement || 'auto',
						            'container': 'body'
					            });

					$el.popover('show');

					if ($el[0].hasAttribute('no-arrow')) {

						$el.data('bs.popover').$tip.addClass('no-arrow');

					}

				}

			}

		},

		/**
		 *
		 */
		'exit': function () {

			var $el = $(this);

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
			tip = $el.data('bs.popover') && $el.data('bs.popover').$tip;

			if ($el.hasClass('btn') || !tip) {

				popover.clear($el);

			} else {

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

			var obj = self.data('bs.popover');

			self.removeClass('frozen');
			self.popover((self[0].hasAttribute('live')) ? 'destroy' : 'hide');
			self.data('freeze', false);

			if (obj) {

				obj.$tip.removeClass('frozen');

			}

		}
	};

	// Use jQuery on() to bind to future elements
	$(document)

		// Bind to the click event of element with the [hover] attribute
		.on('click', '[hover]:not(.no-toggle)', popover.toggle)

		.on('mouseenter', '[hover]', popover.enter)

		.on('focusin', '[explain],[explain] *', popover.enter)

		.on('mouseleave', '[hover]', popover.exit)

		.on('focusout', '[explain],[explain] *', popover.exit)

		.on('paste', '*', pasteAction);

}());