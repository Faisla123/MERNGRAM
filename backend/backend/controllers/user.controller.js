import { User } from "../model/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../model/post.model.js";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !password || !email) {
      return res.status(401).json({
        message: "Missing field check again",
        success: false,
      });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(401).json({
        message: "Email already exists",
        success: false,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      username,
      password: hashedPassword,
      email,
    });
    return res.status(201).json({
      message: "Account created successfully.",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({
        message: "Wrong username or password",
        success: false,
      });
    }
    let user = await User.findOne({ email });

    if (!User) {
      return res.status(401).json({
        message: "Incorrect email or password",
        success: flase,
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Wrong email or password.",
        success: false,
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    //populate each post in the posts array:

    const populatedPost = await promise.all(
      user.posts.map(async (postid) => {
        const post = await Post.findById(postid);
        if (post.author.equals(user._id)) {
          return post;
        }
        return null;
      })
    );

    user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilepic: user.profilepic,
      bio: user.bio,
      followers: user.followers,
      followings: user.followings,
      posts: populatedPost,
    };

    return res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 1 * 24 * 60 * 60 * 1000,
      })
      .json({
        message: `Welcome back ${user.username}`,
        success: true,
        user,
      });
  } catch (error) {
    console.log(error);
  }
};

export const logout = async (_, res) => {
  try {
    return res.cookie("token", "", { maxAge: 0 }).json({
      message: "Logged Out Successfuly",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    let user = await User.findById(userId).select("-password");
    return res.status(200).json({
      user,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const editProfile = async (req, res) => {
  try {
    const userId = req.id;
    const { bio, gender } = req.body;
    const profilepic = req.file;
    let cloudResponse;

    if (profilepic) {
      const fileUri = getDataUri(profilepic);
      cloudResponse = await cloudinary.uploader.upload(fileUri);
    }
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "User Not Found",
        success: false,
      });
    }

    if (bio) user.bio = bio;
    if (gender) user.gender = gender;
    if (profilepic) user.profilepic = cloudResponse.secure_url;

    await user.save();

    return res.status(200).json({
      message: "Details Updated.",
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const suggestedUsers = await User.find({ _id: { $ne: req.id } }).select(
      "-password"
    );
    if (!suggestedUsers) {
      res.status(400).json({
        message: "Not have Users",
        success: false,
      });
    }
    if (suggestedUsers) {
      res.status(200).json({
        success: true,
        users: suggestedUsers,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

export const followOrunfollow = async (req, res) => {
  try {
    const whofollow = req.id; // this is my id.
    const whogotfollowed = req.params.id; //this is others who will follow me.
    if (whofollow === whogotfollowed) {
      return res.status(400).json({
        message: "You cannot followed urself",
        success: false,
      });
    }

    const user = await User.findById(whofollow);
    const targetUser = await User.findById(whogotfollowed);

    if (!user || !targetUser) {
      return res.status(400).json({
        message: "User not found",
        success: false,
      });
    }

    //follow unfollow logic

    const isfollowing = user.followings.includes(whogotfollowed);
    if (isfollowing) {
      await Promise.all([
        User.updateOne(
          { _id: whofollow },
          { $pull: { followings: whogotfollowed } }
        ),
        User.updateOne(
          { _id: whogotfollowed },
          { $pull: { followers: whofollow } }
        ),
      ]);
      return res.status(200).json({
        message: "Unfollowed",
        success: true,
      });
    } else {
      //not following
      await Promise.all([
        User.updateOne(
          { _id: whofollow },
          { $push: { followings: whogotfollowed } }
        ),
        User.updateOne(
          { _id: whogotfollowed },
          { $push: { followers: whofollow } }
        ),
      ]);
      return res.status(200).json({
        message: "Followed Successfully",
        success: true,
      });
    }
  } catch (error) {
    console.log(error);
  }
};
