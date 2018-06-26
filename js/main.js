let restaurants,
	neighborhoods,
	cuisines
var map
var markers = []

// Registering SW
if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('service-worker.js')
		.then(function (reg) {
			// registration worked
			console.log('Registered');
		}).catch(function (error) {
		// registration failed
		console.log('Registration failed with ' + error);
	});
}

$(document).ready(function() {
	$.getScript('https://maps.googleapis.com/maps/api/js?key=AIzaSyAMTaIbS4XyQz4v3SXEZKGCfbrtN1WyTaU&libraries=places&callback=initMap')
		.then( () => {
			fetchNeighborhoodsAndCuisines()
		});
});

showMapOnMobile = () => {
	const button = document.getElementById('showMap');
	const map = document.getElementById('map');

	map.style.display = 'block';
	button.style.display = 'none';

}

fetchNeighborhoodsAndCuisines = () => {
	DBHelper.fetchNeighborhoodsAndCuisines((error, data) => {
		if (error) { // Got an error
			console.error(error);
		} else {
			self.neighborhoods = data.neighborhoods;
			self.cuisines = data.cuisines;
			self.restaurants = data.restaurants;
			fillNeighborhoodsHTML();
			fillCuisinesHTML();
			fillRestaurantsHTML();
		}
	});
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
	const select = document.getElementById('neighborhoods-select');
	select.options.length = 0;

	const all = document.createElement('option');
	all.innerHTML = 'All Neighborhoods';
	all.value = 'all';
	select.append(all);

	neighborhoods.forEach(neighborhood => {
		const option = document.createElement('option');
		option.innerHTML = neighborhood;
		option.value = neighborhood;
		select.append(option);
	});
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
	const select = document.getElementById('cuisines-select');
	select.options.length = 0;

	const all = document.createElement('option');
	all.innerHTML = 'All Cuisines';
	all.value = 'all';
	select.append(all);

	cuisines.forEach(cuisine => {
		const option = document.createElement('option');
		option.innerHTML = cuisine;
		option.value = cuisine;
		select.append(option);
	});
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
	let loc = {
		lat: 40.722216,
		lng: -73.987501
	};
	self.map = new google.maps.Map(document.getElementById('map'), {
		zoom: 12,
		center: loc,
		scrollwheel: false
	});

	// Users really should not tab on google maps internal links
	google.maps.event.addListener(self.map, "tilesloaded", function () {
		setTimeout(function () {
			document.querySelectorAll('#map a').forEach(function (item) {
				item.setAttribute('tabindex', '-1');
			});
		}, 1000);
	});

	// updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
	const cSelect = document.getElementById('cuisines-select');
	const nSelect = document.getElementById('neighborhoods-select');

	const cIndex = cSelect.selectedIndex;
	const nIndex = nSelect.selectedIndex;

	const cuisine = cSelect[cIndex].value;
	const neighborhood = nSelect[nIndex].value;

	DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			resetRestaurants(restaurants);
			fillRestaurantsHTML();
		}
	})
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
	// Remove all restaurants
	self.restaurants = [];
	const ul = document.getElementById('restaurants-list');
	ul.innerHTML = '';

	// Remove all map markers
	self.markers.forEach(m => m.setMap(null));
	self.markers = [];
	self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
	if (restaurants.length > 0) {
		const ul = document.getElementById('restaurants-list');
		ul.innerHTML = '';
		restaurants.forEach(restaurant => {
			ul.append(createRestaurantHTML(restaurant));
		});
		addMarkersToMap();
	} else {
		const noRestaurant = document.createElement('p');
		const ul = document.getElementById('restaurants-list');

		noRestaurant.innerHTML = 'There are no restaurants based on your search. Please modify filters!';
		ul.append(noRestaurant)
	}

}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
	const li = document.createElement('li');

	const details = document.createElement('div');
	details.className = 'restaurant-details';
	li.append(details);

	const image = document.createElement('img');
	image.className = 'restaurant-img';
	image.alt = restaurant.name;
	image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant));
	details.append(image);

	const name = document.createElement('h1');
	name.innerHTML = restaurant.name;
	details.append(name);

	const neighborhood = document.createElement('p');
	neighborhood.innerHTML = restaurant.neighborhood;
	details.append(neighborhood);

	const address = document.createElement('p');
	address.innerHTML = restaurant.address;
	details.append(address);

	const more = document.createElement('a');
	more.className = "view-details";
	more.innerHTML = 'View Details';
	more.href = DBHelper.urlForRestaurant(restaurant);
	li.append(more)

	setTimeout(function() {
		DBHelper.initLazyLoad();
	}, 1);

	return li;
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
	restaurants.forEach(restaurant => {
		// Add marker to the map
		const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
		google.maps.event.addListener(marker, 'click', () => {
			window.location.href = marker.url
		});
		self.markers.push(marker);
	});
}
