var express = require('express');
var cors = require('cors') // Cross Origin Resource Sharing
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('db-app');
var path = require('path');
var fs = require('fs');
var async = require('async');

// Encrypt password
var bcrypt = require('bcrypt');
const saltRounds = 10;

var bodyParser = require('body-parser');
var multer  = require('multer');
var upload = multer({ dest: 'uploads/' })

var app = express();

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
  var sql = "SELECT id,fname,lname,profile_pic,cover_pic,email,location from users";
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
  var sql = "SELECT events.id, events.title, events.description, events.location, events.city, events.imgName, events.startdate, events.starttime, events.enddate, events.endtime, events.type, events.user_id, users.fname, users.lname from events INNER JOIN users ON events.user_id=users.id";
  db.all(sql, function(err,rows){
    res.end(JSON.stringify(rows));
  });

});

// GET all of the events in a particular city (CASE INCENSITIVE)
app.get('/events/:city_name', function(req, res){
  var sql = "SELECT events.id, events.title, events.description, events.location, events.city, events.imgName, events.startdate, events.starttime, events.enddate, events.endtime, events.type, events.user_id, users.fname, users.lname from events INNER JOIN users ON events.user_id=users.id WHERE city='"+req.params.city_name+"' COLLATE NOCASE";
  db.all(sql, function(err,rows){
    res.end(JSON.stringify(rows));
  });

});

// GET a particular event
app.get('/event/:event_id', function(req, res){
  var sql = "SELECT * from events WHERE id="+req.params.event_id;
  db.get(sql, function(err,rows){
    res.end(JSON.stringify(rows));
  });

});

// GET my events of a user
app.get('/my_events/:user_id', function(req, res){
  var sql = "SELECT events.id, events.title, events.description, events.location, events.city, events.imgName, events.startdate, events.starttime, events.enddate, events.endtime, events.type, events.user_id, users.fname, users.lname from events INNER JOIN users ON events.user_id="+ req.params.user_id +" WHERE events.user_id=" + req.params.user_id + " AND users.id="+req.params.user_id;
  db.all(sql, function(err,rows){
    res.end(JSON.stringify(rows));
  });

});

