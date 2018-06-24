let restaurant;
var map;

getUrlParams = (url = window.location.href) => {
	var params = {};
	(url + '?').split('?')[1].split('&').forEach(function (pair) {
		pair = (pair + '=').split('=').map(decodeURIComponent);
		if (pair[0].length) {
			params[pair[0]] = pair[1];
		}
	});
	return params;
};

var currentRestaurantId = getUrlParams()['id'];

// Registering SW
if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('service-worker.js')
		.then()
		.catch();
}

/**
 * Initialize Google map, called from HTML.
 */

$(document).ready(function() {
	$.getScript('https://maps.googleapis.com/maps/api/js?key=AIzaSyAMTaIbS4XyQz4v3SXEZKGCfbrtN1WyTaU&libraries=places&callback=initMap');
});


window.initMap = () => {
	fetchRestaurantFromURL((error, restaurant) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			self.map = new google.maps.Map(document.getElementById('map'), {
				zoom: 16,
				center: restaurant.latlng,
				scrollwheel: false
			});
			fillBreadcrumb();
			DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
		}
	});
};

document.querySelector('form').addEventListener('submit', (e) => {
	const formData = new FormData(e.target);

	let data = {
		restaurant_id: currentRestaurantId,
		name: formData.get('name'),
		rating: formData.get('rating'),
		comments: formData.get('comment')
	};

	e.preventDefault();

	self.restaurant.reviews.push(data);
	fillReviewsHTML(self.restaurant.reviews);
	hideAddReviewForm();

	if (navigator.onLine === true) {
		postNewReview(data);
	} else {
		const sync = () => {
			postNewReview(data);
			window.removeEventListener('online', sync);
		}

		window.addEventListener('online', sync);
	}

	// Now you can use formData.get('foo'), for example.
	// Don't forget e.preventDefault() if you want to stop normal form .submission
});

postNewReview = (data) => {
	DBHelper.postNewReview(data)
		.then(review => {
			//self.restaurant.reviews.push(review);
			//fillReviewsHTML();

			DBHelper.fetchReviews(currentRestaurantId, (error, reviews) => {
				if (error) {
					fillRestaurantHTML();
				} else {
					// Could load all reviews for given restaurant
					self.restaurant.reviews = reviews;

					fillRestaurantHTML();
				}
			});
		});
}

showAddReviewForm = (e) => {
	console.log(e);
	const container = document.getElementById('new-review-form');
	container.style.display = "block";

	const newButton = document.getElementById('new-review');
	newButton.style.display = "none";

	window.scrollTo(0,document.body.scrollHeight);
};

hideAddReviewForm = (e) => {
	const container = document.getElementById('new-review-form');
	container.style.display = "none";

	const newButton = document.getElementById('new-review');
	newButton.style.display = "block";
};

starClick = () => {
	self.restaurant.is_favorite = !self.restaurant.is_favorite;
	starRestaurantHtml();

	if (navigator.onLine === true) {
		starRestaurant();
	} else {
		const sync = () => {
			starRestaurant();
			window.removeEventListener('online', sync);
		}

		window.addEventListener('online', sync);
	}
}

starRestaurant = () => {
	const newFlag = self.restaurant.is_favorite ? !JSON.parse(self.restaurant.is_favorite) : true;
	DBHelper.putFavorite(self.restaurant.id, newFlag)
		.then(response => {
			//self.restaurant.is_favorite = JSON.parse(response.is_favorite);
			starRestaurantHtml();
		});
}

