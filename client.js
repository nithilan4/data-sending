/* ====INDEXEDDB SETUP START==== */
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;

window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

var db;

var dbPromise = window.indexedDB.open('test', 1);

dbPromise.onerror = function(event) {
	console.dir(event);
  console.log("indexeddb open error")
};
dbPromise.onsuccess = function(event) {
	db = dbPromise.result;
	console.log('INDEXEDDB: The database is opened successfully');
};

dbPromise.onupgradeneeded = function(event) {
	db = event.target.result;
	var objectStore;
	if (!db.objectStoreNames.contains('test')) {
		objectStore = db.createObjectStore('test', { keyPath: "_id" });
		objectStore.createIndex('userData', 'userData', { unique: false });
		console.log("INDEXEDDB: object store nonexistent, new one created");
	} else {
		objectStore = db.transaction(['test'], 'readwrite').objectStore('test');
		console.log("INDEXEDDB: object store present");
	}
}
/* ====INDEXEDDB SETUP END==== */

var text = document.getElementById("text");
var btn = document.getElementById("button");
var id = document.getElementById("id")
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

setInterval(() => {
  if (socket.connected) {
    connectionStatus.innerHTML = "connected"
  } else {
    connectionStatus.innerHTML = "disconnected"
  }
}, 1000)



sync.addEventListener("click", syncFunction)



btn.addEventListener("click", () => {
	var pushRequest = db.transaction(['test'], 'readwrite').objectStore('test').add({ _id: id.value, userData: text.value });
		pushRequest.onsuccess = function(event) {
			console.log('INDEXEDDB: The data has been written successfully');
		};
		pushRequest.onerror = function(event) {
			console.log('INDEXEDDB: The data failed to write'); //yikes
			console.log(event)
		}
	syncFunction();
});

function syncFunction () {
	var getRequest = db.transaction(['test'], 'readwrite').objectStore('test').getAll()
	getRequest.onsuccess = () => {
		if (getRequest.result.length != 0) {
			console.log("INDEXEDDB: unsent data detected")
			var unsentData = getRequest.result //2d array
			var fail = setTimeout(() => {
				console.log("MONGODB: unsent data sync fail")
			}, 10000)
			socket.emit("sync", unsentData, (data) => { //double submit issue be warned
				console.log("MONGODB: sent data")
        clearTimeout(fail);
			})
		} else {
			console.log("INDEXEDDB: unsent data not detected")
		}
	}
}