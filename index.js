const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);


/* ==== MONGO CONNNECTION ==== */
// Connection URL
const url = 'mongodb+srv://user:qDlRtO6QhwKKuQU5@cluster0-3ugw8.mongodb.net/admin?retryWrites=true&w=majority';

// Database Name
var dbName = 'myproject';

/* ==== NODE SERVER ==== */

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get(RegExp(".+"), (req, res) => {
  res.sendFile(__dirname + req.url);
});

io.on('connect', (socket) => {
  console.log('a user connected');
  socket.on("clear", () => {
    var client = new MongoClient(url);
    client.connect((err) => {
			assert.equal(null, err);
			console.log("SERVER+MONGO: Connected correctly to server");
			var db = client.db(dbName);
      var collection = db.collection('documents')
			collection.deleteMany();
			client.close();
		});
  })
  socket.on("data", (data,cb) => {
    console.log(data)
    //add data to db
    var client = new MongoClient(url);
		client.connect((err) => {
			assert.equal(null, err);
			console.log("SERVER+MONGO: Connected correctly to server");
			var db = client.db(dbName);
      var collection = db.collection('documents')
			collection.insertOne({
				userData : data
			}, (err, result) => {
				console.log("SERVER+MONGO: Inserted 1 documents into the collection");
        cb();
			});
			client.close();
		});
  });


  socket.on("sync", (data,cb) => {
    console.log(data)
    //add data to db
    var client = new MongoClient(url);
		client.connect((err) => {
			assert.equal(null, err);
			console.log("SERVER+MONGO: Connected correctly to server");
			var db = client.db(dbName);
      var collection = db.collection('documents')
			collection.insertMany(data, (err, result) => {
				console.log("SERVER+MONGO: Inserted unsent data into collection");
        cb();
			});
			client.close();
		});
  });

	socket.on("check", (cb) => {
		cb()
	})


  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});




//https://mongodb.github.io/node-mongodb-native/3.3/quick-start/quick-start/

/* ==== NODE SERVER ==== */
http.listen(3000, function(){
	console.log('listening on *:3000');
});