const Post = require("../models/post");
const formidable = require("formidable");
const fs = require("fs");
const _ = require("lodash");

// POST BY ID
exports.postById = (req, res, next, id) => {
    Post.findById(id)
        .populate("postedBy", "_id name")
        .populate("comments.postedBy", "_id name")
        .populate("postedBy", "_id name role")
        .select("_id title body created likes comments photo")
        .exec((err, post) => {
            if (err || !post) {
                return res.status(400).json({
                    error: err
                });
            }
            req.post = post;
            next();
        });
};


// from get request in routes
// GET POSTS
// exports.getPosts = (req, res) => {
//   // get all posts from DB
//   // response:
//   const posts = Post.find()
//     .populate("postedBy", "_id name role")
//     .populate("comments", "text created")
//     .populate("comments.postedBy", "_id name")
//     .select("_id title body created likes")
//     // sort by latest created
//     .sort({ created: -1 })
//     .then((posts) => {
//     res.json(posts);
//     })
//     .catch(err => console.log(err));
// };

exports.getPosts = async (req, res) => {
    // get current page from req.query or use default value of 1
    const currentPage = req.query.page || 1;
    // return 3 posts per page
    const perPage = 6;
    let totalItems;

    const posts = await Post.find()
        // countDocuments() gives you total count of posts
        .countDocuments()
        .then(count => {
            totalItems = count;
            return Post.find()
                .skip((currentPage - 1) * perPage)
                .populate("comments", "text created")
                .populate("comments.postedBy", "_id name")
                .populate("postedBy", "_id name role")
                .sort({ created: -1 })
                .limit(perPage)
                .select("_id title body created likes");
        })
        .then(posts => {
            res.status(200).json(posts);
        })
        .catch(err => console.log(err));
};



// from post request in routes
// CREATE POST
exports.createPost = (req, res, next) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: 'Image could not be uploaded.'
            });
        }
        let post = new Post(fields);

        req.profile.hashed_password = undefined;
        req.profile.salt = undefined;
        post.postedBy = req.profile;

        if (files.photo) {
            post.photo.data = fs.readFileSync(files.photo.path);
            post.photo.contentType = files.photo.type;
        }
        post.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: 'Could not create post'
                });
            }
            res.json(result);
        });
    });
};

// POSTS BY USER
exports.postsByUser = (req, res) => {
    Post.find({ postedBy: req.profile._id })
        .populate('postedBy', '_id name')
        .select('_id title body created likes')
        .sort('_created')
        .exec((err, posts) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            res.json(posts);
        });
};

// IS POSTER
exports.isPoster = (req, res, next) => {
  let sameUser = req.post && req.auth && req.post.postedBy._id == req.auth._id;
  let adminUser = req.post && req.auth && req.auth.role === "admin";

  // console.log("req.post", req.post, "req.auth", req.auth);
  // console.log("SAMEUSER: ", sameUser, "ADMINUSER:", adminUser);

  let isPoster = sameUser || adminUser;

  // console.log("req.post: ", req.post);
  // console.log("req.auth: ", req.auth);
  // console.log("req.post.postedBy._id: ", req.post.postedBy._id);
  // console.log("req.auth._id: ", req.auth._id);

  if(!isPoster) {
    return res.status(403).json({
      error: "User is not authorized."
    });
  }
  next();
};


// UPDATE POST
exports.updatePost = (req, res, next) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if(err) {
      return res.status(400).json({
        error: "Photo could not be uploaded."
      });
    }
    // save user
    let post = req.post;
    post = _.extend(post, fields);
    post.updated = Date.now();

    if(files.photo) {
      post.photo.data = fs.readFileSync(files.photo.path);
      post.photo.contentType = files.photo.type;
    }
    post.save((err, result) => {
      if(err) {
        return res.status(400).json({
          error: err
        });
      }
      res.json(post);
    });
  });
};

// DELETE POST
exports.deletePost = (req, res) => {
  let post = req.post;
  post.remove((err, post) => {
    if(err) {
      return res.status(400).json({
        error: err
      });
    }
    res.json({
      message: "Post deleted successfully."
    });
  });
};

// PHOTO
exports.photo = (req, res, next) => {
  res.set("Content-Type", req.post.photo.contentType);
  return res.send(req.post.photo.data);
};

// SINGLE POST
exports.singlePost = (req, res) => {
  return res.json(req.post);
};

// LIKE
exports.like = (req, res) => {
  // find the post and update
  Post.findByIdAndUpdate(
    req.body.postId,
    { $push: { likes: req.body.userId } },
    { new: true }
  ).exec((err, result) => {
    if(err) {
      return res.status(400).json({
        error: err
      });
    } else {
        res.json(result);
    }
  });
};

// UNLIKE
exports.unlike = (req, res) => {
  // find the post and update
  Post.findByIdAndUpdate(
    req.body.postId,
    { $pull: { likes: req.body.userId } },
    { new: true }
  ).exec((err, result) => {
    if(err) {
      return res.status(400).json({
        error: err
      });
    } else {
        res.json(result);
    }
  });
};

// COMMENT
exports.comment= (req, res) => {
  let comment = req.body.comment;
  comment.postedBy = req.body.userId;

  Post.findByIdAndUpdate(
    req.body.postId,
    { $push: { comments: comment } },
    { new: true }
  )
  .populate("comments.postedBy", "_id name")
  .populate("postedBy", "_id name")
  .exec((err, result) => {
    if(err) {
      return res.status(400).json({
        error: err
      });
    } else {
        res.json(result);
    }
  });
};

// UNCOMMENT
exports.uncomment= (req, res) => {
  let comment = req.body.comment;

  Post.findByIdAndUpdate(
    req.body.postId,
    { $pull: { comments: { _id: comment._id } } },
    { new: true }
  )
  .populate("comments.postedBy", "_id name")
  .populate("postedBy", "_id name")
  .exec((err, result) => {
    if(err) {
      return res.status(400).json({
        error: err
      });
    } else {
        res.json(result);
    }
  });
};

exports.updateComment = (req, res) => {
    let comment = req.body.comment;

    Post.findByIdAndUpdate(req.body.postId, { $pull: { comments: { _id: comment._id } } }).exec((err, result) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        } else {
            Post.findByIdAndUpdate(
                req.body.postId,
                { $push: { comments: comment, updated: new Date() } },
                { new: true }
            )
                .populate('comments.postedBy', '_id name')
                .populate('postedBy', '_id name')
                .exec((err, result) => {
                    if (err) {
                        return res.status(400).json({
                            error: err
                        });
                    } else {
                        res.json(result);
                    }
                });
        }
    });
};
