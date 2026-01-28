const express = require("express");
const router = express.Router();
//const multer = require("multer");
//const upload = multer({ dest: "uploads/" }); // temp folder
const { userVerification } = require("../middleware/authMiddleware");


const multer = require("multer");
const storage = multer.diskStorage({});
const upload = multer({ storage: storage });

const {
  createPost,
  likePost,
  commentPost,
  getAllPosts,
  getMyPosts,
  getCommentsOfPost,
  deletePost,
  getPostsOfUser,
} = require("../controllers/postController");

// CREATE POST
router.post("/create", userVerification, upload.single("image"), createPost);

// LIKE POST
router.post("/like/:postID", userVerification, likePost);

// COMMENT
router.post("/comment/:postID", userVerification, commentPost);

// FEED
router.get("/all", getAllPosts);

// MY POSTS
router.get("/mine", userVerification, getMyPosts);

//COMMENTS ON POST
router.get("/post/comments/:postID", getCommentsOfPost);

//DELETE
router.delete("/deletepost/:postID",userVerification, deletePost);

//POSTS OF specific user
router.get("/allposts/:userID", getPostsOfUser);

module.exports = router;
