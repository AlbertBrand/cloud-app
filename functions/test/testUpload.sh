#!/bin/sh
curl -i -X POST -H "Content-Type: multipart/form-data" -F "image=@test.jpg" https://us-central1-albert-brand-speeltuin.cloudfunctions.net/uploadImage
