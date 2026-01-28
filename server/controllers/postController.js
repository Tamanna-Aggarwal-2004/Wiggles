const PostModel = require("../models/PostSchema");
const ProfileModel = require("../models/Profile");
const UserModel = require("../models/Users");
const cloudinary = require("cloudinary").v2;
const mongoose = require('mongoose');

// CLOUDINARY CONFIG
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});


async function uploadToCloudinary(file) {
  const res = await cloudinary.uploader.upload(file, {
    resource_type: "auto", // image or video both
  });
  return res;
}

// ----------------------------------------------
// CREATE POST (with Cloudinary)
// ----------------------------------------------
module.exports.createPost = async (req, res) => {
  try {
    const userID = req.user.id;

    const { caption } = req.body;
    
    const imageFile = req.file ? req.file.path : null;
    console.log("🔵 imageFile path:", imageFile);

    if (!imageFile) {
      console.log("❌ Error: No image file received");
      return res.status(400).json({ message: "Image is required" });
    }

    // Upload image to cloudinary
    console.log("🔼 Uploading to Cloudinary...");
    const uploadResult = await uploadToCloudinary(imageFile);
    console.log("🔽 Cloudinary Upload Result:", uploadResult);

    // Creating post in DB
    console.log("📝 Creating post in DB...");
    const newPost = await PostModel.create({
      userID,
      caption,
      image: uploadResult.secure_url,
    });

    console.log("✅ New Post Created:", newPost);

    // Add post ID to user's profile
    console.log("📌 Updating user profile...");
    await ProfileModel.findByIdAndUpdate(userID, {
      $push: { posts: newPost._id },
    });

    console.log("✔ Profile updated successfully");

    return res.json({ status: "ok", post: newPost });

  } catch (error) {
    console.log("❌ ERROR in createPost:", error);
    return res.status(500).json({ message: error.message });
  }
};


// ----------------------------------------------
// LIKE POST
// ----------------------------------------------
module.exports.likePost = async (req, res) => {
  try {
    const userID = req.user.id;
    const postID = req.params.postID;

    const post = await PostModel.findById(postID);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // If user already liked → UNLIKE
    if (post.likes.includes(userID)) {
      await PostModel.findByIdAndUpdate(postID, {
        $pull: { likes: userID }
      });
      return res.json({ status: "ok", action: "unliked" });
    }

    // Else → LIKE
    await PostModel.findByIdAndUpdate(postID, {
      $addToSet: { likes: userID }
    });

    return res.json({ status: "ok", action: "liked" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// ----------------------------------------------
// COMMENT ON POST
// ----------------------------------------------
module.exports.commentPost = async (req, res) => {
  try {
    const userID = req.user.id;
    const postID = req.params.postID;
    const { text } = req.body;

    await PostModel.findByIdAndUpdate(postID, {
      $push: { comments: { userID, text } },
    });

    return res.json({ status: "ok", message: "Comment added" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------
// GET ALL POSTS (FEED)
// ----------------------------------------------
module.exports.getAllPosts = async (req, res) => {
  try {
    const posts = await PostModel.find()
      .populate("userID", "name image")
      .populate("comments.userID", "name image")
      .sort({ createdAt: -1 });

    return res.json({ status: "ok", posts });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------
// GET MY POSTS
// ----------------------------------------------
module.exports.getMyPosts = async (req, res) => {
  try {
    const userID = req.user.id;

    const posts = await PostModel.find({ userID })
  .populate("userID", "name image") 
  .populate("comments.userID", "name image") 
  .sort({ createdAt: -1 });

    return res.json({ status: "ok", posts });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports.getCommentsOfPost = async (req, res) => {
  try {
    const postID = req.params.postID;

    // Find the post and populate user inside comments
    const post = await PostModel.findById(postID)
      .populate("comments.userID", "name image") // load user details
      .select("comments"); // return only comments

    if (!post) {
      return res.status(404).json({ status: "fail", message: "Post not found" });
    }

    return res.json({
      status: "ok",
      comments: post.comments,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

////////////////////////////////
//////DELETE///////////////////////
// Extract Cloudinary public ID from URL
function extractPublicId(imageUrl) {
  const parts = imageUrl.split("/");
  const fileName = parts.pop();         // example: abcxyz.jpg
  return fileName.split(".")[0];        // abcxyz
}

module.exports.deletePost = async (req, res) => {
  try {
    const userID = req.user.id;            // logged-in user
    const postID = req.params.postID;      // post to delete

    // Step 1: Find post
    const post = await PostModel.findById(postID);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Only allow owner of post to delete
    if (post.userID.toString() !== userID)
      return res.status(403).json({ message: "You cannot delete this post" });

    // Step 2: Delete image from Cloudinary
    if (post.image) {
      const publicId = extractPublicId(post.image);
      await cloudinary.uploader.destroy(publicId);
    }

    // Step 3: Delete post from DB
    await PostModel.findByIdAndDelete(postID);

    // Step 4: Remove post ID from profile.posts[]
    await ProfileModel.findByIdAndUpdate(userID, {
      $pull: { posts: postID },
    });

    return res.json({ status: "ok", message: "Post deleted successfully" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------
// GET POSTS OF ANY USER
// ----------------------------------------------

module.exports.getPostsOfUser = async (req, res) => {
  try {
    const userID = req.params.userID;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userID)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid user ID format",
      });
    }

    // Check if profile exists
    const user = await ProfileModel.findById(userID);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Fetch posts of that user
    const posts = await PostModel.find({ userID })
      .populate("userID", "name image")
      .populate("comments.userID", "name image")
      .sort({ createdAt: -1 });

    return res.json({ status: "ok", posts });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};