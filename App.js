/* @flow */
import React from 'react';
import {
  ActivityIndicator,
  Button,
  Image,
  Platform,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { ImagePicker } from 'expo';
import * as firebase from 'firebase';
import base64 from 'base-64';

import withMode from './withMode';

const uploadFunctionUri = 'https://us-central1-albert-brand-speeltuin.cloudfunctions.net/uploadImage';
const config = {
  apiKey: "AIzaSyDjXyFPFhBvHWvRBoGm2umbhUGfjEDkZ-E",
  authDomain: "albert-brand-speeltuin.firebaseapp.com",
  databaseURL: "https://albert-brand-speeltuin.firebaseio.com",
  projectId: "albert-brand-speeltuin",
  storageBucket: "albert-brand-speeltuin.appspot.com",
  messagingSenderId: "1017341325599"
};

// workaround for firebase long timers causing a warning
(console:Object).ignoredYellowBox = ['Setting a timer'];

type Props = {
  mode: 'portrait' | 'landscape',
}
type State = {
  imageUri?: string,
  imageData?: {
    state: string,
    labels: {
      [key: string]: string,
    },
  },
  userId?: string,
  label?: string,
}
type Ref = {
  on: (event: string, (snapshot: Object) => void) => void,
  off: () => void,
}
class App extends React.Component {
  props: Props;
  state: State = {};
  imageDataRef: Ref;

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
        <View style={[this.styles.root, this.styles.center]}>
          <ActivityIndicator size="large"/>
        </View>
      )
    }
    return (
      <View style={this.styles.root}>
        <View style={[this.styles.imageHolder, this.styles.center]}>
          <Text style={this.styles.stateText}>Looking for "{this.state.label}"</Text>
          {this.renderImage()}
        </View>

        <View style={this.styles.labelButtonHolder}>
          <View style={[this.styles.labelHolder, this.styles.center]}>
            {this.renderImageData()}
          </View>

          <View style={this.styles.buttonHolder}>
            <Button
              title="Take photo"
              onPress={this.pickImage} />
          </View>
        </View>
      </View>
    );
  }

  renderImage() {
    const { imageUri } = this.state;
    return imageUri && (
      <Image source={{ uri: imageUri }} style={this.styles.image} />
    );
  }

  renderImageData() {
    const { imageData } = this.state;
    if (!imageData) {
      return;
    }
    if (imageData.state !== 'done') {
      return [
        <ActivityIndicator key={1}/>,
        <Text key={2} style={this.styles.stateText}>{imageData.state}...</Text>
      ];
    }
    return Object.keys(imageData.labels).map((key) => {
      const label = imageData.labels[key];
      const matchesLabelStyle = this.state.label === label ? this.styles.matchesLabel : null;
      return (
        <View key={key} style={[this.styles.label, this.styles.center]}>
          <Text style={[this.styles.labelText, matchesLabelStyle]}>{label}</Text>
        </View>
      );
    });
  }

  authListener() {
    const auth = firebase.auth();
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.setState({ userId: user.uid });
        console.log("onAuthStateChanged", user.uid);
        this.labelListener();
      } else {
        console.log("user is undefined")
      }
    });

    auth.signInAnonymously().catch(function(error) {
      console.error(error);
    });
  }

  labelListener() {
    firebase.database().ref('label').on('value', (snapshot) => {
      console.log('label change');
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
    const imageRef = await firebase.database().ref(`user/${userId}/image/`).push({ state: 'uploading' });
    const imageId = imageRef.key;

    // upload image via post request
    const body = new FormData();
    (body:Object).append('image', {
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
    if (this.imageDataRef !== undefined) {
      this.imageDataRef.off();
      this.setState({ imageData: undefined });
    }
    this.imageDataRef = firebase.database().ref(`user/${userId}/image/${imageId}`);
    this.imageDataRef.on('value', (snapshot) => {
      const imageData = snapshot.val();
      this.setState({ imageData });
    });
  }

  get styles(): Object {
    const { mode } = this.props;
    return responsiveStyles[mode];
  }
}
export default withMode(App);

const styles = {
  root: {
    flex: 1,
    marginTop: Platform.select({ ios: 0, android: 24 })
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
  labelHolder: {
    flex: 1,
    padding: 10,
  },
  label: {
    flex: 1,
  },
  stateText: {
    fontSize: 16,
  },
  labelText: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  buttonHolder: {
    padding: 10,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchesLabel: {
    color: 'white',
    backgroundColor: 'green'
  }
};

const responsiveStyles = {
  portrait: StyleSheet.create(styles),
  landscape: StyleSheet.create({
    ...styles,
    root: {
      ...styles.root,
      flexDirection: 'row'
    }
  })
}
