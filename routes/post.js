// bring in express to use express router
const express = require("express");
// destructure controllers to simplify routes below
const {
  getPosts,
  createPost,
  postsByUser,
  postById,
  isPoster,
  updatePost,
  deletePost,
  photo,
  singlePost,
  like,
  unlike,
  comment,
  uncomment,
  updateComment
} = require("../controllers/post");
const { requireSignin } = require("../controllers/auth");
const { userById } = require("../controllers/user");
// bring in validator to make sure user input is good
const { createPostValidator } = require("../validator");

// use express router
const router = express.Router();

// hand get requests over to controller
router.get("/posts", getPosts);
// like unlike
router.put("/post/like", requireSignin, like);
router.put("/post/unlike", requireSignin, unlike);

// comments
router.put("/post/comment", requireSignin, comment);
router.put("/post/uncomment", requireSignin, uncomment);
router.put('/post/updatecomment', requireSignin, updateComment);

router.post("/post/new/:userId", requireSignin, createPost, createPostValidator);
router.get("/posts/by/:userId", requireSignin, postsByUser);
router.get("/post/:postId", singlePost)
router.put("/post/:postId", requireSignin, isPoster, updatePost);
router.delete("/post/:postId", requireSignin, isPoster, deletePost);
// Photo
router.get("/post/photo/:postId", photo);

// any route containing :userId, our app will first execute userById
router.param("userId", userById);
// any route containing :postId, our app will first execute userById
router.param("postId", postById);


module.exports = router;