// GET upcoming events of a user
app.get('/upcoming_events/:user_id', function(req, res){
  var sql = "SELECT events.id, events.title, events.description, events.location, events.city, events.imgName, events.startdate, events.starttime, events.enddate, events.endtime, events.type, events.user_id, users.fname, users.lname from events INNER JOIN users_events ON events.id=users_events.event_id INNER JOIN users ON events.user_id=users.id WHERE users_events.user_id="+req.params.user_id;
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
  var confpassword = req.body.confpassword; var defaultUserPic = "user_default.png";
  var cover_pic = "cover_default.png";

  db.serialize(function() {
    var stmt = db.prepare("INSERT INTO users (fname, lname, profile_pic, cover_pic, email, location, password) VALUES(?,?,?,?,?,?,?)");

    bcrypt.hash(password, saltRounds, function(err, hash) {
      // Store hash in your password DB. 
      if(err) {
        res.sendStatus(500);
      }else{
        stmt.run(fname,lname,defaultUserPic,cover_pic,email,location,hash);
        stmt.finalize();
        res.sendStatus(202);
      }
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
    res.sendStatus(202);
  });

  console.log(user_id+ ", " + event_id);
});

// DELETE: event owner cancels an event (no host, event is removed)
app.delete('/cancel_event/:user_id/:event_id/:owner_id', function(req, res){
  var user_id = req.params.user_id;
  var event_id = req.params.event_id;
  var owner_id = req.params.owner_id;
  var proceed = false;

  console.log("USER ID: " + user_id+ ", " + " EVENT ID: " + event_id + " OWNER ID: " + owner_id);

  var sql1 = "DELETE FROM events WHERE user_id="+user_id+" AND id="+event_id;
  var sql2 = "DELETE FROM users_events WHERE event_id="+event_id;
  var sql3 = "DELETE FROM users_events WHERE user_id="+user_id+" AND event_id="+event_id;

  db.serialize(function() {
    // If an owner cancels the event, remove data from events table too
    if(owner_id==user_id){

      var asyncOps = [
        function (done) {
          console.log('1. First Query-');
          // DELETE a particular event
          db.run(sql1, function(error) {
            if (error) {
              return done(error);
              console.log(error);
            }
            console.log('All done 1');
            done(null, true);
          });
        },
        function (done) {
          console.log('2. Second Query-');
          // DELETE all people within an event
          db.run(sql2, function(error) {
            if (error) {
              return done(error);
              console.log(error);
            }
            else {
              console.log('All done 2');
              done(null, true);
            }
          });
        }
      ];

      async.series(asyncOps, function (err, results) {
          if (err) return console.log(err);
          res.send(JSON.stringify({ "data": "successfully deleted record" }));
          console.log("Successfully delete record from USER_EVENTS table!");
      });

    }else {

      // DELETE a person within an event
      db.run(sql3, function(error) {
        if (error) {
          console.log(error);
        }
        else {
          res.send(JSON.stringify({ "data": "successfully deleted record" }));
          console.log("Successfully delete record from USERS_EVENTS table!");
        }
      });
    }
  });

});

// PUT: update user password
app.put("/edit_pass/:user_id", function(req, response) {
  var user_id = req.params.user_id;
  var old_pass = req.body.old_pass;
  var new_pass = req.body.new_pass;

  console.log(user_id, old_pass, new_pass);

  var sql = "SELECT password from users WHERE id="+user_id;
  db.get(sql, function(err, row) {
    if(!row){
      response.send(false);
      console.log("No user found");  
    }else {
      // Check the old password
      bcrypt.compare(old_pass, row.password, function(err, res) {
        if(res == true){

          // if the old pass matches, begin hashing the new password
          bcrypt.hash(new_pass, saltRounds, function(err, hash) {
            if(err) {
              res.sendStatus(500);
            }else{
              // update the old pass to the new hashed password
              console.log("Correct password");
              db.run("UPDATE users SET password = ? WHERE id = ?", hash, user_id, function(error) {
                if (error) {
                  response.send(false);
                  console.log(error);
                }
                else {
                  response.send(true);
                }
              });
            }
          });

        }else {
          response.send(res);
          console.log("Wrong password");
        } 
      });
    }

  });
});

// PUT: update user details
app.put("/edit_user/:user_id", function(req, res) {
  var user_id = req.params.user_id;
  var fname = req.body.fname; var lname = req.body.lname; var location = req.body.location;
  var email = req.body.email;
  var user_pic = req.body.user_pic;
  var cover_pic = req.body.cover_pic;

  console.log(fname, lname, email, location, user_pic, cover_pic);
  db.run(
    "UPDATE users " +
    "SET fname = case when coalesce(?, '') = '' then fname else ? end," +
    " lname = case when coalesce(?, '') = '' then lname else ? end," +
    " email = case when coalesce(?, '') = '' then email else ? end," +
    " location = case when coalesce(?, '') = '' then location else ? end, " +
    " cover_pic = case when coalesce(?, 'null') = 'null' then cover_pic else ? end," +
    " profile_pic = case when coalesce(?, 'null') = 'null' then profile_pic else ? end " +
    "WHERE id = ?"
    , fname,fname,lname,lname,email,email,location,location,cover_pic,cover_pic,user_pic,user_pic,user_id, function(error) {
    if (error) {
      res.sendStatus(404);
      console.log(error);
    }
    else {
      res.sendStatus(200);
    }
  });
});

// Return user image
app.get('/user_image/:img_name', function (req, res) {
  res.sendFile(path.resolve('./user_picture/'+req.params.img_name));
});

// Upload user image
app.post("/user_img_upload", upload.single("file"), function(req, res) {
  console.log(req.file);

  // rename the file into an appropriate name
  fs.rename(req.file.path, 'user_picture/'+req.file.originalname, function(err) {
    if ( err ) {
      console.log('ERROR: ' + err);
      res.sendStatus(500);
    } else {
      console.log("Renamed successfully");
      res.sendStatus(202);
    }
    res.end();
  });
});

// Return image
app.get('/image/:img_name', function (req, res) {
  res.sendFile(path.resolve('./uploads/'+req.params.img_name));
});

// Upload image
app.post("/img_upload", upload.single("file"), function(req, res) {
  console.log(req.file);

  // rename the file into an appropriate name
  fs.rename(req.file.path, 'uploads/'+req.file.originalname, function(err) {
    if ( err ) {
      console.log('ERROR: ' + err);
      res.sendStatus(500);
    } else {
      console.log("Renamed successfully");
      res.sendStatus(202);
    }
    res.end();
  });
});

// POST create events by users
app.post('/create_events', function(req, res){
  var title = req.body.title; var description = req.body.description; var location = req.body.location;
  var startdate = req.body.startdate; var starttime = req.body.starttime;
  var enddate = req.body.enddate; var endtime = req.body.endtime; var type = req.body.type;
  var user_id = req.body.user_id; var city = req.body.city;
  var imgName = req.body.imgName;

  db.serialize(function() {

    var sql="INSERT INTO events (title, description, location, city, imgName, startdate, starttime, enddate, endtime, type, user_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)";
    db.run(sql,title,description,location,city,imgName,startdate,starttime,enddate,endtime,type,user_id,function(err){
      if(err){
        callback({"status":false,"val":err});
        console.log("error occurred")
      }else{
        console.log("val  "+this.lastID);

        // INSERT reference to users_events junction table
        var stmt2 = db.prepare("INSERT INTO users_events (user_id, event_id) VALUES(?,?)");
        stmt2.run(user_id, this.lastID);
        stmt2.finalize();
        res.sendStatus(202);
        // callback({"status":true,"val":""});
      }
      res.end();
    });
  });

  console.log(title+ ", " + description+ ", " + location+ ", " + city + ", " + imgName + ", " + startdate+ ", " + starttime+ ", " + enddate+ ", " + endtime+ ", " + type+ ", " + user_id);
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


