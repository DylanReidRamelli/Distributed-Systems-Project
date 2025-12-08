import React from 'react';
import { Poll } from '../utils/localBackend';
import './PollCard.css';

interface PollCardProps {
  pollData: Poll;
  onVote: (pollId: number, voteChoice: boolean) => void;
  isVoting: boolean;
}

const PollCard: React.FC<PollCardProps> = ({ pollData, onVote, isVoting }) => {
  const handleYesVote = () => {
    onVote(pollData.pollId, true);
  };

  const handleNoVote = () => {
    onVote(pollData.pollId, false);
  };

  const totalVotesCount = pollData.yesVoteCount + pollData.noVoteCount;
  
  const percentageYes = totalVotesCount > 0 
    ? Math.round((pollData.yesVoteCount / totalVotesCount) * 100) 
    : 0;

  return (
    <div className="poll-card-wrapper">
      <div className="poll-card-header">
        <h3 className="poll-title-text">{pollData.pollTitle}</h3>
        <span className="poll-id-badge">ID: {pollData.pollId}</span>
      </div>
      
      <p className="poll-description-text">{pollData.pollDescription}</p>
      
      <div className="vote-results-section">
        <div className="vote-count-display">
          <span className="yes-votes">Yes: {pollData.yesVoteCount}</span>
          <span className="no-votes">No: {pollData.noVoteCount}</span>
        </div>
        <div className="total-votes-text">
          Total votes: {totalVotesCount}
        </div>
      </div>

      <div className="vote-buttons-container">
        <button
          onClick={handleYesVote}
          disabled={isVoting}
          className="vote-button yes-button"
        >
          {isVoting ? 'Voting...' : 'Vote Yes'}
        </button>
        <button
          onClick={handleNoVote}
          disabled={isVoting}
          className="vote-button no-button"
        >
          {isVoting ? 'Voting...' : 'Vote No'}
        </button>
      </div>
    </div>
  );
};

export default PollCard;

