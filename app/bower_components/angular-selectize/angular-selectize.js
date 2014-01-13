(function () {
	angular.module('angular-selectize',
		[
		]);

	angular.module('angular-selectize').directive('selectize', function ($timeout) {

		$(document).on('mouseenter', '.selectize-control .item', function() {
			this.title = this.innerText;
		});

		return {
			// Restrict it to be an attribute in this case
			restrict: 'A',
			// responsible for registering DOM listeners as well as updating the DOM
			link: function (scope, element, attrs) {
				$timeout(function () {
					// Need to watch the $scope.loaded value to be true before continuing since
					// we're building our data with ng-repeat from an async data source // Jeff McCoy, Jan 2014 for FTSS
					scope.$watch('loaded', function () {
						if (scope.loaded) {
							$(element).selectize(scope.$eval(attrs.selectize));
						}
					}, true);
				});
			}
		};
	});

}).call(this);

