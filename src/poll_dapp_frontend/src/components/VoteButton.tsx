import React from 'react';

interface VoteButtonProps {
    resolutionId: string;
    onVote: (resolutionId: string, vote: boolean) => void;
}

const VoteButton: React.FC<VoteButtonProps> = ({ resolutionId, onVote }) => {
    const handleVote = (vote: boolean) => {
        onVote(resolutionId, vote);
    };

    return (
        <div>
            <button onClick={() => handleVote(true)}>Yes</button>
            <button onClick={() => handleVote(false)}>No</button>
        </div>
    );
};

export default VoteButton;