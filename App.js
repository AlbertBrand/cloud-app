/* @flow */
import React from 'react';
import {
  ActivityIndicator,
  Button,
  Image,
  Platform,
  Text,
  View,
} from 'react-native';
import { ImagePicker } from 'expo';
import * as firebase from 'firebase';

const uploadFunctionUri =
  'https://us-central1-albert-brand-speeltuin.cloudfunctions.net/uploadImage';
const config = {
  apiKey: 'AIzaSyDjXyFPFhBvHWvRBoGm2umbhUGfjEDkZ-E',
  authDomain: 'albert-brand-speeltuin.firebaseapp.com',
  databaseURL: 'https://albert-brand-speeltuin.firebaseio.com',
  projectId: 'albert-brand-speeltuin',
  storageBucket: 'albert-brand-speeltuin.appspot.com',
  messagingSenderId: '1017341325599',
};

// workaround for firebase long timers causing a warning
(console: Object).ignoredYellowBox = ['Setting a timer'];

type State = {
  imageUri?: string,
  userId?: string,
  label?: string,
};
class App extends React.Component {
  state: State = {};

  constructor() {
    super();
    firebase.initializeApp(config);

    this.authListener();
    this.labelListener();
  }

  render() {
    const { userId } = this.state;
    if (!userId) {
      return (
        <View style={[styles.root, styles.center]}>
          <ActivityIndicator size="large" />
        </View>
      );
    }
    return (
      <View style={styles.root}>
        <View style={[styles.imageHolder, styles.center]}>
          <Text style={styles.stateText}>
            Looking for "{this.state.label}"
          </Text>
          {this.renderImage()}
        </View>

        <View style={styles.labelButtonHolder}>
          <View style={styles.buttonHolder}>
            <Button title="Take photo" onPress={this.pickImage} />
          </View>
        </View>
      </View>
    );
  }

  renderImage() {
    const { imageUri } = this.state;
    return (
      imageUri && <Image source={{ uri: imageUri }} style={styles.image} />
    );
  }

  authListener() {
    const auth = firebase.auth();
    auth.onAuthStateChanged(user => {
      if (user) {
        this.setState({ userId: user.uid });
        console.log('onAuthStateChanged', user.uid);
      } else {
        console.log('user is undefined');
      }
    });

    auth.signInAnonymously().catch(function(error) {
      console.error(error);
    });
  }

  labelListener() {
    firebase.database().ref('label').on('value', snapshot => {
      const label = snapshot.val();
      this.setState({ label });
    });
  }

  pickImage = async () => {
    const { userId } = this.state;
    if (!userId) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync();
    if (result.cancelled) {
      return;
    }

    // show image
    this.setState({ imageUri: result.uri });

    // generate an image id via firebase and set status
    const imageRef = await firebase
      .database()
      .ref(`user/${userId}/image/`)
      .push({ state: 'uploading' });
    const imageId = imageRef.key;

    // upload image via post request
    const body = new FormData();
    (body: Object).append('image', {
      uri: result.uri,
      name: 'image.jpg',
      type: 'image/jpg',
    });
    body.append('userId', userId);
    body.append('imageId', imageId);
    fetch(uploadFunctionUri, {
      method: 'POST',
      body,
    });
  };
}
export default App;

const styles = {
  root: {
    flex: 1,
    marginTop: Platform.select({ ios: 0, android: 24 }),
  },
  imageHolder: {
    flex: 1,
    backgroundColor: '#eeeeee',
    padding: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  labelButtonHolder: {
    flex: 1,
  },
  buttonHolder: {
    padding: 10,
  },
  stateText: {
    fontSize: 16,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
};
