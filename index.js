var admin = require("firebase-admin");
const uuid = require("uuid-v4");
const express = require("express");
var fs = require("fs");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");

const serviceAccount = require("/etc/secrets/pwa-course-79727.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://pwa-course-79727-default-rtdb.asia-southeast1.firebasedatabase.app",
  storageBucket: "pwa-course-79727.appspot.com",
});

const app = express();
app.use(cors({ origin: true }));
app.use(bodyParser.json({ extended: true }));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

//Multer Code
const storageEngine = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}--${file.originalname}`);
  },
});
const checkFileType = function (file, cb) {
  const fileTypes = /jpeg|jpg|png/;
  const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = fileTypes.test(file.mimetype);
  if (mimeType && extName) {
    return cb(null, true);
  } else {
    cb("Error: You can Only Upload Images!!");
  }
};
const upload = multer({
  storage: storageEngine,
  limits: { fileSize: 3000000 },
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
});

app.post("/storePostData", upload.single("file"), (request, response) => {
  console.log("[Request]", request.body);
  var bucket = admin.storage().bucket();
  var filename = `uploads/${request.file.filename}`;
  let image = undefined;
  async function uploadFile() {
    const metadata = {
      metadata: {
        firebaseStorageDownloadTokens: uuid(),
      },
      contentType: "image/jpg",
      cacheControl: "public, max-age=31536000",
    };

    const data = await bucket.upload(filename, {
      gzip: true,
      metadata: metadata,
    });
    image = data[0].metadata.mediaLink;
    console.log(`${filename} uploaded.`);
  }
  uploadFile()
    .then((res) => {
      fs.unlink(`uploads/${request.file.filename}`, function (err) {
        if (err) return console.log(err);
        console.log("file deleted successfully");
      });
      response.json({ "[File Send Successfully]": filename, image: image });
    })
    .catch((error) => {
      console.log("Error");
      fs.unlink(`uploads/${request.file.filename}`, function (err) {
        if (err) return console.log(err);
        console.log("file deleted successfully");
      });
      response.json({ "[Error in upload]": error });
    });
});

const port = 5000 || process.env.PORT;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
