var fs = require('fs');
var path = require('path');
var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;

var app = express();
var port = process.env.PORT || 3000;

var mongoHost = process.env.MONGO_HOST;
var mongoPort = process.env.MONGO_PORT || 27017;
var mongoUser = process.env.MONGO_USER;
var mongoPassword = process.env.MONGO_PASSWORD;
var mongoDBName = process.env.MONGO_DB_NAME;

var mongoUrl = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDBName}`;
var db = null;

app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());

app.use(express.static('public'));

app.get('/', function (req, res, next) {
  res.status(200).render('homePage');
});

app.get('/people', function (req, res, next) {
  var collection = db.collection('people');
  collection.find({}).toArray(function (err, people) {
    if (err) {
      res.status(500).send({
        error: "Error fetching people from DB"
      });
    } else {
      console.log("== people:", people);
      res.status(200).render('peoplePage', {
        people: people
      });
    }
  });
});

app.get('/people/:person', function (req, res, next) {
  var person = req.params.person.toLowerCase();
  var collection = db.collection('people');
  collection.find({ personId: person }).toArray(function (err, people) {
    if (err) {
      res.status(500).send({
        error: "Error fetching people from DB"
      });
    } else if (people.length < 1) {
      next();
    } else {
      console.log("== people:", people);
      res.status(200).render('photoPage', people[0]);
    }
  });
});

app.post('/people/:person/addPhoto', function (req, res, next) {
  var person = req.params.person.toLowerCase();
  if (req.body && req.body.url && req.body.caption) {
    var collection = db.collection('people');
    var photo = {
      url: req.body.url,
      caption: req.body.caption
    };
    collection.updateOne(
      { personId: person },
      { $push: { photos: photo } },
      function (err, result) {
        if (err) {
          res.status(500).send({
            error: "Error inserting photo into DB"
          });
        } else {
          console.log("== update result:", result);
          if (result.matchedCount > 0) {
            res.status(200).send("Success");
          } else {
            next();
          }
        }
      }
    );
  } else {
    res.status(400).send("Request needs a body with a URL and caption");
  }
});

app.get('*', function (req, res, next) {
  res.status(404).render('404');
});

MongoClient.connect(mongoUrl, function (err, client) {
  if (err) {
    throw err;
  }
  db = client.db(mongoDBName);
  app.listen(port, function () {
    console.log("== Server listening on port", port);
  });
});
