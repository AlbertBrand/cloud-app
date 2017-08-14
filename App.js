import React from 'react';
import {
  ActivityIndicator,
  Button,
  Image,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { ImagePicker } from 'expo';
import * as firebase from 'firebase';
import base64 from 'base-64';

const uploadFunctionUri = 'https://us-central1-albert-brand-speeltuin.cloudfunctions.net/uploadImage';
const config = {
  apiKey: "AIzaSyDjXyFPFhBvHWvRBoGm2umbhUGfjEDkZ-E",
  authDomain: "albert-brand-speeltuin.firebaseapp.com",
  databaseURL: "https://albert-brand-speeltuin.firebaseio.com",
  projectId: "albert-brand-speeltuin",
  storageBucket: "albert-brand-speeltuin.appspot.com",
  messagingSenderId: "1017341325599"
};
firebase.initializeApp(config);

// workaround for firebase long timers causing a warning
console.ignoredYellowBox = ['Setting a timer'];

export default class App extends React.Component {
  state = {
    imageUri: null,
    imageData: null,
    userId: null,
  };
  imageDataRef = null;

  constructor() {
    super();

    const auth = firebase.auth();
    auth.onAuthStateChanged((user) => {
      this.setState({ userId: user.uid });
      console.log("onAuthStateChanged", user.uid);
    });

    auth.signInAnonymously().catch(function(error) {
      console.error(error);
    });
  }

  render() {
    const { userId, imageUri } = this.state;
    if (!userId) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large"/>
        </View>
      )
    }
    return (
      <View style={styles.center}>
        {imageUri &&
         <Image source={{ uri: imageUri }} style={{ width: 200, height: 200 }} />}

        {this.renderImageData()}

        <Button
          title="Image picker"
          onPress={this.pickImage}
        />
      </View>
    );
  }

  renderImageData() {
    if (!this.state.imageData) {
      return;
    }
    if (this.state.imageData.state !== 'done') {
      return (
        <Text>{this.state.imageData.state}</Text>
      );
    }
    return Object.keys(this.state.imageData.labels).map((key) => {
      const label = this.state.labels[key];
      return (
        <Text key={key}>{label}</Text>
      );
    });
  }

  pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync();
    if (result.cancelled) {
      return;
    }

    // show image
    this.setState({ imageUri: result.uri });

    // generate an image id via firebase and set status
    const { userId } = this.state;
    const imageRef = await firebase.database().ref(`user/${userId}/image/`).push({ state: 'uploading' });
    const imageId = imageRef.key;

    // upload image via post request
    const body = new FormData();
    body.append('image', {
      uri: result.uri,
      name: 'image.jpg',
      type: 'image/jpg',
    });
    body.append('userId', userId);
    body.append('imageId', imageId);
    fetch(uploadFunctionUri, {
      method: 'POST',
      body
    });

    // listen to new image data
    if (this.imageDataRef !== null) {
      this.imageDataRef.off();
      this.setState({ imageData: null });
    }
    this.imageDataRef = firebase.database().ref(`user/${userId}/image/${imageId}`);
    this.imageDataRef.on('value', (snapshot) => {
      const imageData = snapshot.val();
      this.setState({ imageData });
    });
  }
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
