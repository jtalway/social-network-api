exports.createPostValidator = (req, res, next) => {
  // title requirements
  req.check("title", "Title cannot be empty. Please write a title").notEmpty();
  req.check("title", "Title must be 4 to 150 characters long").isLength({min: 4, max: 150});
  // body requirements
  req.check("body", "Body cannot be empty. Please write body text").notEmpty();
  req.check("body", "Body must be 4 to 2000 characters long").isLength({min: 4, max: 2000});
  // check for errors
  const errors = req.validationErrors();
  // if error, show as they appear
  if(errors) {
    const firstError = errors.map((error) => error.msg)[0]
    return res.status(400).json({error: firstError});
  }
  // proceed to next middleware
  next();
};

exports.userSignupValidator = (req, res, next) => {
  // name requirements
  req.check("name", "Name is required.").notEmpty();
  // email requirements
  req.check("email", "Email must be 3 to 32 characters long")
  .matches(/.+\@.+\..+/)
  .withMessage("Email must contain @")
  .isLength({
    min: 4,
    max: 2000
  });
  // password requirements
  req.check("password", "Password is required.").notEmpty();
  req.check("password")
  .isLength({min: 8})
  .withMessage("Password must be at least 8 characters long.")
  .matches(/\d/)
  .withMessage("Password must contain at least one number.");
  // check for errors
  const errors = req.validationErrors();
  // if error, show as they appear
  if(errors) {
    const firstError = errors.map((error) => error.msg)[0]
    return res.status(400).json({error: firstError});
  }
  // proceed to next middleware
  next();
};

exports.passwordResetValidator = (req, res, next) => {
    // check for password
    req.check("newPassword", "Password is required").notEmpty();
    req.check("newPassword")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 chars long")
        .matches(/\d/)
        .withMessage("must contain a number")
        .withMessage("Password must contain a number");

    // check for errors
    const errors = req.validationErrors();
    // if error show the first one as they happen
    if (errors) {
        const firstError = errors.map(error => error.msg)[0];
        return res.status(400).json({ error: firstError });
    }
    // proceed to next middleware or ...
    next();
};
