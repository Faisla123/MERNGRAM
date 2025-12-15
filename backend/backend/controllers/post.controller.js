import sharp from "sharp";
import { Post } from "../model/post.model.js";
import cloudinary from "../utils/cloudinary.js";
import { User } from "../model/user.model.js";
import { Comment } from "../model/comment.model.js";

export const addNewPost = async (req, res) => {
  try {
    const caption = req.body;
    const image = req.file;
    const userid = req.id;

    if (!image) {
      return res.status(400).json({
        message: "Image required",
        success: false,
      });
    }

    //image Upload  {we will use Sharp pakage to optimise the image.}
    const optimisedImageBuffer = await sharp(image.buffer)
      .resize({ width: 800, height: 800, fit: "inside" })
      .toFormat("jpeg", { quality: 80 })
      .toBuffer();
    // first in image there is a thing called buffer that we take from it and then
    //we will resize it and provide desired h&w and make it fit inside then we will
    //set the format for it here we provided 'jpeg' with 80 quality and then convert it to buffer again.

    //now convert the image buffer to URI
    const fileUri = `date:image/jpeg; base64 , ${
      (optimisedImageBuffer, toString("base64"))
    }`;
    const cloudResponse = await cloudinary.uploader.upload(fileUri);

    const post = await Post.create({
      caption,
      image: cloudResponse.secure_url,
      author: userid,
    });

    const user = await User.findById(userid);
    if (user) {
      user.posts.push(post._id);
      await user.save();
    }

    await post.populate({ path: "author", select: "-password" });

    return res.status(200).json({
      message: "New post added",
      post,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username,profilepic" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: {
          path: "author",
          select: "username,profilepic",
        },
      });

    return res.status(200).json({
      posts,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getUserposts = async (req, res) => {
  try {
    const authorid = req.id;
    const posts = await Post.find({ author: authorid })
      .sort({ createdAt: -1 })
      .populate({
        path: "author",
        select: "username,profilepic",
      })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: {
          path: "author",
          select: "username,profilepic",
        },
      });

    return res.status(200).json({
      posts,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const likepost = async (req, res) => {
  try {
    const authorid = req.id;
    const postid = req.params.id;
    const post = await Post.findById(postid);
    if (!post) {
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }
    //like logic started:

    await post.updateOne({ $addToSet: { likes: authorid } });

    await post.save();

    //implement Socket-io for real time notification.

    return res.status(200).json({
      message: "Post Liked",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const dislikepost = async (res, req) => {
  try {
    const authorid = req.id;
    const postid = req.params.id;
    const post = await Post.findById(postid);
    if (!postid) {
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }
    await post.updateOne({ $pull: { likes: authorid } });
    await post.save();
    return res.status(200).json({
      message: "Post disked",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const addComment = async (req, res) => {
  try {
    const postid = req.params.id;
    const userid = req.id;
    const { text } = req.body;
    const post = await Post.findById(postid);
    if (!text) {
      return res.status(404).json({
        message: "Please add comment",
        success: false,
      });
    }

    const comment = await Comment.create({
      text,
      author: userid,
      post: postid,
    });

    comment = await comment.populate({
      path: "author",
      select: "username profilepic",
    });

    post.comments.push(comment._id);
    await post.save();

    return res.status(201).json({
      message: "Comment added successfully",
      comment,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const allcomments = async (req, res) => {
  try {
    const postid = req.params.id;

    const comments = await Comment.find({ post: postid }).populate({
      path: "author",
      select: "username,profilepic",
    });

    if (!comments) {
      return res.status(404).json({
        message: "No comments found",
        success: false,
      });
    }

    return res.status(200).json({
      comments,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const deletePost = async (res, req) => {
  try {
    const userid = req.id;
    const postid = req.params.id;

    const post = await Post.findById(postid);
    if (!post) {
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }

    //check if the logged-in user is the owner of the post.

    if (post.author != userid) {
      return res.status(403).json({
        message: "You cant delete this post",
        success: false,
      });
    }

    //delete post logic.

    await post.findByIdAndDelete(postid);
    //remove post id from user's post.

    let user = await User.findById(userid);
    user.posts = user.posts.filter((id) => id.toString() !== postid);
    await user.save();

    //delete associated comments.

    await Comment.deleteMany({ post: postid });

    return res.status(200).json({
      message: "Successfully deleted",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const bookmarkPost = async (req, res) => {
  try {
    const postid = req.params.id;
    const userid = req.id;
    const post = await Post.findById(postid);
    if (!post) {
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }

    const user = await User.findById(userid);
    if (user.bookmarks.includes(post._id)) {
      //already in bookmark then remove it from bookmark
      await user.updateOne({ $pull: { bookmarks: post._id } });
      await user.save();
      return res
        .status(200)
        .json({ type: "unsaved", message: "Bookmark Removed", success: true });
    } else {
      //add to bookmark
      await user.updateOne({ $addToSet: { bookmarks: post._id } });
      await user.save();
      return res
        .status(200)
        .json({ type: "saved", message: "Bookmark added", success: true });
    }
  } catch (error) {
    console.log(error);
  }
};
