/**
 * Common database helper functions.
 */
class DBHelper {

	/**
	 * Database URL.
	 * Change this to restaurants.json file location on your server.
	 */
	static get DATABASE_URL() {
		const port = 1337; // Change this to your server port
		return `http://localhost:${port}`;
	}

	static get dbPromise() {
		return idb.open('restaurant-reviews');
	}

	static initLazyLoad() {
		var myLazyLoad = new LazyLoad();
	}
	static handleErrors(response) {
		if (!response.ok) {
			return;
		}
		return response.json();
	}

	static postNewReview(review) {
		console.log(review);
		fetch(DBHelper.DATABASE_URL + '/reviews', {
			method: 'POST',
			body: JSON.stringify(review)
		});
	}

	/**
	 * Fetch all restaurants.
	 */
	static fetchRestaurants(callback) {
		// Trying to read data from idb
		DBHelper.dbPromise.then(function(db) {
			var index = db.transaction('restaurants')
				.objectStore('restaurants').index('id');

			return index.getAll().then(function(restaurants) {
				callback(null, restaurants);
			});

		});

		fetch(DBHelper.DATABASE_URL + '/restaurants')
			.then(DBHelper.handleErrors)
			.then(restaurants => {
				DBHelper.dbPromise.then(function(db) {
					var tx = db.transaction('restaurants', 'readwrite');
					var restaurantsStore = tx.objectStore('restaurants');

					for (let i = 0; i < restaurants.length; i++) {
						restaurantsStore.put(restaurants[i]);
					}
				});

				callback(null, restaurants);
			})
		;
	}

	static fetchReviews(restaurantId, callback) {
		fetch(DBHelper.DATABASE_URL + '/reviews/?restaurant_id=' + restaurantId)
			.then(response => response.json())
			.then(reviews => {
				callback(null, reviews);
			});
	}

	/**
	 * Fetch a restaurant by its ID.
	 */
	static fetchRestaurantById(id, callback) {
		DBHelper.dbPromise.then(function(db) {
			var index = db.transaction('restaurants')
				.objectStore('restaurants');

			return index.get(+id).then(function(restaurant) {
				callback(null, restaurant);
			});

		});

		// fetch selected restaurant with proper error handling.
		fetch(DBHelper.DATABASE_URL + '/restaurants/' + id)
			.then(DBHelper.handleErrors)
			.then(restaurant => {
				if (restaurant) {

					DBHelper.dbPromise.then(function(db) {
						var tx = db.transaction('restaurants', 'readwrite');
						var restaurantsStore = tx.objectStore('restaurants');

						restaurantsStore.put(restaurant);

					});

					callback(null, restaurant);
				} else {
					window.location.href = '/';
				}
			});
	}

	/**
	 * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
	 */
	static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				let results = restaurants
				if (cuisine != 'all') { // filter by cuisine
					results = results.filter(r => r.cuisine_type == cuisine);
				}
				if (neighborhood != 'all') { // filter by neighborhood
					results = results.filter(r => r.neighborhood == neighborhood);
				}
				callback(null, results);
			}
		});
	}

	/**
	 * Fetch all neighborhoods with proper error handling.
	 */
	static fetchNeighborhoods(callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Get all neighborhoods from all restaurants
				const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
				// Remove duplicates from neighborhoods
				const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
				callback(null, uniqueNeighborhoods);
			}
		});
	}

	/**
	 * Fetch all cuisines with proper error handling.
	 */
	static fetchCuisines(callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Get all cuisines from all restaurants
				const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
				// Remove duplicates from cuisines
				const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
				callback(null, uniqueCuisines);
			}
		});
	}

	/**
	 * Restaurant page URL.
	 */
	static urlForRestaurant(restaurant) {
		return (`./restaurant.html?id=${restaurant.id}`);
	}

	/**
	 * Restaurant image URL.
	 */
	static imageUrlForRestaurant(restaurant) {
		const img = restaurant.photograph || restaurant.id;
		return (`/img/${img}.jpg`);
	}

	/**
	 * Map marker for a restaurant.
	 */
	static mapMarkerForRestaurant(restaurant, map) {
		const marker = new google.maps.Marker({
				position: restaurant.latlng,
				title: restaurant.name,
				url: DBHelper.urlForRestaurant(restaurant),
				map: map,
				animation: google.maps.Animation.DROP
			}
		);
		return marker;
	}

}
