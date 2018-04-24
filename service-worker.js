/**
 * Created by mobilport on 2018. 04. 10..
 */

var filesToCache = [
	'/',
	'/css/styles.css',
	'/css/styles-640.css',
	'/css/styles-960.css',
	'/js/vendor/idb.js',
	'/js/idb.js',
	'/js/main.js',
	'/js/restaurant_info.js',
	'/js/dbhelper.js',
	'/index.html',
	'/restaurant.html'
];

var staticCacheName = 'pages-cache-v3';

self.addEventListener('install', function(event) {
	event.waitUntil(
		caches.open(staticCacheName)
			.then(function(cache) {
				return cache.addAll(filesToCache);
			})
	);
});

self.addEventListener('fetch', function(event) {
	event.respondWith(
		caches.match(event.request).then(function(response) {
			if (response) {
				return response;
			} else {
				return fetch(event.request);
			}
		})
	);
})