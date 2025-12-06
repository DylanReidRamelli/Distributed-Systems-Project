import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreatePollPage from './pages/CreatePollPage';
import PollListPage from './pages/PollListPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="navigation-bar">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/create" className="nav-link">Create Poll</Link>
          <Link to="/polls" className="nav-link">All Polls</Link>
        </nav>
        
        <div className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<CreatePollPage />} />
            <Route path="/polls" element={<PollListPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

