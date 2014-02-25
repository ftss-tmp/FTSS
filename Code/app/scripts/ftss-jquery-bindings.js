/*global FTSS */

/**
 * jQuery .on() bindings
 */
(function () {

	'use strict';

	(function () {

		var popover = {

			'icon': function (content) {

				var svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="100%" height="100%" ';

				return content.replace(/\[icon\=([a-z]+)\]/g, function (match, icon) {
					return '<div class="icon icon-' + icon + '">' + svg + FTSS.icons[icon] + '</div>';
				});

			},

			'enter': function () {

				var $el = $(this), title, content;

				setTimeout(function () {

					if (!$el.data('freeze')) {

						if (!$el.data('bs.popover')) {

							content = $el.attr('content');

							if (content) {
								title = $el.attr('hover') || $el.attr('explain');
							} else {
								content = $el.attr('hover') || $el.attr('explain');
							}

							content = popover.icon(content);

							$el.popover({
								            'trigger'  : 'manual',
								            'html'     : true,
								            'title'    : title,
								            'content'  : content,
								            'placement': $el.attr('show') || 'auto'
							            });

						}

						$el.popover('show');


						if (typeof $el.attr('no-arrow') === 'string') {

							$el.data('bs.popover').$tip.addClass('no-arrow');

						}

					}

				}, 100);

			},

			'exit': function () {

				var self = $(this);

				setTimeout(function () {

					if (self.data('freeze') !== true) {

						popover.clear(self);

					}

				}, 150);

			},

			'toggle': function () {

				var self, tip;

				self = $(this);
				tip = self.data('bs.popover').$tip;

				self.addClass('frozen');
				tip.addClass('frozen');

				self.data('freeze', true);

				$('body *').not('.popover, .popover *').one('click', function () {
					popover.clear(self, tip);
				});

			},

			'clear': function (self, tip) {

				tip = tip || self.data('bs.popover').$tip;

				self.removeClass('frozen');
				self.popover('hide');
				self.data('freeze', false);
				tip.removeClass('frozen');

			}
		};


		$(document)

			.on('click', '[hover]', popover.toggle)

			.on('mouseenter', '[hover]', popover.enter)

			.on('focusin', '[explain]', popover.enter)

			.on('mouseleave', '[hover]', popover.exit)

			.on('focusout', '[explain]', popover.exit);

	}());

}());