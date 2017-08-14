#!/bin/sh
curl -i -X POST -H "Content-Type: multipart/form-data" -F "image=@test.jpg" -F "userId=testuser" -F "imageId=testimage" http://localhost:5000/albert-brand-speeltuin/us-central1/uploadImage
