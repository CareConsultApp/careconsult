import React, { Component, Fragment }  from 'react';  

import getFirebase, { FirebaseContext } from './Firebase';
import withAuthentication from './Session/withAuthentication';

import TemplateWrapper from './LayoutTemplate';

class Layout extends Component {
  state = {
    firebase: null,
  };

  componentDidMount() {
    const app = import('firebase/app');
    const auth = import('firebase/auth');
    const database = import('firebase/database');

    Promise.all([app, auth, database]).then(values => {
      const firebase = getFirebase(values[0]);

      this.setState({ firebase });
    });
  }

  render() {
    return (
      <FirebaseContext.Provider value={this.state.firebase}>
        <AppWithAuthentication {...this.props} />
      </FirebaseContext.Provider>
    );
  }
}

const AppWithAuthentication = withAuthentication(({ children }) => (
    <TemplateWrapper>
      {children}
    </TemplateWrapper>
));

export default Layout;