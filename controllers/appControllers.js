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
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(new Error());
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
    onError: function (err, next) {
      console.log("error", err);
      next(err);
    },
  }).single("file");

  upload(req, res, (err) => {
    // if (err) {
    // return res.status(400).json({
    //   error: "PLease select correct file",
    // });
    // }

    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        error: "PLease select correct file",
      });
    } else if (err) {
      return res.status(400).json({
        error: "Something went wrong",
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
        return res.status(400).json({
          message: "Something went wrong",
          error: "Please upload valid and correctly cropped timetable",
        });
      else {
        var timetableArray = JSON.parse(results);

        new UserSlots({
          _id: new mongoose.Types.ObjectId(),
          name: req.body.name.toLowerCase(),
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

//Get all uploaded information of everyone
router.get("/all", function (req, res) {
  UserSlots.find({}, { __v: 0 })
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
  UserSlots.find(
    { name: { $in: arr } },
    { _id: 0, name: 1, semester: 1, timetable: 1 }
  )
    .then((data) => {
      const numTimetables = data.length;

      if (numTimetables >= 1) {
        //save the timetable of first person in an array called first
        var first = data[0].timetable;
        var newarr = [];

        // loop to initialize every element of newarr to 0
        for (var j = 0; j < 5; j++) {
          newarr[j] = [];
          for (var k = 0; k < 22; k++) {
            newarr[j][k] = 0;
          }
        }

        // loop to compare each timetable to the first one
        for (var i = 1; i < data.length; i++) {
          //save the details of the current user in newvar
          var newvar = data[i].timetable;
          // console.log("next log is the timetable of person " + (i + 1));
          // console.log("newvar", newvar);
          for (var j = 0; j < 5; j++) {
            for (var k = 0; k < 22; k++) {
              if (first[j][k] == 1 && newvar[j][k] == 1) {
                newarr[j][k] = newarr[j][k] + 1;
              } else {
                newarr[j][k] = 0;
              }
            }
          }
        }

        // finding the max element of newarr
        var maxRow = newarr.map(function (row) {
          return Math.max.apply(Math, row);
        });
        var max = Math.max.apply(null, maxRow);

        // console.log("Total number of timetables checking:", max);

        // loop to replace number<max with 0 in newarr
        for (var j = 0; j < 5; j++) {
          for (var k = 0; k < 22; k++) {
            if (newarr[j][k] !== max) {
              newarr[j][k] = 0;
            }
          }
        }

        //loop to replace max with 1 in newarr
        for (var j = 0; j < 5; j++) {
          for (var k = 0; k < 22; k++) {
            if (newarr[j][k] === max) {
              newarr[j][k] = 1;
            }
          }
        }
      }

      res.status(200).json({
        message: "Success",
        numberOfTimetablesCompared: numTimetables,
        commonFreeSlots: newarr,
      });
    })
    .catch((err) => {
      res.status(400).json({
        error: err,
      });
    });
});

router.get("/users/:search", (req, res, next) => {
  let search = req.params.search.toLowerCase();
  console.log(search);
  let reg = new RegExp(search);
  console.log(reg);
  UserSlots.find({ name: { $in: [reg] } })
    .then((user) => {
      res.status(200).json({
        count: user.length,
        users: user,
      });
    })
    .catch((err) => {
      res.status(400).json({
        error: err,
      });
    });
});

module.exports = router;
