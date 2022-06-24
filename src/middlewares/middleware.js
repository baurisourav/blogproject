const jwt = require('jsonwebtoken')
const blogModel = require('../models/blogModel')
const authenticate = async function (req, res, next) {
  try {
    let token = req.headers['x-api-key'];
    if (!token) {
      return res.status(400).send({status:false, msg:"Add Token"})
    }
    const decodedToken = jwt.verify(token, "projectblogg18")
    if (!decodedToken) {
      return res.status(400).send({status:false,msg:"Invalid Token"})
    }
    req.decodedToken = decodedToken;
    next();
  } catch (err) {
    res.status(500).send({status:false, msg:err.message})
  }
}

const authorize = async function (req, res, next) {
  try {
    let blogId = req.params.blogId;
    if (!blogId) {
      return res.status(400).send({status:false, msg:"enter blog id please"})
    }
    let getData = await blogModel.findById(blogId).select({ authorId: 1, _id: 0 })
    if (!getData) {
      return res.status(400).send({status:false, msg:"Enter correct blog id"})
    }
    let token = req.headers['x-api-key'];
    if (!token) {
      return res.status(400).send({status:false, msg:"Add Token"})
    }
    const decodedToken = jwt.verify(token, "projectblogg18")
    if (!decodedToken) {
      return res.status(400).send({status:false,msg:"Invalid Token"})
    }
    if (decodedToken.authorId != getData.authorId) {
      return res.status(403).send({status:false, msg:"Not Authorized"})
    }
    next();
  } catch (err) {
    res.status(500).send({status:true, msg:err.message})
  }

}

module.exports.authenticate = authenticate;
module.exports.authorize = authorize;