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
  var sql = "SELECT * from users";
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
          response.send(res);
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

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


