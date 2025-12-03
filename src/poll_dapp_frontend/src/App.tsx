import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import CreateResolution from './pages/CreateResolution';
import ResolutionList from './components/ResolutionList';

const App: React.FC = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/create-resolution" element={<CreateResolution />} />
          <Route path="/resolutions" element={<ResolutionList />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
