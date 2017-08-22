const functions = require('firebase-functions');
const admin = require('firebase-admin');
const gcs = require('@google-cloud/storage')();
const vision = require('@google-cloud/vision')();
const Multer = require('multer');

admin.initializeApp(functions.config().firebase);

exports.detectLabels = functions.storage.object().onChange(event => {
  const object = event.data;

  if (object.resourceState === 'not_exists') {
    return console.log('This is a deletion event.');
  } else if (!object.name) {
    return console.log('This is a deploy event.');
  }

  const { userId, imageId } = object.metadata;
  admin
    .database()
    .ref(`user/${userId}/image/${imageId}/state`)
    .set('processing');

  const bucket = gcs.bucket(object.bucket);
  const file = bucket.file(object.name);

  return vision.detectLabels(file).then(data => {
    const labels = data[0];
    return admin.database().ref(`user/${userId}/image/${imageId}`).set({
      state: 'done',
      labels,
    });
  });
});

exports.uploadImage = functions.https.onRequest((req, res) => {
  if (req.method !== 'POST') {
    res.status(403).send('Forbidden!').end();
    returnl;
  }

  // call middleware to handle multipart requests
  multer.single('image')(req, res, () => {
    const { userId, imageId } = req.body;
    // check if user and image path exists in db (as a rudimentary auth check)
    admin
      .database()
      .ref(`user/${userId}/image/${imageId}/state`)
      .once('value', snapshot => {
        if (!snapshot.val()) {
          console.error(
            `could not find path user/${userId}/image/${imageId}/state`,
          );
          res.status(403).send('Forbidden!').end();
          return;
        }

        // upload to firebase storage
        sendUploadToGCS(req, res, () => {
          res.end();
        });
      });
  });
});

// Express middleware that will automatically pass uploads to Cloud Storage.
function sendUploadToGCS(req, res, next) {
  if (!req.file) {
    console.log('no file found');
    return next();
  }

  const { userId, imageId } = req.body;
  const bucket = gcs.bucket('albert-brand-speeltuin.appspot.com');
  const gcsname = `user/${userId}/image/${imageId}/${req.file.originalname}`;
  const file = bucket.file(gcsname);

  const stream = file.createWriteStream({
    metadata: {
      contentType: req.file.mimetype,
      metadata: {
        userId,
        imageId,
      },
    },
  });

  stream.on('error', err => {
    req.file.cloudStorageError = err;
    next(err);
  });

  stream.on('finish', () => {
    req.file.cloudStorageObject = gcsname;
    next();
  });

  stream.end(req.file.buffer);
}

// Multer handles parsing multipart/form-data requests.
const multer = Multer({
  storage: Multer.MemoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // no larger than 5mb
  },
});
