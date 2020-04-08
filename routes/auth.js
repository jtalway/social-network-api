// bring in express to use express router
const express = require("express");
// destructure controllers to simplify routes below
const {
  signup,
  signin,
  signout,
  forgotPassword,
  resetPassword,
  socialLogin
 } = require("../controllers/auth");

const { userById } = require("../controllers/user");
// bring in validator to make sure user input is good
const { userSignupValidator, passwordResetValidator } = require("../validator");


// use express router
const router = express.Router();

// new potential post go thru validator then controller create post
router.post("/signup", userSignupValidator, signup);
router.post("/signin", signin);
router.get("/signout", signout);
router.post("/social-login", socialLogin); 
// any route containing :userId, our app will first execute userById
router.param("userId", userById);
// password forgot and reset routes
router.put("/forgot-password", forgotPassword);
router.put("/reset-password", passwordResetValidator, resetPassword);

module.exports = router;
