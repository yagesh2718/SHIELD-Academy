import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import multer from "multer"; 
import path from "path";
import { fileURLToPath } from 'url';
import session from "express-session";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import Razorpay from 'razorpay';

import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const PORT = process.env.PORT || 4000;

// Create the server
const server = createServer(app);

const io = new Server(server);

app.use(express.static('public'));  // Serve static files from the 'public' folder


server.listen(PORT, () => {
  console.log(`💬 server on port ${PORT}`);
});

io.on('connection', (socket) => {
    console.log('A user connected: ', socket.id);
  
    socket.on('message', async (data) => {
        console.log('Message received:', data);
      
        // Insert message into the database
        const insertQuery = `
          INSERT INTO messages (user_id, course_id, message, date_time,role)
    VALUES ($1, $2, $3, $4, $5)
        `;
        const values = [data.userid, data.courseid, data.message, data.dateTime , data.role];
        await db.query(insertQuery, values);
      
        // Broadcast the message to all other clients (excluding the sender)
        socket.broadcast.emit('chat-message', data);
      });
      
  
    socket.on('disconnect', () => {
      console.log('A user disconnected: ', socket.id);
    });
  });

let messages = {};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sessionConfig = () => {
    return session({
        secret: 'yuiopqwert', 
        resave: false,
        saveUninitialized: true,
        cookie: { secure: process.env.NODE_ENV === 'production' } 
    });
};

export default sessionConfig;



app.use(bodyParser.json());
const port = 3000;

const razorpayInstance = new Razorpay({
    key_id: 'rzp_test_tdhd9eKtsQISvp', // Replace with your actual Razorpay key ID
    key_secret: 'xjIjJAAcAE0fgILJm5ayJNjf', // Replace with your actual Razorpay key secret
  });


