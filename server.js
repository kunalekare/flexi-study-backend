const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // Enable JSON parsing

// Use MySQL Connection Pool for Better Performance
const db = mysql.createPool({
  host: "localhost",
  user: "youruser",
  password: "yourpassword",
  database: "flexilearn",
  connectionLimit: 100, // Allow multiple connections
});

const sellerDb = mysql.createPool({
  host: "localhost",
  user: "youruser",
  password: "yourpassword",
  database: "seller_db", // Use the correct seller database
  connectionLimit: 10,
});

// Check Database Connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Connected to MySQL database.");
    connection.release(); // Release the connection after testing
  }
});

// **Signup Route**
app.post("/api/signup", (req, res) => {
  console.log("Signup request received:", req.body); // Debugging

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  // Check if user already exists
  const checkUserSql = "SELECT * FROM users WHERE email = ?";
  db.query(checkUserSql, [email], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    if (results.length > 0) {
      return res.status(400).json({ message: "User already exists." });
    }

    // Insert new user
    const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    db.query(sql, [name, email, password], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
      }
      res.status(201).json({ message: "User registered successfully!" });
    });
  });
});

// **Contact Form Submission Route**
app.post("/api/contact", (req, res) => {
  console.log("Raw request body received:", req.body);

  const { fullName, email, phone, subject, message } = req.body; // Expect fullName

  if (!fullName || !email || !message) {
    console.log("Missing required fields:", { fullName, email, message });
    return res.status(400).json({ message: "Full Name, Email, and Message are required." });
  }

  console.log("Inserting into database...");
  const sql = "INSERT INTO contact_messages (full_name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)";

  db.query(sql, [fullName, email, phone, subject, message], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    console.log("Message inserted successfully:", result);
    res.status(201).json({ message: "Message sent successfully!" });
  });
});

// **Subscribe Email Route**

app.post("/api/subscribe", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  const checkEmailSql = "SELECT * FROM subscribers WHERE email = ?";
  db.query(checkEmailSql, [email], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: "You are already subscribed." });
    }

    const insertEmailSql = "INSERT INTO subscribers (email) VALUES (?)";
    db.query(insertEmailSql, [email], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Subscription failed." });
      }
      res.status(201).json({ message: "Subscription successful!" });
    });
  });
});

// **Login Route**
app.post("/api/login", (req, res) => {
  console.log("Login request received:", req.body); // Debugging

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = results[0];

    if (password !== user.password) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    res.status(200).json({ message: "Login successful", user });
  });
});

// **Seller Registration Route**
app.post("/api/seller/register", (req, res) => {
  console.log("Seller registration request received:", req.body); // Debugging

  const {
    firstName,
    lastName,
    email,
    phone,
    companyName,
    businessType,
    sellerCategory,
    selectedPlan,
    website,
    termsAgreed,
  } = req.body;

  if (!firstName || !lastName || !email || !phone || !companyName || !businessType || !sellerCategory || !termsAgreed) {
    return res.status(400).json({ message: "All required fields must be filled." });
  }

  // Check if seller already exists
  const checkSellerSql = "SELECT * FROM users WHERE email = ?";
  db.query(checkSellerSql, [email], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    if (results.length > 0) {
      return res.status(400).json({ message: "Seller already exists." });
    }

    // Insert new seller
    const insertSellerSql = `
      INSERT INTO sellers (first_name, last_name, email, phone, company_name, business_type, seller_category, selected_plan, website, terms_agreed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(
      insertSellerSql,
      [firstName, lastName, email, phone, companyName, businessType, sellerCategory, selectedPlan, website, termsAgreed],
      (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ message: "Internal Server Error" });
        }
        res.status(201).json({ message: "Seller registered successfully!" });
      }
    );
  });
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
