const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  userID: { type: mongoose.Schema.ObjectId, ref: "profile" },
  text: { type: String },
  date: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema(
  {
    userID: { type: mongoose.Schema.ObjectId, ref: "profile" },
    image: { type: String }, // photo of dog
    caption: { type: String },
    likes: [{ type: mongoose.Schema.ObjectId, ref: "profile" }],
    comments: [CommentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("post", PostSchema);