starRestaurantHtml = () => {
	const element = document.getElementById('favorite');

	if (!self.restaurant) {
		return;
	}

	if (self.restaurant.hasOwnProperty('is_favorite') && JSON.parse(self.restaurant.is_favorite) === true) {
		element.className = 'favorited'
	} else {
		element.className = 'not-favorited';
	}
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
	if (self.restaurant) { // restaurant already fetched!
		callback(null, self.restaurant)
		return;
	}
	const id = getParameterByName('id');
	if (!id) { // no id found in URL
		error = 'No restaurant id in URL'
		callback(error, null);
	} else {
		DBHelper.fetchRestaurantById(id, (error, restaurant) => {
			self.restaurant = restaurant;
			starRestaurantHtml();
			if (!restaurant) {
				console.error(error);
				return;
			}

			DBHelper.fetchReviews(id, (error, reviews) => {
				if (error) {
					fillRestaurantHTML();
					callback(null, restaurant);
				} else {
					// Could load all reviews for given restaurant
					restaurant.reviews = reviews;

					fillRestaurantHTML();
					callback(null, restaurant);
				}
			});
		});
	}
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
	const name = document.getElementById('restaurant-name');
	name.innerHTML = restaurant.name;

	const address = document.getElementById('restaurant-address');
	address.innerHTML = restaurant.address;

	const image = document.getElementById('restaurant-img');
	image.className = 'restaurant-img';
	image.alt = restaurant.name;
	image.src = DBHelper.imageUrlForRestaurant(restaurant);

	const cuisine = document.getElementById('restaurant-cuisine');
	cuisine.innerHTML = restaurant.cuisine_type;

	// fill operating hours
	if (restaurant.operating_hours) {
		fillRestaurantHoursHTML();
	}
	// fill reviews
	fillReviewsHTML();

	setTimeout(function() {
		DBHelper.initLazyLoad();
	}, 1);
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
	const hours = document.getElementById('restaurant-hours');
	hours.innerHTML = '';
	for (let key in operatingHours) {
		const row = document.createElement('tr');

		const day = document.createElement('td');
		day.innerHTML = key;
		row.appendChild(day);

		const time = document.createElement('td');
		time.innerHTML = operatingHours[key];
		row.appendChild(time);

		hours.appendChild(row);
	}
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
	const container = document.getElementById('reviews-container');
	container.innerHTML = '';
	const reviewsList = document.createElement('ul');
	reviewsList.id = 'reviews-list';

	container.appendChild(reviewsList);

	const title = document.createElement('h2');
	title.innerHTML = 'Reviews';
	container.appendChild(title);

	if (!reviews) {
		const noReviews = document.createElement('p');
		noReviews.innerHTML = 'No reviews yet!';
		container.appendChild(noReviews);
		return;
	}
	const ul = document.getElementById('reviews-list');
	reviews.forEach(review => {
		ul.appendChild(createReviewHTML(review));
	});
	container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
	const li = document.createElement('li');
	const heading = document.createElement('heading');
	li.appendChild(heading);

	const name = document.createElement('span');
	name.className = "review-name";
	name.innerHTML = review.name;
	heading.appendChild(name);

	const date = document.createElement('span');
	date.className = "review-date";
	date.innerHTML = review.createdAt ? new Date(review.createdAt).toLocaleDateString("en-US") : 'Pending...';
	heading.appendChild(date);

	const content = document.createElement('div');
	content.className = "review-content";
	li.appendChild(content);

	const rating = document.createElement('span');
	const star = document.createElement('span');
	rating.className = "review-rating";
	rating.innerHTML = `Rating: ${review.rating}`;
	star.className = 'rating-star';
	star.innerText = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
	rating.appendChild(star);
	content.appendChild(rating);

	const comments = document.createElement('p');
	comments.className = "review-comments";
	comments.innerHTML = review.comments;
	content.appendChild(comments);

	return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
	const breadcrumb = document.getElementById('breadcrumb');
	breadcrumb.innerHTML = '';

	const home = document.createElement('li');
	const homeLink = document.createElement('a');

	homeLink.innerText = 'Home';
	homeLink.setAttribute('href', '/');
	homeLink.setAttribute('role', 'listitem');

	home.appendChild(homeLink);
	breadcrumb.appendChild(home);

	const li = document.createElement('li');
	li.innerHTML = restaurant.name;
	breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
	if (!url)
		url = window.location.href;
	name = name.replace(/[\[\]]/g, '\\$&');
	const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
		results = regex.exec(url);
	if (!results)
		return null;
	if (!results[2])
		return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
