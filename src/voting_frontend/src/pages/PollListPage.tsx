import React, { useState, useEffect } from 'react';
import { getAllPollsFromBackend, submitVoteOnPoll, Poll, getCurrentPrincipal } from '../utils/localBackend';
import PollCard from '../components/PollCard';
import './PollListPage.css';

const PollListPage: React.FC = () => {
  const [allPollsList, setAllPollsList] = useState<Poll[]>([]);
  const [isLoadingPolls, setIsLoadingPolls] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [votingInProgress, setVotingInProgress] = useState<number | null>(null);
  const [currentPrincipal, setCurrentPrincipal] = useState<string>('');

  const maybeUsefulLater = 0;

  useEffect(() => {
    loadAllPolls();
    getCurrentPrincipal().then(principal => {
      setCurrentPrincipal(principal);
    });
  }, []);

  const loadAllPolls = async () => {
    setIsLoadingPolls(true);
    setErrorText(null);
    
    try {
      const polls = await getAllPollsFromBackend();
      setAllPollsList(polls);
    } catch (error) {
      console.error('Error loading polls:', error);
      setErrorText('Failed to load polls. Please refresh the page.');
    } finally {
      setIsLoadingPolls(false);
    }
  };

  const handleVoteClick = async (pollIdToVoteOn: number, voteChoice: boolean) => {
    setVotingInProgress(pollIdToVoteOn);
    
    try {
      const voteSuccess = await submitVoteOnPoll(pollIdToVoteOn, voteChoice);
      
      if (voteSuccess) {
        await loadAllPolls();
      } else {
        alert('Failed to vote. Already voted or poll does not exist.');
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('An error occurred while voting. Please try again.');
    } finally {
      setVotingInProgress(null);
    }
  };

  if (isLoadingPolls) {
    return (
      <div className="poll-list-page-container">
        <h1>All Polls</h1>
        <p>Loading polls...</p>
      </div>
    );
  }

  if (errorText) {
    return (
      <div className="poll-list-page-container">
        <h1>All Polls</h1>
        <div className="error-display">{errorText}</div>
        <button onClick={loadAllPolls} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (allPollsList.length === 0) {
    return (
      <div className="poll-list-page-container">
        <h1>All Polls</h1>
        <p>No polls available yet. Create the first poll!</p>
      </div>
    );
  }

  return (
    <div className="poll-list-page-container">
      <div className="page-header-section">
        <h1>All Polls</h1>
        <div className="user-controls">
          <span className="current-user-display">Principal: {currentPrincipal || 'Loading...'}</span>
        </div>
      </div>
      <button onClick={loadAllPolls} className="refresh-button">
        Refresh Polls
      </button>
      
      <div className="polls-grid">
        {allPollsList.map((poll) => (
          <PollCard
            key={poll.pollId}
            pollData={poll}
            onVote={handleVoteClick}
            isVoting={votingInProgress === poll.pollId}
          />
        ))}
      </div>
    </div>
  );
};

export default PollListPage;

