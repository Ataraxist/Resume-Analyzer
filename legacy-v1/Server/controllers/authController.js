// import User  from "../data/db.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// const authController = {};

// authController.register = (req, res, next) => {
//   const { username, password } = req.body;

//   User.findOne({ username })
//     .then((userExists) => {
//       if (userExists) {
//         return res.status(400).json({ message: "User already exists" });
//       }
//       return bcrypt.genSalt(6);
//     })
//     .then((salt) => bcrypt.hash(password, salt))
//     .then((hashedPassword) => {
//       const newUser = new User({ username, password: hashedPassword });
//       return newUser.save();
//     })
//     .then(() => {
//       res.status(200).json({ message: "Thank you" });
//       return next();
//     })
//     .catch((error) => {
//       console.error(error);
//       res.status(500).json({ message: "error" });
//     });
// };

// authController.login = (req, res, next) => {
//   const { username, password } = req.body;

//   User.findOne({ username })
//     .then((user) => {
//       if (!user) {
//         return res.status(400).json({ message: "Incorrect username" });
//       }
//       return bcrypt.compare(password, user.password).then((matched) => {
//         if (!matched) {
//           return res.status(400).json({ message: "Incorrect password" });
//         }
//         const payload = { userId: user._id };
//         const token = jwt.sign(payload, process.env.JWT_SECRET, {
//           expiresIn: "0.5hr",
//         });
//         res.status(200).json({ message: "Logged in", token });
//         return next();
//       });
//     })
//     .catch((error) => {
//       console.error(error);
//       res.status(500).json({ message: "error" });
//     });
// };

// // Placeholder function
// authController.checkAuthStatus = (req, res, next) => {
//   console.log("Auth status check not yet implemented.");
//   next();
// };

// export default authController;
