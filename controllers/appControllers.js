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

//Upload timetable
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

    var options = {
      mode: "text",
      args: [filepath],
    };

    PythonShell.run("./freeSlots.py", options, function (err, results) {
      if (err)
        res.status(400).json({
          message: "something went wrong",
          error: err,
        });
      else {
        var timetableArray = JSON.parse(results);

        new UserSlots({
          _id: new mongoose.Types.ObjectId(),
          name: req.body.name,
          semester: req.body.semester,
          timetable: timetableArray,
        })
          .save()
          .then((data) => {
            res.status(201).json({
              message: "Uploaded successfully",
              result: data,
            });
          })
          .catch((err) =>
            res.status(400).json({
              message: "Something went wrong",
              error: err,
            })
          );
      }
    });
  });
});

//Get names of all users
router.get("/all", function (req, res) {
  UserSlots.find({}, { _id: 0, name: 1 })
    .then((data) => {
      console.log(data);
      res.status(200).json({
        count: data.length,
        result: data,
      });
    })
    .catch((err) => console.log(err));
});

//Get timetable of one user
router.get("/compare", (req, res, next) => {
  var arr = req.query.check;
  console.log(arr);
  UserSlots.find(
    { name: { $in: arr } },
    { _id: 0, name: 1, semester: 1, timetable: 1 }
  )
    .then((data) => {
      res.status(200).json({
        message: "success",
        result: data,
      });
    })
    .catch((err) => {
      res.status(400).json({ error: err });
    });
});

module.exports = router;
