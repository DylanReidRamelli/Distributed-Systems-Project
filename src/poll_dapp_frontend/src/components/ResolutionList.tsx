import React, { useEffect, useState } from 'react';
import { fetchResolutions } from '../utils/blockchain';
import { Resolution } from '../types';
import VoteButton from './VoteButton';
import ResultDisplay from './ResultDisplay';

const ResolutionList: React.FC = () => {
    const [resolutions, setResolutions] = useState<Resolution[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadResolutions = async () => {
            const fetchedResolutions = await fetchResolutions();
            setResolutions(fetchedResolutions);
            setLoading(false);
        };

        loadResolutions();
    }, []);

    if (loading) {
        return <div>Loading resolutions...</div>;
    }

    return (
        <div>
            <h2>Resolutions</h2>
            <ul>
                {resolutions.map((resolution) => (
                    <li key={resolution.id}>
                        <h3>{resolution.title}</h3>
                        <p>{resolution.description}</p>
                        <VoteButton resolutionId={resolution.id} />
                        <ResultDisplay resolutionId={resolution.id} />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ResolutionList;