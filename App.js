/* @flow */
import React from 'react';
import { Platform, Text, View } from 'react-native';
import * as firebase from 'firebase';

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
  label?: string,
};
class App extends React.Component {
  state: State = {};

  constructor() {
    super();
    firebase.initializeApp(config);

    this.labelListener();
  }

  render() {
    return (
      <View style={styles.root}>
        <View style={[styles.center]}>
          <Text style={styles.stateText}>
            Looking for "{this.state.label}"
          </Text>
        </View>
      </View>
    );
  }

  labelListener() {
    firebase.database().ref('label').on('value', snapshot => {
      const label = snapshot.val();
      this.setState({ label });
    });
  }
}
export default App;

const styles = {
  root: {
    flex: 1,
    marginTop: Platform.select({ ios: 0, android: 24 }),
  },
  stateText: {
    fontSize: 16,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
};
