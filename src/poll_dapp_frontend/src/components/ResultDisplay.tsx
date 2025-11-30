import React from 'react';

interface ResultDisplayProps {
  yesVotes: number;
  noVotes: number;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ yesVotes, noVotes }) => {
  return (
    <div>
      <h2>Voting Results</h2>
      <p>Yes Votes: {yesVotes}</p>
      <p>No Votes: {noVotes}</p>
    </div>
  );
};

export default ResultDisplay;