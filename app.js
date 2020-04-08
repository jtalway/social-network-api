// make npm express available
const express = require("express");
// express app
const app = express();
// import mongoose
const mongoose = require("mongoose");
// morgan - HTTP request logger middleware for node.js
const morgan = require("morgan");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const expressValidator = require("express-validator");
const fs = require("fs");
const cors = require("cors");
// load env variables
const dotenv = require("dotenv");
dotenv.config()

//db connection
mongoose.connect(
  process.env.MONGO_URI,
  {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }
)
.then(() => console.log("[+] DB Connected"))
// mongoose error handler
mongoose.connection.on("error", err => {
  console.log(`DB connection error: ${err.message}`)
});



// bring in routes from external modules
const postRoutes = require("./routes/post");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
// apiDocs
app.get("/api", (req, res) => {
  fs.readFile("docs/apiDocs.json", (err, data) => {
    if(err) {
      res.status(400).json({
        error: err
      });
    }
    const docs = JSON.parse(data);
    res.json(docs);
  });
});

// const myOwnMiddleware = (req, res, next) => {
//   console.log('[+] Middleware applied');
//   next();
// };

// middleware
// see what routes you are getting request from
app.use(morgan("dev"));
// app.use(myOwnMiddleware);
// any incoming request with body to json object
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressValidator());
app.use(cors());
// handle any requests coming to base url
app.use("/api", postRoutes);
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({error: "Unauthorized Access."});
  }
});

// port variable
const port = process.env.PORT || 8080
// listen @ port
app.listen(port, () => {console.log(`[+] NodeJS API is listening on port ${port}`);
});
