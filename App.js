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
    labels: null,
  };
  user = null;

  constructor() {
    super();

    firebase.database().ref('photo/labels').on('value', (snapshot) => {
      const labels = snapshot.val();
      this.setState({ labels });
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

        {this.state.labels && Object.keys(this.state.labels).map((key) => {
          const label = this.state.labels[key];
          return (
            <Text key={key}>{label}</Text>
          );
        })}
      </View>
    );
  }

  pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
    });
    if (result.cancelled) {
      return;
    }

    await firebase.database().ref('photo/labels').set(null);
    this.setState({ image: result.uri });

    const body = new FormData();
    body.append('image', {
      uri: result.uri,
      name: 'upload.jpg',
      type: 'image/jpg'
    });
    fetch('https://us-central1-albert-brand-speeltuin.cloudfunctions.net/uploadImage', {
      method: 'POST',
      body
    });
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
