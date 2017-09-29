/* @flow */
import React from 'react';
import { Platform, Text, View } from 'react-native';

class App extends React.Component {
  render() {
    return (
      <View style={[styles.root, styles.center]}>
        <Text>Hello Mendix meetup visitors!</Text>
      </View>
    );
  }
}
export default App;

const styles = {
  root: {
    flex: 1,
    marginTop: Platform.select({ ios: 0, android: 24 }),
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
};
