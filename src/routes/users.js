import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { UserModel } from "../models/Users.js";

const router = express.Router();

// User Registration Route
router.post("/register", async (req, res) => {
  // Extract email, username, and password from the request body
  const { email, username, password } = req.body;

  // Check if a user with the same username already exists
  const user = await UserModel.findOne({ username });

  if (user) {
    return res.json({ message: "User already exists!" });
  }

  // Hash the password using bcrypt
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a new user with the hashed password and save it to the database
  const newUser = new UserModel({ email, username, password: hashedPassword });
  await newUser.save();

  res.json({ message: "User registered successfully !" });
});

// User Login Route
router.post("/login", async (req, res) => {
  // Extract username and password from the request body
  const { username, password } = req.body;

  // Find the user with the provided username
  const user = await UserModel.findOne({ username });
  if (!user) {
    return res.json({ message: "User Doesnt exist" });
  }

  // Compare the provided password with the stored hashed password using bcrypt
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.json({ message: "Username or password is incorrect!" });
  }

  // If the password is valid, create a JWT token and send it as a response
  const token = jwt.sign({ id: user._id }, "secret");
  res.json({ token, userID: user._id });
});

// Define a middleware for verifying JWT tokens
export { router as userRouter };
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (token) {
    jwt.verify(token, "secret", (err) => {
      if (err) return res.sendStatus(403); // Token verification failed
      next(); // Proceed to the next middleware or route
    });
  } else {
    res.sendStatus(401); // Token not provided
  }
};
