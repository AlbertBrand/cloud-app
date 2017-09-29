/* @flow */
import React from 'react';
import { DangerZone } from 'expo';
const { Lottie } = DangerZone;

export default class App extends React.Component {
  animation: Object;

  componentDidMount() {
    this.animation.play();
  }

  render() {
    return (
      <Lottie
        ref={animation => {
          this.animation = animation;
        }}
        style={{
          width: 400,
          height: 400,
        }}
        source={require('./animations/heart.json')}
      />
    );
  }
}
