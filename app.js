// shivam kumar
const path = require('path');
const express = require('express');
// const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore= require('connect-mongodb-session')(session);    // exception  constructor-function
const csurf=require('csurf');
const flash=require('connect-flash');
const multer=require('multer');

console.log(process.env.MONGO_DB);
const User = require('./models/user');                              

const app = express();

// setting view to ejs
app.set('view engine', 'ejs');
app.set('views', 'views');      // key, folder_name

// setting all variables to be used later in app.js
const csrfProtection=csurf();       // returns a middleware function name
const flashMsg = flash();
const MONGODB_URI= `mongodb://localhost:${process.env.MONGO_PORT.trim()}/${process.env.MONGO_DB.trim()}`;    // space from .json
// mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false

const store= new MongoDBStore({       // important
  uri: MONGODB_URI,                   // uri and collection are fixed
  collection: 'sessions'
});

// getting all routes/middleware to app.js-> later to be called as required
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const errorController = require('./controllers/error');

app.use(express.urlencoded({ extended: false }));

// for taking single image from name='imageUrl'
const fileStore= multer.diskStorage({
  destination: (req, file, cbFunc) => {
    cbFunc(null, 'images');
  },
  filename: (req, file, cbFunc) => {
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cbFunc(null, uniquePrefix + '-' + file.originalname);
  }
});

const fileFilter=(req, file, cbFunc)=>{
  if(file.mimetype === 'image/jpeg' || file.mimetype=== 'image/apng' || file.mimetype=== 'image/png' || file.mimetype=== 'image/gif' || file.mimetype=== 'image/svg+xml'){
    cbFunc(null, true);
  }else{
    cbFunc(null, false);
  }
};

app.use(multer({storage: fileStore, fileFilter: fileFilter}).single('imageUrl'));

// making these available on web
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// setting the session variable
app.use(
  session({
    secret: 'secret word', 
    resave: false, 
    saveUninitialized: false,
    store: store
  })
);
app.use(csrfProtection);      //csrf middleware used
app.use(flashMsg);

// getting user from session for easy access from controllers (req.user)
app.use((req, res, next) => {
  if(!req.session.user){
    return next();                // without next it can't execute other middleware
  }

  User.findById(req.session.user._id)  
    .then(user => {
      if(!user){
        return next();
      }
      req.user = user;    // to get all magic methods working
      next();
    })
    .catch((err) => {
      const error= new Error(err);
      error.httpStatusCode=500;
      next(error);
    });
});

// set locals to be used by all views(.ejs)
app.use((req, res, next) => {                   //should run for all requests
  res.locals.csrf_token = req.csrfToken();
  res.locals.isAuthenticated = req.session.isLogedIn;
  next();
});

// all major working routes
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);  

app.get('/500', errorController.get500);
app.use(errorController.get404);

// technical error handler (.catch())
app.use((error, req, res, next) => {
  console.log(error);
  res.status(500).render('500', {
    pageTitle: 'Tech Error',
    path: '/500'
  });
});

// connecting with database to be used
// keeping the app to listen requests always
mongoose
  .connect(MONGODB_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      useFindAndModify: false   // for `findOneAndUpdate()` and `findOneAndDelete()` to work without DeprecationWarning
    }
  )
  .then(result=>{
    console.log("connected with database");
    app.listen(process.env.PORT || 80);
  })
  .catch(err => {
    console.log(err);
  });
