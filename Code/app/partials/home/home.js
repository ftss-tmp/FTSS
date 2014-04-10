/*global app, utils, caches, FTSS, _ */

FTSS.ng.controller('homeController', function () {

	utils.loading(false);


	$.getJSON('https://api.flickr.com/services/feeds/photos_public.gne?id=39513508@N06&format=json&jsoncallback=?',
	          function (resp) {

		          var img = resp.items[
			          Math.floor(Math.random() * resp.items.length)
			          ].media.m.replace('_m.', '_c_d.');

		          $('#bg').attr('src', img);
	          });


});