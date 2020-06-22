const fs = require("fs");
const path = require("path");
var bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
const { PythonShell } = require("python-shell");
const multer = require("multer");

const router = express.Router();

const userSchema = require("../models/userSlot");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() +
        file.fieldname +
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

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
});

router.post("/upload", upload.single("file"), (req, res, next) => {
  console.log(req.file);
  res.status(200).json(req.file);
});

module.exports = router;
