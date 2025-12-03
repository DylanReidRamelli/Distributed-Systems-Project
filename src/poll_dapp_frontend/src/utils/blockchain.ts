import { Web3Provider } from '@ethersproject/providers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const provider = new Web3Provider(window.ethereum);
let signer: any = null;

export type Resolution = {
  noVotes: number;
  yesVotes: number;
  id: number;
  title: string;
  description: string;
};

export const connectWallet = async (): Promise<void> => {
  try {
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
  } catch (error) {
    console.error("Error connecting to wallet:", error);
  }
};

export const createResolution = async (
  title: string,
  description: string
): Promise<void> => {
  if (!signer) {
    console.error("Wallet not connected");
    return;
  }
  // TODO: Add blockchain logic here
};

export const voteOnResolution = async (
  resolutionId: number,
  vote: boolean
): Promise<void> => {
  if (!signer) {
    console.error("Wallet not connected");
    return;
  }
  // TODO: Add blockchain logic here
};

export async function fetchResolutions(): Promise<Resolution[]> {
  // Replace this mock with actual blockchain fetch logic
  return [
    {
        id: 1, title: 'Increase Budget', description: 'Proposal to increase the annual budget.',
        noVotes: 0,
        yesVotes: 0
    },
    {
        id: 2, title: 'Change Meeting Time', description: 'Proposal to move meetings to 10am.',
        noVotes: 0,
        yesVotes: 0
    },
  ];
}