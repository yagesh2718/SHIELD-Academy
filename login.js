import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import pkg from "pg";
const { Pool } = pkg;
import { fileURLToPath } from 'url';
import session from "express-session";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "avishkar-2",
  password: "shreyansh16feb2004",
  port: 4000,
});
app.use(session({
  secret: "your_secret_key",
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());


async function authenticateUser(email, password, value) {
  let user = null;

  // Define the query based on the role
  const query = value === 'student'
      ? 'SELECT * FROM student WHERE email = $1'
      : 'SELECT * FROM instructors WHERE email = $1';

  try {
      // Execute the query to find the user by email and role
      const result = await pool.query(query, [email]);
      console.log("result",result);

      if (result.rows.length > 0) {
          user = result.rows[0];
          console.log("user result",user);

          // Use bcrypt to compare the input password with the hashed password in the database
          const isMatch = await bcrypt.compare(password, user.password);
          console.log("password is mathed",isMatch);
          if (isMatch) {
              return user; // Return the user if the password matches
          }
      }

      return null; // Return null if no user or password mismatch
  } 
  catch (error) {
      console.error('Error authenticating user:', error);
      return null;
  }
}


app.get('/', (req, res) => {
  res.redirect('/login'); // Redirects to login page
});

app.get('/login', (req, res) => {
  res.render('login');
});

// Route to handle login form submission
app.post('/login', async (req, res) => {
  const { email, password, value } = req.body;
  console.log("Received login request with:", email, password, value);
  const user = await authenticateUser(email, password, value);

  if (user) {
    // Render dashboard based on role
    if (value === 'student') {
        res.render('home', { user });
    } else if (value === 'instructor') {
        res.render('instructor-dashboard', { user });
    }
} else {
    // Handle failed login or user not found
    res.redirect('/login?error=invalid_credentials');
}
});

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login'); // Redirect to login if not authenticated
}

app.get('/home', isAuthenticated, (req, res) => {
  if (req.user.role === 'student') {
    res.render('home', { user: req.user }); // Render the home page with user data
  } else {
    res.redirect('/login'); // Redirect to login if the role is not student
  }
});



// Route for the dashboard (protected route)
app.get('/dashboard', (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/login');
  res.send(`Hello, ${req.user.displayName}! Welcome to your dashboard.`);
});

// Route to handle logout
app.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
});


// Route for the signup page
app.get('/signup', (req, res) => {
  res.render('signup');
});
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
      // Check if the student already exists
      const existingStudent = await pool.query('SELECT * FROM student WHERE email = $1', [email]);
      
      if (existingStudent.rows.length > 0) {
          // Student already exists
          res.redirect('/login');
          return res.status(400).send('Account already exists with this email address.');
      }

      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert student info into the database
      await pool.query(
          'INSERT INTO student (name, email, password) VALUES ($1, $2, $3)',
          [name, email, hashedPassword]
      );
      res.status(201).send('Student registered successfully!');
  } catch (error) {
      console.error('Error inserting data:', error);
      res.status(500).send('Error registering student');
  }
});
passport.use(new GoogleStrategy({
  clientID:process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
},
async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    const displayName = profile.displayName;

    // Check if the user is a student
    const studentResult = await pool.query('SELECT * FROM student WHERE email = $1', [email]);

    if (studentResult.rows.length > 0) {
      return done(null, { ...studentResult.rows[0], role: 'student' });
    }
    const placeholderPassword = await bcrypt.hash('google_auth_placeholder', 10);
    // Check if the user is an instructor
    const instructorResult = await pool.query('SELECT * FROM instructors WHERE email = $1', [email]);
    if (instructorResult.rows.length > 0) {
      return done(null, { ...instructorResult.rows[0], role: 'instructor' });
    } try {
      // Insert new student record with Google signup
      await pool.query(
        'INSERT INTO student (name, email) VALUES ($1, $2)',
        [displayName, email,placeholderPassword]
      );
      return done(null, { email, name: displayName, role: 'student' });
    } 

    // User is not found in the database
    catch (error) {
      console.error('Error creating new student:', error);
      return done(error);
    }
  }));
// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, { email: user.email, role: user.role});
});

// Deserialize user from session
passport.deserializeUser(async (user, done) => {
  try {
    const query = user.role === 'student'
      ? 'SELECT * FROM student WHERE email = $1'
      : 'SELECT * FROM instructors WHERE email = $1';

    const result = await pool.query(query, [user.email]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback route after Google authenticates the user
app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login?error=invalid_credentials' }),
  (req, res) => {
    if (req.user.role === 'student') {
      return res.redirect('/home');
    } else if (req.user.role === 'instructor') {
      return res.redirect('/instructor-dashboard');
    } else {
      res.redirect('/login'); // Redirect if user is neither student nor instructor
    }
  }
);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