app.use(sessionConfig());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "shield",
  password: "yash1234",
  port: 5432,
});
db.connect();
app.set('views', path.join(__dirname, 'views'));
app.set("view engine" , "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  

const upload = multer({ storage: storage });

let course_id

async function authenticateUser(email, password, role) {
    let user = null;
  
    const query = role === 'student'
        ? 'SELECT * FROM students WHERE email = $1'
        : 'SELECT * FROM instructor WHERE email = $1';
  
    try {
        const result = await db.query(query, [email]);
        if (result.rows.length > 0) {
            user = result.rows[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                return user;
            }
        }
        return null;
    } catch (error) {
        console.error('Error authenticating user:', error);
        return null;
    }
  }


app.get('/eternium', (req, res) => {
    res.render('eternium', { key_id: 'rzp_test_tdhd9eKtsQISvp' }); // Pass the key_id to client side
  });


  app.post('/createOrder', async (req, res) => {
    const { amount } = req.body; // Amount in rupees (e.g., 500 for ₹500)
    try {
      const order = await razorpayInstance.orders.create({
        amount: amount * 100, // Amount in paise
        currency: 'INR',
      });
      res.json({ orderId: order.id, amount: order.amount });
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });
  
  // Route for Payment Success page
  app.get('/success', (req, res) => {
    res.render('success', { paymentId: req.query.payment_id });
  });
  
  // Start the server
//   const PORT = process.env.PORT || 3000;
//   app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
//   });












  
  app.get('/', (req, res) => {
    res.redirect('/login');
  });
  
  app.get('/login', (req, res) => {
    res.render('login');
  });
  
 app.post('/logincourse', async (req, res) => {
    const { email, password, role } = req.body;
    const user = await authenticateUser(email, password, role);
    
    if (user) {
      req.session.userId = user.id;
      console.log("Logged-in User ID:", req.session.userId); 
  
      if (role === 'student') {
        const coursesResult = await db.query('SELECT * FROM created_courses WHERE published = true');
        const courses = coursesResult.rows;
        res.render('home',{courses,user});
      } else if (role === 'instructor') {
        res.redirect('/instructor-home');
      }
    } else {
      res.redirect('/login?error=invalid_credentials');
    }
  });
  
  app.get('/instructor-home', async (req, res) => {
    const instructorId = req.session.userId; // Replace this with your logic to get the logged-in instructor's ID
    console.log('id:',instructorId)
    try {
        // Step 1: Get the instructor's name from the instructor table
        const instructorResult = await db.query(
            `SELECT name,email FROM instructor WHERE id = $1;`,
            [instructorId]
        );

        if (instructorResult.rows.length === 0) {
            return res.status(404).send('Instructor not found');
        }

        const instructorName = instructorResult.rows[0].name;
        const instructorEmail = instructorResult.rows[0].email;
        console.log(instructorEmail);
        // Step 2: Fetch courses created by this instructor
        const coursesResult = await db.query(
            `SELECT * FROM created_courses WHERE instructor = $1;`,
            [instructorName]
        );

        const courses = coursesResult.rows;

        // Step 3: Render the instructor home page with courses
        res.render('instructor-homepage', { courses,instructorName,instructorEmail });
    } catch (error) {
        console.error('Error fetching instructor courses:', error);
        res.status(500).send('Internal Server Error');
    }
});

  
  
  function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login');
  }
  
  app.get('/check-session', (req, res) => {
    if (req.session.userId) {
      res.send(`User ID in session: ${req.session.userId}`);
    } else {
      res.send("No User ID in session");
    }
  });
  

  app.get('/home', async (req, res) => {
    const userId = req.session.userId;
    
    // Check if userId is available in session
    if (!userId) {
        return res.redirect('/login'); // Redirect to login if user is not authenticated
    }

    try {
        // Fetch user details
        const result = await db.query('SELECT name, email FROM students WHERE id = $1', [userId]);

        // Check if the user exists in the database
        if (result.rows.length === 0) {
            return res.status(404).send('User not found'); // Handle case where user is not found
        }

        const user = result.rows[0];

        // Fetch courses
        const coursesResult = await db.query('SELECT * FROM created_courses WHERE published = true');
        const courses = coursesResult.rows;

        // Render home page with courses and user data
        res.render('home', { courses, user });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

  
  app.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/login');
    res.send(`Hello, ${req.user.displayName}! Welcome to your dashboard.`);
  });
  
  app.get('/logout', (req, res) => {
    req.logout(err => {
      if (err) return next(err);
      res.redirect('/login');
    });
  });
  
  app.get('/signup', (req, res) => {
    res.render('signup');
  });
  
  app.post('/signup', async (req, res) => {
    const { name, email, password, role } = req.body;
  
    try {
        const existingUser = await db.query(
          role === 'student'
            ? 'SELECT * FROM students WHERE email = $1'
            : 'SELECT * FROM instructor WHERE email = $1',
          [email]
        );
  
        if (existingUser.rows.length > 0) {
            res.redirect('/login');
            return res.status(400).send('Account already exists with this email address.');
        }
  
        const hashedPassword = await bcrypt.hash(password, 10);
  
        await db.query(
            role === 'student'
              ? 'INSERT INTO students (name, email, password) VALUES ($1, $2, $3)'
              : 'INSERT INTO instructor (name, email, password) VALUES ($1, $2, $3)',
            [name, email, hashedPassword]
        );
        res.redirect('/login');
    } catch (error) {
        console.error('Error inserting data:', error);
        res.status(500).send('Error registering user',error);
    }
  });
  
  passport.use(new GoogleStrategy({
    clientID:"569931007438-hhg2j74jno8phqdmg815lco0ckfsvoem.apps.googleusercontent.com",
  clientSecret: "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",
  callbackURL: "http://localhost:3000/auth/google/secrets",
  },
  async (accessToken, refreshToken, profile, done) => {
      const email = profile.emails[0].value;
      const displayName = profile.displayName;
  
      const studentQuery = 'SELECT * FROM students WHERE email = $1';
      const instructorQuery = 'SELECT * FROM instructor WHERE email = $1';
  
      try {
          const studentResult = await db.query(studentQuery, [email]);
          if (studentResult.rows.length > 0) {
            return done(null, { ...studentResult.rows[0], role: 'student' });
          }
  
          const instructorResult = await db.query(instructorQuery, [email]);
          if (instructorResult.rows.length > 0) {
            return done(null, { ...instructorResult.rows[0], role: 'instructor' });
          }
  
          await db.query('INSERT INTO students (name, email, password) VALUES ($1, $2, $3)', 
            [displayName, email, await bcrypt.hash('google_auth_placeholder', 10)]
          );
          return done(null, { email, name: displayName, role: 'student' });
  
      } catch (error) {
          console.error('Error creating new user:', error);
          return done(error);
      }
  }));
  
  passport.serializeUser((user, done) => {
    done(null, { email: user.email, role: user.role });
  });
  
  passport.deserializeUser(async (user, done) => {
    const query = user.role === 'student'
      ? 'SELECT * FROM students WHERE email = $1'
      : 'SELECT * FROM instructor WHERE email = $1';
  
    try {
      const result = await db.query(query, [user.email]);
      done(null, result.rows[0]);
    } catch (error) {
      done(error, null);
    }
  });
  
  app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );
  
  app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login?error=invalid_credentials' }),
    async (req, res) => {
      try {
        // Extract email from Google authentication response
        const email = req.user.email; // Assuming req.user contains the email
  
        // Fetch the student's ID from the database using email
        
  
        // Redirect based on the user's role
        if (req.user.role === 'student') {
            const result = await db.query('SELECT id FROM students WHERE email = $1', [email]);
  
        if (result.rows.length === 0) {
          // If the user is not found in the database, redirect to login
          return res.redirect('/login?error=user_not_found');
        }
  
        // Set userId in the session
        req.session.userId = result.rows[0].id;
          return res.redirect('/home');
        } else if (req.user.role === 'instructor') {
            const result = await db.query('SELECT id FROM instructor WHERE email = $1', [email]);
  
        if (result.rows.length === 0) {
          // If the user is not found in the database, redirect to login
          return res.redirect('/login?error=user_not_found');
        }
  
        // Set userId in the session
        req.session.userId = result.rows[0].id;
          return res.redirect('/instructor-homepage');
        } else {
          res.redirect('/login');
        }
      } catch (error) {
        console.error('Error retrieving user ID:', error);
        res.redirect('/login?error=server_error');
      }
    }
  );
  



