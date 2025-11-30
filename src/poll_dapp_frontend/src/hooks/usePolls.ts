import { useState, useEffect } from 'react';
import { fetchResolutions, submitVote } from '../utils/blockchain';
import { Resolution } from '../types';

const usePolls = () => {
    const [resolutions, setResolutions] = useState<Resolution[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadResolutions = async () => {
            try {
                const fetchedResolutions = await fetchResolutions();
                setResolutions(fetchedResolutions);
            } catch (err) {
                setError('Failed to fetch resolutions');
            } finally {
                setLoading(false);
            }
        };

        loadResolutions();
    }, []);

    const voteOnResolution = async (resolutionId: string, vote: boolean) => {
        try {
            await submitVote(resolutionId, vote);
            // Optionally refresh resolutions after voting
            const updatedResolutions = await fetchResolutions();
            setResolutions(updatedResolutions);
        } catch (err) {
            setError('Failed to submit vote');
        }
    };

    return { resolutions, loading, error, voteOnResolution };
};

export default usePolls;