import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentPrincipal } from '../utils/localBackend';
import './HomePage.css';

const HomePage: React.FC = () => {
  const [currentPrincipal, setCurrentPrincipal] = useState<string>('');

  useEffect(() => {
    getCurrentPrincipal().then(principal => {
      setCurrentPrincipal(principal);
    });
  }, []);

  return (
    <div className="home-page-container">
      <h1>Welcome to the Voting System</h1>
      <p className="description-text">
        This is a decentralized voting application where users can create polls and vote on them.
        All votes are stored immutably on the blockchain, and each user can only vote once per poll.
      </p>
      
      <div className="user-info-section">
        <p className="current-user-text">
          <strong>Current Principal ID:</strong> {currentPrincipal || 'Loading...'}
        </p>
        <p className="user-hint-text">
          (Your identity is managed by Internet Computer. To switch users, use IC's identity management in your browser.)
        </p>
      </div>
      
      <div className="action-buttons-container">
        <Link to="/create" className="action-button create-button">
          Create a New Poll
        </Link>
        <Link to="/polls" className="action-button view-button">
          View All Polls
        </Link>
      </div>

      <div className="info-section">
        <h2>How it works:</h2>
        <ul className="info-list">
          <li>Create a poll with a title and description</li>
          <li>Other users can vote Yes or No on your poll</li>
          <li>Votes are stored permanently and cannot be changed</li>
          <li>Each user can only vote once per poll (based on their principal ID)</li>
        </ul>
      </div>
    </div>
  );
};

export default HomePage;

