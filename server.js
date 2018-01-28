// Include our packages in our main server file
var express = require('express');
app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var passport = require('passport');
var config = require('./config/main');
var User = require('./app/models/user');
var jwt = require('jsonwebtoken');
var port = 3000;

// Use body-parser to get POST requests for api Use
app.use(bodyParser.urlencoded({ extended:false }));
app.use(bodyParser.json());

// Log requests to console
app.use(morgan('dev'));

// Initialze Passport for use
app.use(passport.initialize());

// connect to database
mongoose.connect(config.database);

// Bring in passport strategy 
require('./config/passport')(passport);

// Create API group routes
var apiRoutes = express.Router();

// Register new users
 apiRoutes.post('/register', function(req, res){
    if(!req.body.firstname){
        res.json({ success: false, message: 'firstname is required.' });
    }
    else if(!req.body.email){
        res.json({ success: false, message: 'email is required.' });
    }
    else if(!req.body.password){
        res.json({ success: false, message: 'password is required.' });
    } else {
        var newuser = new User({
            firstname: req.body.firstname,
            email: req.body.email,
            password: req.body.password
        });

        // Attempt to save the new user
        newuser.save(function(err){
            if(err){
                return res.json(err.message);
                // return res.json({ success: false, message: 'That email address already exisit.' });
            }
            res.json({ success: true, message: 'Successfully created new user.' });
        });
    }
 });

// Authenticate the user and get a JWT
apiRoutes.post('/authenticate', function(req, res){
    User.findOne({
        email: req.body.email
    }, function(err, user){
        if(err) throw err;

        if(!user) {
            res.send({ success: false, message: 'Authentication failed. User not found.' });
        } else {
            user.comparePassword(req.body.password, function(err, isMatch){
                if(isMatch && !err) {
                    // Create the token
                    var token = jwt.sign(user.id, config.secret);
                    res.json({ success: true, token: 'Bearer ' + token });
                } else {
                    res.send( { success: false, message: 'Authentication failed. Password did not match.' });
                }
            });
        }
    });
});

// Protected dashbord route with JWT
apiRoutes.get('/dashboard', passport.authenticate('jwt', { session: false }), function(req, res){
    res.send('It Worked User id is : ' + req.user._id + '.');
});

// Set url for API group routes
app.use('/api', apiRoutes);

// Home route
app.get('/', (req, res) => {
    res.send('Relax. We will put the home page here later.')
});

app.listen(port);
console.log('Your server is running on port ' + port + '.')