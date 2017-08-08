const functions = require('firebase-functions');
const admin = require('firebase-admin');
const gcs = require('@google-cloud/storage')();
const vision = require('@google-cloud/vision')();
const Multer = require('multer');

admin.initializeApp(functions.config().firebase);

exports.addMessage = functions.https.onRequest((req, res) => {
  const text = req.query.text;
  admin.database().ref('/cloud-messages').push({text: text}).then(snapshot => {
    // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
    res.redirect(303, snapshot.ref);
  });
});

exports.detectLabels = functions.storage.object().onChange(event => {
  const object = event.data;

  if (object.resourceState === 'not_exists') {
    return console.log('This is a deletion event.');
  } else if (!object.name) {
    return console.log('This is a deploy event.');
  }

  const bucket = gcs.bucket(object.bucket);
  const file = bucket.file(object.name);

  return vision.detectLabels(file).then(data => {
    const labels = data[0];
    return admin.database().ref('/photo').update({ labels });
  });
});

exports.uploadImage = functions.https.onRequest((req, res) => {
  if (req.method !== 'POST') {
    res.status(403).send('Forbidden!');
  }

  console.log('POST event');
  multer.single('image')(req, res, () => {
    // console.log('multer req', req);
    sendUploadToGCS(req, res, () => {
      // console.log('upload req', req);
      res.end();
    })
  });
});


// Express middleware that will automatically pass uploads to Cloud Storage.
// req.file is processed and will have two new properties:
// * ``cloudStorageObject`` the object name in cloud storage.
// * ``cloudStoragePublicUrl`` the public url to the object.
// [START process]
function sendUploadToGCS(req, res, next) {
  if (!req.file) {
    console.log('no file found');
    return next();
  }

  const bucket = gcs.bucket('albert-brand-speeltuin.appspot.com');
  const gcsname = Date.now() + req.file.originalname;
  const file = bucket.file(gcsname);

  const stream = file.createWriteStream({
    metadata: {
      contentType: req.file.mimetype
    }
  });

  stream.on('error', (err) => {
    req.file.cloudStorageError = err;
    next(err);
  });

  stream.on('finish', () => {
    req.file.cloudStorageObject = gcsname;
    file.makePublic().then(() => {
      // req.file.cloudStoragePublicUrl = getPublicUrl(gcsname);
      next();
    });
  });

  stream.end(req.file.buffer);
}
// [END process]

// Multer handles parsing multipart/form-data requests.
// This instance is configured to store images in memory.
// This makes it straightforward to upload to Cloud Storage.
// [START multer]
const multer = Multer({
  storage: Multer.MemoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // no larger than 5mb
  }
});
// [END multer]
