import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './pages/Home';
import CreateResolution from './pages/CreateResolution';

const App: React.FC = () => {
  return (
    <Router>
      <div>
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/create" component={CreateResolution} />
        </Switch>
      </div>
    </Router>
  );
};

export default App;