app.get('/create-course', (req, res) => {
   
    const courseData = {
        courseTitle: '',
        subheading: '',
        description: '',
        level: 'beginner', 
        price: '',
        category: 'combat' 
    };

    res.render('create-course', courseData);
});

app.post('/course-overview', upload.single('thumbnail'), async (req, res) => {
    const { courseTitle, subheading, description, level, price, category } = req.body;
    const thumbnailPath = req.file ? `/uploads/${req.file.filename}` : null; 

    try {
        const instructorResult = await db.query(
            `SELECT name FROM instructor WHERE id = $1;`,
            [req.session.userId]
        );

        if (instructorResult.rows.length === 0) {
            return res.status(404).send('Instructor not found');
        }

        const instructorUsername = instructorResult.rows[0].name;

        const query = `
            INSERT INTO created_courses (title, subheading, description, level, price, category, thumbnail, user_id, instructor)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id;
        `;
        const values = [courseTitle, subheading, description, level, price, category, thumbnailPath, req.session.userId, instructorUsername];
        const result = await db.query(query, values);

        const courseId = result.rows[0].id; 

        res.redirect(`/course-overview/${courseId}`);
    } catch (error) {
        console.error('Error inserting course:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.get("/course-overview/:courseId", async (req, res) => {
    const courseId = req.params.courseId;
    course_id = courseId

    try {
        const courseResult = await db.query(
            "SELECT * FROM created_courses WHERE id = $1;",
            [courseId]
        );

        if (courseResult.rows.length > 0) {
            const course = courseResult.rows[0];

            const sectionsResult = await db.query(
                "SELECT * FROM sections WHERE course_id = $1;", 
                [courseId]
            );
            const instructorName = course.instructor;
            const instructorResult = await db.query(
                `SELECT email FROM instructor WHERE name = $1;`,
                [instructorName]
            );
    
            const instructorEmail = instructorResult.rows[0].email;

            const sections = sectionsResult.rows;
            res.render("cli", { course, sections ,instructorName,instructorEmail });
        } else {
            res.status(404).send("Course not found");
        }
    } catch (error) {
        console.error("Error fetching course overview:", error);
        res.status(500).send("Error fetching course overview");
    }
});


app.get(`/add-section`,(req,res)=>{
    res.render('addsection')
})

app.post('/upload', upload.single('video'), async (req, res) => {
    const { title, description, pdf_link } = req.body; 
    const videoPath = req.file ? `/uploads/${req.file.filename}` : null; 
    try {
       
        const result = await db.query(
            "INSERT INTO sections (section_name, section_description, pdf_link, video_path, course_id) VALUES ($1, $2, $3, $4, $5);",
            [title, description, pdf_link, videoPath, course_id]
        );

        res.redirect(`/course-overview/${course_id}`);
    } catch (error) {
        console.error("Error uploading section:", error);
        res.status(500).send("Error uploading section");
    }
});


app.get('/course-section/:sectionId', async (req, res) => {
    const sectionId = req.params.sectionId;

    try {
        const sectionResult = await db.query(
            "SELECT * FROM sections WHERE section_id = $1;",
            [sectionId]
        );

        if (sectionResult.rows.length > 0) {
            const section = sectionResult.rows[0];

            const courseId = section.course_id; 
            
            const sectionsResult = await db.query(
                "SELECT * FROM sections WHERE course_id = $1;",
                [courseId]
            );

            const sections = sectionsResult.rows;

            res.render('sectionasins', { sections, section ,courseId });
        } else {
            res.status(404).send("Section not found");
        }
    } catch (error) {
        console.error("Error fetching section details:", error);
        res.status(500).send("Error fetching section details");
    }
});

app.post("/publish", async (req, res) => {
    const courseId = req.body.courseId;

    try {
        const result = await db.query("SELECT published FROM created_courses WHERE id = $1;", [courseId]);
        const currentStatus = result.rows[0].published;

        const newStatus = !currentStatus;
        await db.query("UPDATE created_courses SET published = $1 WHERE id = $2;", [newStatus, courseId]);

        res.redirect(`/course-overview/${courseId}`); 
    } catch (error) {
        console.error("Error toggling published status:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/delete", async (req, res) => {
    const courseId = req.body.courseId;

    try {
        await db.query("DELETE FROM created_courses WHERE id = $1;", [courseId]);
        res.redirect("/courses"); 
    } catch (error) {
        console.error("Error deleting course:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/delete-section', async (req, res) => {
    const sectionId = req.body.section_id;

    try {
        const deleteQuery = 'DELETE FROM sections WHERE section_id = $1;';
        await db.query(deleteQuery, [sectionId]);

        res.redirect(`/course-overview/${course_id}`);  
    } catch (error) {
        console.error('Error deleting section:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get("/cosab/:courseId", async (req, res) => {
    const courseId = req.params.courseId;
    course_id = courseId
    const userId = req.session.userId;
    try {
        const courseResult = await db.query(
            "SELECT * FROM created_courses WHERE id = $1;",
            [courseId]
        );

        const result = await db.query('SELECT name, email FROM students WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
        return res.status(404).send('User not found');
    }
    const user = result.rows[0];

        if (courseResult.rows.length > 0) {
            const course = courseResult.rows[0];

            const sectionsResult = await db.query(
                "SELECT * FROM sections WHERE course_id = $1;", 
                [courseId]
            );

            const sections = sectionsResult.rows;
            res.render("clsbb", { course, userId , sections , user ,key_id: 'rzp_test_tdhd9eKtsQISvp' });
        } else {
            res.status(404).send("Course not found");
        }
    } catch (error) {
        console.error("Error fetching course overview:", error);
        res.status(500).send("Error fetching course overview");
    }
});

app.get("/cosbb/:courseId", async (req, res) => {
    const courseId = req.params.courseId;
    course_id = courseId
    const userId = req.session.userId;
    try {
        const courseResult = await db.query(
            "SELECT * FROM created_courses WHERE id = $1;",
            [courseId]
        );
        const result = await db.query('SELECT name, email FROM students WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
        return res.status(404).send('User not found');
    }
    const user = result.rows[0];
        if (courseResult.rows.length > 0) {
            const course = courseResult.rows[0];

            const sectionsResult = await db.query(
                "SELECT * FROM sections WHERE course_id = $1;", 
                [courseId]
            );

            const sections = sectionsResult.rows;
            res.render("clsbb", { course, sections,user  ,  key_id: 'rzp_test_tdhd9eKtsQISvp' });
        } else {
            res.status(404).send("Course not found");
        }
    } catch (error) {
        console.error("Error fetching course overview:", error);
        res.status(500).send("Error fetching course overview");
    }
});

app.post('/store-payment-info', async (req, res) => {
    const {course_id, student_id} = req.body;

    try {
        
        const result = await db.query(
            'INSERT INTO courses_bought (course_id, student_id) VALUES ($1, $2)',
            [course_id, student_id]
        );
        res.status(200).json({ message: 'Payment info stored successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to store payment info' });
    }
});

app.get('/getCartTotal', async (req, res) => {
    const userId = req.session.userId; // Get current user ID from session
  
    try {
      const { rows } = await db.query(`
        SELECT SUM(created_courses.price) AS total
        FROM cart
        JOIN created_courses ON cart.course_id = created_courses.id
        WHERE cart.student_id = $1
      `, [userId]);
  
      // Convert total to paise (multiply by 100) and send as JSON
      const totalInPaise = rows[0].total ;
      res.json({ amount: totalInPaise });
    } catch (error) {
      console.error('Error fetching cart total:', error);
      res.status(500).json({ error: 'Failed to fetch cart total' });
    }
  });
  
  
  app.post('/updatePurchasedCourses', async (req, res) => {
    const userId = req.session.userId; // Current user
    const { paymentId } = req.body;
  
    // Fetch all courses in the cart
    const { rows: cartItems } = await db.query('SELECT course_id FROM cart WHERE student_id = $1', [userId]);
  
    // Insert courses into courses_bought table
    const insertQuery = 'INSERT INTO courses_bought (student_id, course_id) VALUES ($1, $2)';
    for (const { course_id } of cartItems) {
      await db.query(insertQuery, [userId, course_id]);
    }
  
    // Clear cart after purchase
    await db.query('DELETE FROM cart WHERE student_id = $1', [userId]);
  
    res.json({ success: true });
  });
  
  app.post('/updatePurchasedCourses2', async (req, res) => {
    const userId = req.session.userId; // Current user
    const { paymentId, courseId } = req.body;
  
    try {
      // Insert course into courses_bought table
      const query = 'INSERT INTO courses_bought (student_id, course_id) VALUES ($1, $2)';
      await db.query(query, [userId, courseId]);
  
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating purchased courses:', error);
      res.status(500).json({ error: 'Failed to update purchased courses' });
    }
  });

app.post('/add-to-cart', async (req, res) => {
    const courseId = req.body.course_id;
    const studentId = req.session.userId; 

    try {
        const insertQuery = `
            INSERT INTO cart (student_id, course_id) VALUES ($1, $2);
        `;
        await db.query(insertQuery, [studentId, courseId]);

        res.redirect("back");
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).send('Course is already in cart');
    }
});

app.post('/add-to-wishlist', async (req, res) => {
    const courseId = req.body.course_id;
    const studentId = req.session.userId; 

    try {
        const insertQuery = `
            INSERT INTO wishlist (student_id, course_id) VALUES ($1, $2);
        `;
        await db.query(insertQuery, [studentId, courseId]);

        res.redirect(`/cosbb/${courseId}`);
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).send('Course is already in wishlist.');
    }
});

app.get("/my-cart", async (req, res) => {
    const userId = req.session.userId; 

    try {
        const cartItemsResult = await db.query(
            `SELECT c.id, c.title, c.price, c.rating, c.level, c.thumbnail, i.name AS instructor
             FROM cart AS ca
             JOIN created_courses AS c ON ca.course_id = c.id
             JOIN instructor AS i ON c.user_id = i.id
             WHERE ca.student_id = $1;`,
            [userId]
        );
        const result = await db.query('SELECT name, email FROM students WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
        return res.status(404).send('User not found');
    }
    const user = result.rows[0];

        res.render("mycart", { cartItems: cartItemsResult.rows,user  , key_id: 'rzp_test_tdhd9eKtsQISvp' });
    } catch (error) {
        console.error("Error fetching cart items:", error);
        res.status(500).send("Error fetching cart items");
    }
});

app.post('/remove-from-cart/:courseId', async (req, res) => {
    const courseId = req.params.courseId;
    const userId = req.session.userId; 

    try {
        await db.query(
            `DELETE FROM cart WHERE course_id = $1 AND student_id = $2;`,
            [courseId, userId]
        );

        res.redirect('/my-cart');
    } catch (error) {
        console.error("Error removing course from cart:", error);
        res.status(500).send("Error removing course from cart");
    }
});

app.get('/cs-stu/:sectionId', async (req, res) => {
    const sectionId = req.params.sectionId;
    const studentId = req.session.userId; 

    try {
        const sectionResult = await db.query(
            "SELECT * FROM sections WHERE section_id = $1;",
            [sectionId]
        );

        if (sectionResult.rows.length > 0) {
            const section = sectionResult.rows[0];
            const courseId = section.course_id; 
            
            const sectionsResult = await db.query(
                "SELECT * FROM sections WHERE course_id = $1;",
                [courseId]
            );

            const checkQuery = `
                SELECT * FROM student_sections 
                WHERE student_id = $1 AND section_id = $2 AND course_id = $3;`;
            const checkResult = await db.query(checkQuery, [studentId, sectionId, courseId]);
            const isDone = checkResult.rows.length > 0; // True if exists

            const sections = sectionsResult.rows;

            res.render('sectionasstu', { sections, section, courseId, isDone });
        } else {
            res.status(404).send("Section not found");
        }
    } catch (error) {
        console.error("Error fetching section details:", error);
        res.status(500).send("Error fetching section details");
    }
});

app.post("/update-section-status", async (req, res) => {
    const studentId = req.session.userId; 
    const sectionId = req.body.sectionId; 
    const courseId = req.body.courseId; 
    const isDone = req.body.isDone === "true"; 

    try {
        if (isDone) {
            const insertQuery = `
                INSERT INTO student_sections (student_id, section_id, course_id)
                VALUES ($1, $2, $3)
                ON CONFLICT (student_id, section_id) DO NOTHING;`; 
            await db.query(insertQuery, [studentId, sectionId, courseId]);
        } else {
            const deleteQuery = `
                DELETE FROM student_sections 
                WHERE student_id = $1 AND section_id = $2 AND course_id = $3;`;
            await db.query(deleteQuery, [studentId, sectionId, courseId]);
        }

        res.redirect("back"); 
    } catch (error) {
        console.error("Error updating section status:", error);
        res.status(500).send("Error updating section status");
    }
});

app.get('/eternium',(req, res) => {
    res.render('eternium')
});

app.get("/my-wishlist", async (req, res) => {
    const userId = req.session.userId; 

    try {
        const wishlistItemsResult = await db.query(
            `SELECT c.id, c.title, c.price, c.rating, c.level, c.thumbnail, i.name AS instructor
             FROM wishlist AS ca
             JOIN created_courses AS c ON ca.course_id = c.id
             JOIN instructor AS i ON c.user_id = i.id
             WHERE ca.student_id = $1;`,
            [userId]
        );
        const result = await db.query('SELECT name, email FROM students WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
        return res.status(404).send('User not found');
    }
    const user = result.rows[0];

        res.render("wishlist", { wishlistItems: wishlistItemsResult.rows ,user});
    } catch (error) {
        console.error("Error fetching wishlist items:", error);
        res.status(500).send("Error fetching wishlist items");
    }
});

app.post('/remove-from-wishlist', async (req, res) => {
    const userId = req.session.userId; 
    const courseId = req.body.courseId;

    try {
        const removeQuery = `
            DELETE FROM wishlist 
            WHERE student_id = $1 AND course_id = $2;`;
        await db.query(removeQuery, [userId, courseId]);

        res.redirect('/my-wishlist'); 
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).send('Error removing from wishlist');
    }
});

async function calculatePercentageCompleted(studentId, courseId) {
    try {
      // Query to get the total sections in the course
      const totalSectionsQuery = `
        SELECT COUNT(*) AS total_sections
        FROM sections
        WHERE course_id = $1
      `;
      const totalSectionsResult = await db.query(totalSectionsQuery, [courseId]);
      const totalSections = totalSectionsResult.rows[0].total_sections;
  
      // Query to get the number of sections completed by the student
      const completedSectionsQuery = `
        SELECT COUNT(*) AS completed_sections
        FROM student_sections
        WHERE student_id = $1 AND course_id = $2
      `;
      const completedSectionsResult = await db.query(completedSectionsQuery, [studentId, courseId]);
      const completedSections = completedSectionsResult.rows[0].completed_sections;
  
      // Calculate percentage
      return Math.round((completedSections / totalSections) * 100);
    } catch (error) {
      console.error("Error calculating percentage completed:", error);
      throw error;
    }
  }
  
  // Route for displaying MyCourses and Recommendations
  app.get('/my-courses', async (req, res) => {
    const studentId = req.session.userId;
    const result = await db.query('SELECT name, email FROM students WHERE id = $1', [studentId]);
    const user = result.rows[0];
    try {
      // Query to fetch MyCourses
      const myCoursesQuery = `
        SELECT c.id, c.title, c.thumbnail ,c.category, c.rating, c.level, c.instructor AS instructor
        FROM created_courses c
        JOIN courses_bought cb ON c.id = cb.course_id
        JOIN instructor i ON c.instructor = i.name
        WHERE cb.student_id = $1
      `;
      const myCoursesResult = await db.query(myCoursesQuery, [studentId]);
      const myCourses = await Promise.all(myCoursesResult.rows.map(async course => {
        const percentageCompleted = await calculatePercentageCompleted(studentId, course.id);
        return { ...course, percentageCompleted };
      }));
  
      // Query to get the category of the last course bought by the student
const lastCourseCategoryQuery = `
SELECT c.category
FROM created_courses c
JOIN courses_bought cb ON c.id = cb.course_id
WHERE cb.student_id = $1
AND cb.course_id = (SELECT MAX(course_id) FROM courses_bought WHERE student_id = $1)
`;

const lastCourseCategoryResult = await db.query(lastCourseCategoryQuery, [studentId]);
const lastCategory = lastCourseCategoryResult.rows[0]?.category;
console.log("category:",lastCategory)

let recommendedCourses = [];
if (lastCategory) {
const recommendedCoursesQuery = `
SELECT c.id, c.title, c.thumbnail AS imageUrl, c.price, c.level, c.instructor
FROM created_courses c
WHERE c.category = $1 
  AND c.id NOT IN (SELECT course_id FROM courses_bought WHERE student_id = $2)
`;

const recommendedCoursesResult = await db.query(recommendedCoursesQuery, [lastCategory, studentId]);
const recommendedCourses = recommendedCoursesResult.rows;
console.log("recommended ",recommendedCourses)

}

      res.render('stucourses', { myCourses, recommendedCourses ,user});
  
    } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).send("An error occurred while fetching courses.");
    }
  });
  
  // Route for submitting rating
  app.post('/submit-rating/:courseId', async (req, res) => {
    const studentId = req.session.userId;
    const courseId = req.params.courseId;
    const { rating } = req.body;
  
    try {
      const insertRatingQuery = `
        INSERT INTO ratings (student_id, course_id, rating)
        VALUES ($1, $2, $3)
        ON CONFLICT (student_id, course_id) DO UPDATE SET rating = EXCLUDED.rating
      `;
      await db.query(insertRatingQuery, [studentId, courseId, rating]);
  
      res.redirect('/my-courses');
    } catch (error) {
      console.error('Error submitting rating:', error);
      res.status(500).send("An error occurred while submitting the rating.");
    }
  });



app.get('/download-certificate/:course_id', async (req, res) => {
    const studentId = req.session.userId;  // Get student_id from session
    const courseId = req.params.course_id;     // Get course_id from URL params
    
    if (!studentId) {
        return res.status(403).send('Unauthorized: No student session');
    }

    try {
        // Fetch the student's name from the students table using student_id
        const studentResult = await db.query('SELECT name FROM students WHERE id = $1', [studentId]);

        if (studentResult.rows.length === 0) {
            return res.status(404).send('Student not found');
        }

        const studentName = studentResult.rows[0].name;

        // Fetch the course details using course_id
        const courseResult = await db.query('SELECT title FROM created_courses WHERE id = $1', [courseId]);

        if (courseResult.rows.length === 0) {
            return res.status(404).send('Course not found');
        }

        const courseName = courseResult.rows[0].title;

        // Get the current date for issue date
        const issueDate = new Date().toLocaleDateString();

        // Render the certificate page with fetched data
        res.render('certificate', {
            studentName: studentName,
            courseName: courseName,
            issueDate: issueDate
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


app.get('/performance', async (req, res) => {
    try {
        const instructorId = req.session.userId;

        // Fetch instructor's name from the instructor table using instructorId
        const instructorResult = await db.query(
            'SELECT name FROM instructor WHERE id = $1',
            [instructorId]
        );
        const instructorName = instructorResult.rows[0]?.name;

        if (!instructorName) {
            return res.status(404).send('Instructor not found');
        }

        // 1. Calculate total revenue
        const revenueResult = await db.query(
            `SELECT SUM(cc.price) AS total_revenue
             FROM created_courses AS cc
             JOIN courses_bought AS cb ON cc.id = cb.course_id
             WHERE cc.instructor = $1`,
            [instructorName]
        );
        const totalRevenue = revenueResult.rows[0]?.total_revenue || 0;

        // 2. Calculate total enrollments
        const enrollmentsResult = await db.query(
            `SELECT COUNT(*) AS total_enrollments
             FROM created_courses AS cc
             JOIN courses_bought AS cb ON cc.id = cb.course_id
             WHERE cc.instructor = $1`,
            [instructorName]
        );
        const totalEnrollments = enrollmentsResult.rows[0]?.total_enrollments || 0;

        // 3. Calculate average rating
        const ratingResult = await db.query(
            `SELECT AVG(cc.rating) AS average_rating
             FROM created_courses AS cc
             WHERE cc.instructor = $1`,
            [instructorName]
        );
        const averageRating = ratingResult.rows[0]?.average_rating || 0;

        // 4. Count active courses
        const activeCoursesResult = await db.query(
            `SELECT COUNT(*) AS active_courses
             FROM created_courses
             WHERE instructor = $1 AND published = true`,
            [instructorName]
        );
        const activeCourses = activeCoursesResult.rows[0]?.active_courses || 0;

        // 5. Course list with enrollment and revenue for each course
        const courseListResult = await db.query(
            `SELECT cc.id, cc.title, COUNT(cb.course_id) AS enrollments, 
                    COALESCE(SUM(cc.price), 0) AS revenue, cc.rating
             FROM created_courses AS cc
             LEFT JOIN courses_bought AS cb ON cc.id = cb.course_id
             WHERE cc.instructor = $1
             GROUP BY cc.id, cc.title, cc.rating`,
            [instructorName]
        );
        const courseList = courseListResult.rows;

        res.render('performance', {
            totalRevenue,
            totalEnrollments,
            averageRating,
            activeCourses,
            courseList
        });
    } catch (error) {
        console.error('Error loading instructor dashboard:', error);
        res.status(500).send('Server error');
    }
});

app.get('/baat',(req,res)=>{
    res.render('chat')
})

app.get('/chat/:courseId/:userId/:role', async (req, res) => {
    const { courseId, userId, role } = req.params;
  
    try {
      // Fetch user name based on role
      let userName;
      if (role === 'student') {
        const result = await db.query('SELECT name FROM students WHERE id = $1', [userId]);
        userName = result.rows[0]?.name || 'Student';
      } else if (role === 'instructor') {
        const result = await db.query('SELECT name FROM instructor WHERE id = $1', [userId]);
        userName = result.rows[0]?.name || 'Instructor';
      }
  
      // Fetch messages related to courseId
      const messages = await db.query(
        `SELECT message, date_time, user_id, role 
         FROM messages 
         WHERE course_id = $1 
         ORDER BY date_time`,
        [courseId]
      );
  
      res.render('chat.ejs', {
        userId,
        courseId,
        role,
        userName,
        messages: messages.rows,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
  });

  // Assuming you have the necessary imports like express, pg for PostgreSQL, etc.

app.get('/success', async (req, res) => {
    const studentId = req.session.userId;  // Capture student ID from session
    const paymentId = req.query.payment_id;  // Capture Razorpay payment ID
  
    try {
      // Fetch all course IDs where published = true from created_courses
      const result = await db.query(
        'SELECT course_id FROM created_courses WHERE published = true'
      );
  
      // Extract course IDs from the query result
      const courseIds = result.rows.map(row => row.course_id);
  
      // Insert into courses_bought for each course and the student
      for (let courseId of courseIds) {
        await db.query(
          'INSERT INTO courses_bought (student_id, course_id) VALUES ($1, $2)',
          [studentId, courseId]
        );
      }
  
      // Optionally, you can handle updating the payment status in a payments table here
  
      // Redirect to a confirmation or success page after payment and database update
      res.redirect('/payment-success'); // Or any success page
    } catch (error) {
      console.error('Error processing payment and saving courses:', error);
      res.status(500).send('Internal Server Error');
    }
  });


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
  
