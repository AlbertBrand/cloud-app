import React from 'react';
import { Button, Image, StyleSheet, Text, View } from 'react-native';
import { ImagePicker } from 'expo';
import * as firebase from 'firebase';
import base64 from 'base-64';

var config = {
  apiKey: "AIzaSyDjXyFPFhBvHWvRBoGm2umbhUGfjEDkZ-E",
  authDomain: "albert-brand-speeltuin.firebaseapp.com",
  databaseURL: "https://albert-brand-speeltuin.firebaseio.com",
  projectId: "albert-brand-speeltuin",
  storageBucket: "albert-brand-speeltuin.appspot.com",
  messagingSenderId: "1017341325599"
};
firebase.initializeApp(config);

export default class App extends React.Component {
  state = {
    messages: {},
    image: null,
  };
  user = null;

  constructor() {
    super();

    firebase.database().ref('messages').limitToLast(2).on('value', (snapshot) => {
      const messages = snapshot.val();
      this.setState({ messages });
    });

    firebase.auth().onAuthStateChanged((user) => {
      console.log("onAuthStateChanged", user);
      this.user = user;
    });

    firebase.auth().signInAnonymously().catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // ...
    });
  }

  render() {
    const { image } = this.state;
    return (
      <View style={styles.container}>
        {image &&
         <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />}
        <Button
          title="Image picker"
          onPress={this.pickImage}
        />

        {this.state.messages && Object.keys(this.state.messages).map((key) => {
          const message = this.state.messages[key];
          return (
            <View key={key}>
              <Text>{message.name}</Text>
              <Text>{message.text}</Text>
            </View>
          );
        })}
      </View>
    );
  }

  pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      base64: true
    });
    if (result.cancelled) {
      return;
    }
    const byteArray = this.convertToByteArray(result.base64);
    const ref = `users/${this.user.uid}/uploads/upload.jpg`;
    console.log('ref', ref);
    const storageRef = firebase.storage().ref(ref);

    // put doesn't seem to work
    const uploadTask = storageRef.put(byteArray, { contentType: 'image/jpg' });
    uploadTask.on('state_changed', (snapshot) => {
      var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log('Upload is ' + progress + '% done');
    }, (error) => {
      console.log("in _uploadAsByteArray ", error)
    }, () => {
      var downloadURL = uploadTask.snapshot.downloadURL;
      console.log("_uploadAsByteArray ", uploadTask.snapshot.downloadURL)
    });

    this.setState({ image: result.uri });
  };

  convertToByteArray = (input) => {
    var binary_string = base64.decode(input);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
  };
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
