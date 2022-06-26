const blogModel = require("../models/blogModel");
const authorModel = require("../models/authorModel");
const mongoose = require("mongoose");

const isValid = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  return true;
};

const isValidBody = function (body) {
  return Object.keys(body).length > 0;
};

const isValidObjectId = function (ObjectId) {
  return mongoose.Types.ObjectId.isValid(ObjectId);
};

const check = function (arr) {
  return arr.length > 0;
};

const createBlog = async function (req, res) {
  try {
    const data = req.body;
    if (!isValidBody(data))
      return res
        .status(400)
        .send({ status: false, msg: "can not enter blog without data" });

    let { title, body, authorId, tags, subcategory, category, isPublished } =
      data;

    if (!isValid(title)) {
      return res.status(400).send({ status: false, msg: "Title is required" });
    }
    if (!isValid(body)) {
      return res.status(400).send({ status: false, msg: "body is required" });
    }
    if (!isValidObjectId(authorId)) {
      return res
        .status(400)
        .send({ status: false, msg: "authorId is required" });
    }
    if (authorId != req.decodedToken.authorId) {
      return res.status(403).send({status:false, msg:"not authorized"})
    }
    if (!check(tags)) {
      return res.status(400).send({ status: false, msg: "tags are required" });
    }
    if (!check(subcategory)) {
      return res
        .status(400)
        .send({ status: false, msg: "subcategory is required" });
    }
    if (!isValid(category)) {
      return res
        .status(400)
        .send({ status: false, msg: "category is required" });
    }

    isPublished ? isPublished : false;
    data.publishedAt = isPublished ? new Date() : null;
    
    let authorData = await authorModel.findById(authorId);
    if (!authorData)
      return res.status(400).send({ status: false, msg: "authorId not found" });

    const createdBlog = await blogModel.create(data);
    res.status(201).send({ status: true, data: createdBlog });
  } catch (error) {
    res.status(500).send({ status: false, msg: error.message });
  }
};

const getBlogs = async function (req, res) {
  try {
    const blogs = await blogModel.find({
      $and: [{ isDeleted: false }, { isPublished: true }],
    });
    if (!isValidBody(req.query)) {
      return res.status(200).send({status:true,data:blogs})
    }
    let { authorId} = req.query;
    if (authorId) {
      if (!isValidObjectId(authorId)) {
        return res.status(400).send({status:false,msg:"enter valid author id"})
      }
      // if (authorId != req.decodedToken.authorId) {
      //   return res.status(403).send({status:false, msg:"not authorized"})
      // }
    }

    
      let searchBlogs = await blogModel.find({
        $or: [
          { authorId: req.query.authorId },
          { tags: req.query.tags },
          { category: req.query.category },
          { subcategory: req.query.subcategory },
        ],
      });
      let result = [];
      if (searchBlogs.length > 0) {
        for (let element of searchBlogs) {
          if (element.isDeleted == false && element.isPublished == true) {
            result.push(element);
          }
        }
        return res.status(200).send({ status: true, data: result });
      } else {
        return res.status(404).send({ status: false, msg: "no blogs found" });
      }
    
  } catch (error) {
    res.status(500).send({ status: false, error: error.message });
  }
};
const updateBlogs = async function (req, res) {
  try {
    let data = req.body;
    if (!isValidBody(data)) {
      return res.status(400).send({ status: false, msg: "enter valid data" });
    }
    const blogs = await blogModel.findOne({
      _id: req.params.blogId,
      isDeleted: false,
    });
    if (!blogs) {
      return res.status(404).send({ status: false, msg: "no blogs found" });
    }
    if (blogs.authorId != req.decodedToken.authorId) {
      return res.status(403).send({ status: false, msg: "not authorized" });
    }
    let updatedData = { publishedAt: new Date(), isPublished: true };
    if (data.title) {
      if (!isValid(data.title)) {
        return res.status(400).send({ status: false, msg: " title not valid" });
      }
      updatedData.title = data.title;
    }
    if (data.body) {
      if (!isValid(data.body)) {
        return res.status(400).send({ status: false, msg: " title not valid" });
      }
      updatedData.body = data.body;
    }
    if (data.tags) {
      if (!check(data.tags)) {
        return res.status(400).send({ status: false, msg: " tags not valid" });
      }
      updatedData.$push = {
        tags: data.tags,
      };
    }

    if (data.subcategory) {
      if (!check(data.subcategory)) {
        return res
          .status(400)
          .send({ status: false, msg: " subcategory not valid" });
      }
      updatedData.$addToSet = {
        subcategory: data.subcategory,
      };
    }

    let updatedBlog = await blogModel.findOneAndUpdate(
      { _id: req.params.blogId, isDeleted: false },
      updatedData,
      { new: true }
    );
    return res.status(200).send({ msg: " updated", data: updatedBlog });
  } catch (err) {
    res.status(500).send({ status: false, msg: error.message });
  }
};

