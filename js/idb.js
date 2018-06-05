/**
 * Created by mobilport on 2018. 04. 24..
 */

var dbPromise = idb.open('restaurant-reviews', 1, function (upgradeDb) {
	// For later use
	// switch (upgradeDb.oldVersion) {
	// 	case 0:
	// 		var keyValStore = upgradeDb.createObjectStore('keyval');
	// 		keyValStore.put('world', 'hello');
	// 	case 1:
	// 		upgradeDb.createObjectStore('people', {keyPath: 'name'});
	// 	case 2:
	// 		var peopleStore = upgradeDb.transaction.objectStore('people');
	// 		peopleStore.createIndex('animal', 'favoriteAnimal');
	// 	case 3:
	// 		var peopleStore = upgradeDb.transaction.objectStore('people');
	// 		peopleStore.createIndex('age', 'age');
	// }

	var restaurantsStore = upgradeDb.createObjectStore('restaurants', {
		keyPath: 'id'
	});

	var reviewsStore = upgradeDb.createObjectStore('reviews', {
		keyPath: 'id'
	});

	restaurantsStore.createIndex('id', 'id');
	reviewsStore.createIndex('id', 'id');
});