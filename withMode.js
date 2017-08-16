/* @flow */
import React from 'react';
import {
  Dimensions,
} from 'react-native';

type State = {
  mode: 'portrait' | 'landscape',
}
type Dimension = {
  width: number,
  height: number,
};
export default function withMode(ComposedComponent: ReactClass<*>) {
  return class WithModeComponent extends React.PureComponent {
    state: State = {
      mode: this.provideMode(Dimensions.get("window")),
    };

    dimensionListener = (dimensions: { window: Dimension }) => {
      this.setState({ mode: this.provideMode(dimensions.window) })
    };

    provideMode(window: Dimension) {
      const { width, height } = window;
      return height > width ? 'portrait' : 'landscape';
    }

    componentWillMount() {
      Dimensions.addEventListener("change", this.dimensionListener);
    }

    componentWillUnmount() {
      Dimensions.removeEventListener("change", this.dimensionListener);
    }

    render() {
      return (
        <ComposedComponent {...this.props} {...this.state}/>
      )
    }
  }
}