const deleteBlogById = async function (req, res) {
  try {
    let blogId = req.params.blogId;
    if (!isValidObjectId(blogId)) {
      return res
        .status(400)
        .send({ status: false, msg: "blog id not entered" });
    }

    let blog = await blogModel.findOne({
      $and: [{ _id: blogId }, { isDeleted: false }],
    });
    if (!blog) {
      return res
        .status(404)
        .send({ status: false, msg: "No such blog exists or blog is deleted" });
    }
    // if (blog.isDeleted == true) {
    //   return res.status(404).send({ status: false, msg: "Blog is already deleted " });
    // }
    if (blog.authorId != req.decodedToken.authorId) {
      return res.status(403).send({ status: false, msg: "not authorized" });
    }

    let afterDelete = await blogModel.findOneAndUpdate(
      { _id: blogId },
      { $set: { isDeleted: true }, deletedAt: new Date() },
      { new: true }
    );
    return res.status(200).send({ status: true, msg: afterDelete });
  } catch (err) {
    res.status(500).send({ status: false, error: err.message });
  }
};

const deleteBlogByQuery = async function (req, res) {
  try {
    let body = req.query; //check req.query has element or not
    if (!body) {
      // 404 not found, 404, 404 error, page not found or   not found error
      return res.status(404).send({
        status: false,
        msg: "No such blog exists or the blog is deleted",
      });
    }

    let { category, authorId, tags, subcategory, isPublished } = body; // take all the element in the body container

    if (category) {
      if (!isValid(category))
        return res
          .status(400)
          .send({ status: false, msg: "No such category exist" });
    }

    if (authorId) {
      if (!isValidObjectId(authorId)) {
        return res
          .status(400)
          .send({ status: false, msg: "No such author found" });
      }
      if (authorId != req.decodedToken.authorId) {
        return res.status(400).send({ status: false, msg: "not authorized" });
      }
    }

    if (tags) {
      if (!check(tags))
        return res
          .status(400)
          .send({ status: false, msg: "No such tag found" });
    }

    if (subcategory) {
      if (!check(subcategory))
        return res
          .status(400)
          .send({ status: false, msg: "no such subcategory" });
    }
    if (isPublished == true) {
      return res.status(400).send({ status: false, msg: "delete unpublished" });
    }

    let blog = await blogModel.find(body).select({ authorId: 1, _id: 1 });

    if (!blog) {
      return res.status(404).send({ status: false, msg: "No blog found" });
    }

    let deleteBlog = await blogModel.findOneAndUpdate(
      { _id: { $in: blog } },
      { $set: { isDeleted: true }, deletedAt: new Date() },
      { new: true }
    );
    return res.status(200).send({ status: true, body: deleteBlog });
    
  } catch (err) {
    res.status(500).send({ msg: "error", error: err.message });
  }
};

module.exports.getBlogs = getBlogs;
module.exports.updateBlogs = updateBlogs;
module.exports.createBlog = createBlog;
module.exports.deleteBlogById = deleteBlogById;
module.exports.deleteBlogByQuery = deleteBlogByQuery;
