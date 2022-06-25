
const express = require("express");

const router = express.Router();
const BlogController = require("../controllers/blogController");
const AuthorController = require('../controllers/authorController')
const MWController = require('../middlewares/middleware')
router.post('/authors', AuthorController.createAuthor);
router.post('/blogs',MWController.authenticate,BlogController.createBlog);
router.get("/blogs",MWController.authenticate, BlogController.getBlogs);
router.put(
  "/blogs/:blogId",MWController.authenticate,
  BlogController.updateBlogs
);
router.delete(
  "/blogs/:blogId",
  MWController.authenticate,
  BlogController.deleteBlogById
);
router.delete(
  "/blogs",MWController.authenticate,
  BlogController.deleteBlogByParams
);

router.post('/login',AuthorController.login)

module.exports = router;