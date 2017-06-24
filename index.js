var express = require('express');
var cors = require('cors') // Cross Origin Resource Sharing
var app = express();
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('db-app');

// Encrypt password
var bcrypt = require('bcrypt');
const saltRounds = 10;

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(cors());

// load index page
app.get('/', function(request, response) {
  response.render('pages/index');
});

// GET all of the users
app.get('/users', function(req, res){
  var sql = "SELECT id,fname,lname,email,location from users";
  db.all(sql, function(err,rows){
    res.end(JSON.stringify(rows));
  });

});

// GET a particular user
app.get('/user/:user_id', function(req, res){
  var sql = "SELECT id,fname,lname,email,location from users WHERE id="+req.params.user_id;
  db.all(sql, function(err,rows){
    res.end(JSON.stringify(rows));
  });

});

// GET all of the events
app.get('/events', function(req, res){
  // var sql = "SELECT * from events";
  var sql = "SELECT events.id, events.title, events.description, events.location, events.startdate, events.starttime, events.enddate, events.endtime, events.type, events.user_id, users.fname, users.lname from events INNER JOIN users ON events.user_id=users.id";
  db.all(sql, function(err,rows){
    res.end(JSON.stringify(rows));
  });

});

// GET all of the events of a particular user
app.get('/events/users/:user_id', function(req, res){
  var sql = "SELECT * from events WHERE user_id="+req.params.user_id;
  db.all(sql, function(err,rows){
    res.end(JSON.stringify(rows));
  });

});

// GET all data from the users_events (junction table)
app.get('/users_events', function(req, res){
  var sql = "SELECT * from users_events";
  db.all(sql, function(err,rows){
    res.end(JSON.stringify(rows));
  });

});

// GET all users inside of a particular event
app.get('/users_events/:event_id', function(req, res){
  // console.log(req.params.event_id); 
  var sql = "SELECT * from users INNER JOIN users_events ON users_events.user_id=users.id WHERE users_events.event_id="+req.params.event_id;
  db.all(sql, function(err,rows){
    res.end(JSON.stringify(rows));
  });

});

// POST user login
app.post('/login', function(req, response){
  var email = req.body.email; var password = req.body.password;

  db.get("SELECT * FROM users WHERE email = ?", email, function(err, row) {
    if(!row){
      response.send(false);
      console.log("Wrong email");  
    }else {
      bcrypt.compare(password, row.password, function(err, res) {
        if(res == true){
          // console.log(row);
          response.send(row);
          console.log("Correct password");
        }else {
          response.send(res);
          console.log("Wrong password");
        } 
      });
    }

  });
});

// POST user registration
app.post('/signup', function(req, res){
  var fname = req.body.fname; var lname = req.body.lname; var location = req.body.location;
  var email = req.body.email; var password = req.body.password;
  var confpassword = req.body.confpassword;

  db.serialize(function() {
    var stmt = db.prepare("INSERT INTO users (fname, lname, email, location, password) VALUES(?,?,?,?,?)");

    bcrypt.hash(password, saltRounds, function(err, hash) {
      // Store hash in your password DB. 
      stmt.run(fname,lname,email,location,hash);
      stmt.finalize();
    });
  });

  console.log(email + ' ' + fname + ' ' + lname + ' ' + location + ' ' + password);
  // res.send(email + ' ' + fname + ' ' + lname + ' ' + location + ' ' + password);
});

// POST users join events
app.post('/join_events', function(req, res){
  var user_id = req.body.user_id;
  var event_id = req.body.event_id;

  db.serialize(function() {
    var stmt = db.prepare("INSERT INTO users_events (user_id, event_id) VALUES(?,?)");
    stmt.run(user_id, event_id);
    stmt.finalize();
  });

  console.log(user_id+ ", " + event_id);
});

// POST create events by users
app.post('/create_events', function(req, res){
  var title = req.body.title; var description = req.body.description; var location = req.body.location;
  var startdate = req.body.startdate; var starttime = req.body.starttime;
  var enddate = req.body.enddate; var endtime = req.body.endtime; var type = req.body.type;
  var user_id = req.body.user_id;

  db.serialize(function() {
    var stmt = db.prepare("INSERT INTO events (title, description, location, startdate, starttime, enddate, endtime, type, user_id) VALUES(?,?,?,?,?,?,?,?,?)");
    stmt.run(title,description,location,startdate,starttime,enddate,endtime,type,user_id);
    stmt.finalize();
  });

  console.log(title+ ", " + description+ ", " + location+ ", " + startdate+ ", " + starttime+ ", " + enddate+ ", " + endtime+ ", " + type+ ", " + user_id);
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


