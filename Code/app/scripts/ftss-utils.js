/*global utils, FTSS */

/**
 * Misc utilities
 *
 */
utils.deepRead = (function () {

	var dict = {};

	return function (data, exp) {

		var e = dict[exp] = dict[exp] || exp.split('.');

		switch (e.length) {

			case 1:
				return data[e[0]];

			case 2:
				return data[e[0]][e[1]];

			case 3:
				return data[e[0]][e[1]][e[2]];

			default:
				return data;

		}

	};

}());


utils.modal = (function () {

	var modal;

	FTSS.ng.run(
		[
			'$modal',
			function ($modal) {
				modal = $modal;
			}
		]);

	return function (opts) {

		modal

			.open({
				      'templateUrl': opts.templateUrl,
				      'controller' : opts.controller
			      });

	};

}());