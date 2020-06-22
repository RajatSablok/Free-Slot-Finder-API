const fs = require("fs");
const path = require("path");
var bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
const { PythonShell } = require("python-shell");
const multer = require("multer");

const router = express.Router();

const UserSlots = require("../models/userSlot");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      path.basename(file.originalname, path.extname(file.originalname)) +
        "-" +
        Date.now() +
        path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 1024 * 1024 * 5,
//   },
//   fileFilter: fileFilter,
// });

// router.post("/upload", upload.single("file"), (req, res, next) => {
//   console.log(req.file);
//   res.status(200).json(req.file);
// });

router.post("/upload", (req, res, next) => {
  var upload = multer({
    storage: storage,
    limits: {
      fileSize: 1024 * 1024 * 5,
    },
    fileFilter: fileFilter,
  }).single("file");

  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: err,
      });
    }

    let filepath =
      path.dirname(__dirname) + "/public/uploads/" + req.file.filename;

    // console.log(filepath);
    var options = {
      mode: "text",
      args: [filepath], // pass arguments to the script here
    };

    PythonShell.run("./freeSlots.py", options, function (err, results) {
      if (err) res.json({ err });
      console.log(results);

      // new UserSlots({ name: req.body.text, timetable: results })
      //   .save()
      //   .then((data) => {
      //     console.log(data);
      //     // res.render("upload", { results: data });
      //   })
      //   .catch((err) => res.json({ err }));
      // });
    });
  });
});

module.exports = router;
