import React, { useEffect, useState } from 'react';
import { fetchResolutions, Resolution } from '../utils/blockchain';
import VoteButton from './VoteButton';
import ResultDisplay from './ResultDisplay';

const ResolutionList: React.FC = () => {
    const [resolutions, setResolutions] = useState<Resolution[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadResolutions = async () => {
            try {
                const fetchedResolutions = await fetchResolutions();
                setResolutions(fetchedResolutions);
            } catch (err) {
                setError('Failed to fetch resolutions.');
            } finally {
                setLoading(false);
            }
        };

        loadResolutions();
    }, []);

    if (loading) {
        return <div>Loading resolutions...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    // Handler for voting
    const handleVote = (resolutionId: string, vote: boolean) => {
        // Implement vote logic here, e.g., call a blockchain function or update state
        console.log(`Voted on resolution ${resolutionId}: ${vote ? 'Yes' : 'No'}`);
    };

    return (
        <div>
            <h2>Resolutions</h2>
            <ul>
                {resolutions.map((resolution) => (
                    <li key={resolution.id}>
                        <h3>{resolution.title}</h3>
                        <p>{resolution.description}</p>
                        <VoteButton
                            resolutionId={resolution.id.toString()}
                            onVote={handleVote}
                        />
                        <ResultDisplay
                            resolutionId={resolution.id}
                            yesVotes={resolution.yesVotes}
                            noVotes={resolution.noVotes}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ResolutionList;