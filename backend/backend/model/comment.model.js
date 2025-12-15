import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  text: { type: String, required: true },
  post: { type: mongoose.Schema.Types.ObjectId, required: true },
});

export const Comment = mongoose.model("Comment", commentSchema);
