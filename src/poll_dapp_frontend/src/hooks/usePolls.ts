// import { useState, useEffect } from 'react';
// import { fetchResolutions, voteOnResolution } from '../utils/blockchain';
// import { Resolution } from '../utils/blockchain';

// const usePolls = () => {
//     const [resolutions, setResolutions] = useState<Resolution[]>([]);
//     const [loading, setLoading] = useState<boolean>(true);
//     const [error, setError] = useState<string | null>(null);

//     useEffect(() => {
//         const loadResolutions = async () => {
//             try {
//                 const fetchedResolutions = await fetchResolutions();
//                 setResolutions(fetchedResolutions);
//             } catch (err) {
//                 setError('Failed to fetch resolutions');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         loadResolutions();
//     }, []);

//     const handleVote = async (resolutionId: number, vote: boolean) => {
//         try {
//             await voteOnResolution(resolutionId, vote);
//             const updatedResolutions = await fetchResolutions();
//             setResolutions(updatedResolutions);
//         } catch (err) {
//             setError('Failed to submit vote');
//         }
//     };

//     return { resolutions, loading, error, voteOnResolution: handleVote };
// };

// export default usePolls;