/* ====INDEXEDDB SETUP START==== */
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;

window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

var db;

if (!('indexedDB' in window)) {
	console.log('This browser doesn\'t support IndexedDB');
}

var dbPromise = window.indexedDB.open('test', 1);

dbPromise.onerror = function(event) {
	console.log('INDEXEDDB: The database failed to open');
};

dbPromise.onsuccess = function(event) {
	db = dbPromise.result;
	console.log('INDEXEDDB: The database is opened successfully');
};

dbPromise.onupgradeneeded = function(event) {
	db = event.target.result;
	var objectStore;
	if (!db.objectStoreNames.contains('test')) {
		objectStore = db.createObjectStore('test', { autoIncrement: true });
		objectStore.createIndex('userData', 'userData', { unique: false });
		console.log("INDEXEDDB: object store nonexistent, new one created")
	} else {
		objectStore = db.transaction(['test'], 'readwrite').objectStore('test');
		console.log("INDEXEDDB: object store present");
	}
}
/* ====INDEXEDDB SETUP END==== */

var text = document.getElementById("text");
var btn = document.getElementById("button");
var sync = document.getElementById("sync")
var connected = document.getElementById("connected")
var syncStatus = document.getElementById("syncStatus")
var submitStatus = document.getElementById("submitStatus")
var connectionStatus = document.getElementById("connectionStatus")

console.log("SOCKET: hello world");
var socket = io();

socket.on("connect", () => {
	console.log("connected");
	socket.emit("getData");
	connectionStatus.innerHTML = "connected";
})


connected.addEventListener("click", () => {
	connectionStatus.disabled = true;
	connectionStatus.innerHTML = "checking..."
	var fail = setTimeout(() => {
		connectionStatus.innerHTML = "not connected"
		connectionStatus.disabled = false;
	}, 10000)
	socket.emit("check", () => {
		clearTimeout(fail)
		connectionStatus.innerHTML = "connected"
		connectionStatus.disabled = false;
	})
})

sync.addEventListener("click", () => {
	syncStatus.innerHTML = "syncing..."
	sync.disabled = true;
	btn.disabled = true;
	var getRequest = db.transaction(['test'], 'readwrite').objectStore('test').getAll()
	getRequest.onsuccess = () => {
		if (getRequest.result.length != 0) {
			console.log("INDEXEDDB: unsent data detected")
			var unsentData = getRequest.result //2d array
			var fail = setTimeout(() => {
				console.log("MONGODB: unsent data send fail")
				sync.disabled = false
				btn.disabled = false
				syncStatus.innerHTML = "unsent data detected, sync failed"
			}, 10000)
			socket.emit("sync", unsentData, () => { //double submit issue be warned
				clearTimeout(fail);
				console.log("MONGODB: unsent data send success")
				var deleteRequest = db.transaction(['test'], 'readwrite').objectStore('test').clear();
				deleteRequest.onerror = function(event) {
					console.log('INDEXEDDB: clear failed');
				};
				deleteRequest.onsuccess = function() {
					console.log("INDEXEDDB: values cleared")
				}
				btn.disabled = false
				sync.disabled = false
				syncStatus.innerHTML = "unsent data detected, sync success"
			})
		} else {
			syncStatus.innerHTML = "unsent data not detected"
			btn.disabled = false
			sync.disabled = false
		}
	}
})



btn.addEventListener("click", () => {
	submitStatus.innerHTML = "sending...";
	btn.disabled = true; //temp fix for double submit
	sync.disabled = true;
	var fail = setTimeout(() => {
		console.log("MONGODB: data send fail")
		//push to indexeddb
		var pushRequest = db.transaction(['test'], 'readwrite').objectStore('test').add({ userData: text.value });
		pushRequest.onsuccess = function(event) {
			console.log('INDEXEDDB: The data has been written successfully');
		};
		pushRequest.onerror = function(event) {
			console.log('INDEXEDDB: The data failed to write'); //yikes
		}
		btn.disabled = false
		sync.disabled = false
		submitStatus.innerHTML = "submit and sync failed"
	}, 10000)
	socket.emit("data", text.value, () => {
		clearTimeout(fail);
		console.log("MONGODB: data send success")
		submitStatus.innerHTML = "data send success"
		var getRequest = db.transaction(['test'], 'readwrite').objectStore('test').getAll()
		getRequest.onsuccess = function() {
			if (getRequest.result.length != 0) {
				console.log("INDEXEDDB: unsent data detected")
				var unsentData = getRequest.result //2d array
				var fail = setTimeout(() => {
					console.log("MONGODB: unsent data send fail")
					submitStatus.innerHTML += ", sync failed"
				}, 10000)
				socket.emit("sync", unsentData, () => { //double submit issue be warned
					clearTimeout(fail);
					console.log("MONGODB: unsent data send success")
					submitStatus.innerHTML += ", sync success";
					var deleteRequest = db.transaction(['test'], 'readwrite').objectStore('test').clear();
					deleteRequest.onerror = function(event) {
						console.log('INDEXEDDB: clear failed');
					};
					deleteRequest.onsuccess = function() {
						console.log("INDEXEDDB: values cleared")
					}
				})
			} else {
				submitStatus.innerHTML += ", nothing to sync"
			}
		}
		btn.disabled = false;
		sync.disabled = false;
	});
});