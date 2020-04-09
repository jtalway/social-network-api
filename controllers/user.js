const _ = require("lodash");
const User = require("../models/user");
const formidable = require("formidable");
const fs = require("fs");

// USER BY ID
exports.userById = (req, res, next, id) => {
  User.findById(id)
    // populate followers and following users array
    .populate("following", "_id name")
    .populate("followers", "_id name")
    .exec((err, user) => {
      if(err || !user) {
        return res.status(400).json({
          error: "User not found."
        });
      }
      req.profile = user; // adds profile object in req with user info
      next();
  });
};

exports.hasAuthorization = (req, res, next) => {
    let sameUser = req.profile && req.auth && req.profile._id == req.auth._id;
    let adminUser = req.profile && req.auth && req.auth.role === 'admin';

    const authorized = sameUser || adminUser;

    // console.log("req.profile ", req.profile, " req.auth ", req.auth);
    // console.log("SAMEUSER", sameUser, "ADMINUSER", adminUser);

    if (!authorized) {
        return res.status(403).json({
            error: 'User is not authorized to perform this action'
        });
    }
    next();
};

// ALL USERS
exports.allUsers = (req, res, next) => {
  User.find((err, users) => {
    if(err) {
      return res.status(400).json({
        error: err
      });
    }
    res.json(users);
  }).select("name email updated created");
};

// GET USER
exports.getUser = (req, res) => {
  // do not send properties to frontend
  req.profile.hashed_password = undefined;
  req.profile.salt = undefined;
  // return profile as json response
  return res.json(req.profile);
};

// // UPDATE USER
// exports.updateUser = (req, res, next) => {
//   // extract user info from user profile
//   let user = req.profile;
//   // extend - mutate the source object
//   // update user with req.body
//   user = _.extend(user, req.body);
//   // set updated property
//   user.updated = Date.now();
//   // save user
//   user.save((err) => {
//     if(err) {
//       return res.status(400).json({
//         error: "You are not authorized to perform this action."
//       });
//     }
//     // do not send properties to frontend
//     user.hashed_password = undefined;
//     user.salt = undefined;
//     // return user as json response
//     res.json({user})
//   });
// };

// UPDATE USER
exports.updateUser = (req, res, next) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if(err) {
      return res.status(400).json({
        error: "Photo could not be uploaded."
      });
    }
    // save user
    let user = req.profile;
    user = _.extend(user, fields);
    user.updated = Date.now();

    if(files.photo) {
      user.photo.data = fs.readFileSync(files.photo.path);
      user.photo.contentType = files.photo.type;
    }
    user.save((err, result) => {
      if(err) {
        return res.status(400).json({
          error: err
        });
      }
      user.hashed_password = undefined;
      user.salt = undefined;
      res.json(user);
    });
  });
};

// USER PHOTO
exports.userPhoto = (req, res, next) => {
  if(req.profile.photo.data) {
    res.set("Content-Type", req.profile.photo.contentType);
    return res.send(req.profile.photo.data);
  }
  next();
};

// DELETE USER
exports.deleteUser = (req, res, next) => {
  let user = req.profile;
  user.remove((err, user) => {
    if(err) {
      return res.status(400).json({
        error: err
      });
    }
    res.json({
      message: "User has been deleted."
    });
  });
};

// ADD FOLLOWING
exports.addFollowing = (req, res, next) => {
  User.findByIdAndUpdate(
    req.body.userId,
    {$push: {following: req.body.followId}},
    (err, result) => {
      if(err) {
        return res.status(400).json({
          error:err
        });
      }
      next();
    });
};

// ADD FOLLOWER
exports.addFollower = (req, res) => {
  User.findByIdAndUpdate(
    req.body.followId,
    { $push: { followers: req.body.userId }},
    { new: true }
  )
  .populate("following", "_id name")
  .populate("followers", "_id name")
  .exec((err, result) => {
    if(err) {
      return res.status(400).json({ error:err });
    }
    result.hashed_password = undefined;
    result.salt = undefined;
    res.json(result);
    });
};

// REMOVE FOLLOWING
exports.removeFollowing = (req, res, next) => {
  User.findByIdAndUpdate(
    req.body.userId,
    { $pull: { following: req.body.unfollowId }},
    (err, result) => {
      if(err) {
        return res.status(400).json({
          error:err
        });
      }
      next();
    });
};

// REMOVE FOLLOWER
exports.removeFollower = (req, res) => {
  User.findByIdAndUpdate(
    req.body.unfollowId,
    { $pull: { followers: req.body.userId }},
    { new: true }
  )
  .populate("following", "_id name")
  .populate("followers", "_id name")
  .exec((err, result) => {
    if(err) {
      return res.status(400).json({ error:err });
    }
    result.hashed_password = undefined;
    result.salt = undefined;
    res.json(result);
    });
};

// FIND PEOPLE
exports.findPeople = (req, res) => {
  // all people user is following
  let following = req.profile.following;
  // user himself
  following.push(req.profile._id);
  // find the users not include (nin) people user is following
  User.find({_id: {$nin: following}}, (err, users) => {
    if(err) {
      return res.status(400).json({
        error: err
      });
    }
    res.json(users);
  })
    // just show name
    .select("name");
};
