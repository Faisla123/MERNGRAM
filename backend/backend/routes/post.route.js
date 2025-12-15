import express from "express";
import isAuthenticated from "../middleware/isauth.js";
import upload from "../middleware/multer.js";
import {
  addComment,
  addNewPost,
  allcomments,
  bookmarkPost,
  deletePost,
  dislikepost,
  getAllPosts,
  getUserposts,
  likepost,
} from "../controllers/post.controller.js";
const router = express.Router();

router
  .route("/addpost")
  .post(isAuthenticated, upload.single("image"), addNewPost);
router.route("/all").get(isAuthenticated, getAllPosts);
router.route("/userpost/all").get(isAuthenticated, getUserposts);
router.route("/:id/like").get(isAuthenticated, likepost);
router.route("/:id.dislike").get(isAuthenticated, dislikepost);
router.route("/:id/comment").post(isAuthenticated, addComment);
router.route("/:id/comment/all").get(isAuthenticated, allcomments);
router.route("/delete/:id").post(isAuthenticated, deletePost);
router.route("/:id/bookmark").post(isAuthenticated, bookmarkPost);

export default router;
