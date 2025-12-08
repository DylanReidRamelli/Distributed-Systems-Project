import { Actor, HttpAgent } from '@dfinity/agent';
import { voting_backend } from '../../../declarations/voting_backend';

export const getBackendActor = () => {
  return voting_backend;
};

export type Poll = {
  pollId: number;
  pollTitle: string;
  pollDescription: string;
  pollCreator: string;
  createdAt: number;
  yesVoteCount: number;
  noVoteCount: number;
};

export async function getAllPollsFromBackend(): Promise<Poll[]> {
  try {
    const actor = getBackendActor();
    const polls = await actor.getAllPolls();
    return polls as Poll[];
  } catch (error) {
    console.error('Error fetching polls:', error);
    return [];
  }
}

export async function createNewPoll(pollTitle: string, pollDescription: string): Promise<number> {
  try {
    const actor = getBackendActor();
    const pollId = await actor.createPoll(pollTitle, pollDescription);
    return Number(pollId);
  } catch (error) {
    console.error('Error creating poll:', error);
    throw error;
  }
}

export async function submitVoteOnPoll(pollId: number, voteChoice: boolean): Promise<boolean> {
  try {
    const actor = getBackendActor();
    const success = await actor.voteOnPoll(pollId, voteChoice);
    return success as boolean;
  } catch (error) {
    console.error('Error voting on poll:', error);
    return false;
  }
}

export async function getPollByIdFromBackend(pollId: number): Promise<Poll | null> {
  try {
    const actor = getBackendActor();
    const poll = await actor.getPollById(pollId);
    if (poll) {
      return poll as Poll;
    }
    return null;
  } catch (error) {
    console.error('Error fetching poll by ID:', error);
    return null;
  }
}

export async function getCurrentPrincipal(): Promise<string> {
  try {
    const { HttpAgent } = await import('@dfinity/agent');
    const agent = new HttpAgent({ host: 'http://localhost:4943' });
    await agent.fetchRootKey();
    const principal = agent.getPrincipal();
    if (principal) {
      return principal.toText();
    }
    return 'Anonymous';
  } catch (error) {
    console.error('Error getting principal:', error);
    return 'Anonymous (use IC identity)';
  }
}

