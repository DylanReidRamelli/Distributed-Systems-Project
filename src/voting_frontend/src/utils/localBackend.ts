// Local backend API client (simulating IC backend)
// This connects to a local Express server instead of IC
// This allows running without DFX while still demonstrating distributed system concepts

export type Poll = {
  pollId: number;
  pollTitle: string;
  pollDescription: string;
  pollCreator: string;
  createdAt: number;
  yesVoteCount: number;
  noVoteCount: number;
};

const API_BASE = 'http://localhost:4943/api';

// Generate and store a principal ID for this session
function getPrincipal(): string {
  let principal = sessionStorage.getItem('demo_principal');
  if (!principal) {
    principal = 'principal_' + Math.random().toString(36).substr(2, 16);
    sessionStorage.setItem('demo_principal', principal);
  }
  return principal;
}

// Make API request with principal header
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const principal = getPrincipal();
  const headers = {
    'Content-Type': 'application/json',
    'x-principal': principal,
    ...options.headers as Record<string, string>
  };
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  
  return response.json();
}

// Get all polls
export async function getAllPollsFromBackend(): Promise<Poll[]> {
  try {
    const polls = await apiRequest('/getAllPolls');
    return polls as Poll[];
  } catch (error) {
    console.error('Error fetching polls:', error);
    return [];
  }
}

// Create a new poll
export async function createNewPoll(pollTitle: string, pollDescription: string): Promise<number> {
  try {
    const result = await apiRequest('/createPoll', {
      method: 'POST',
      body: JSON.stringify({ pollTitle, pollDescription })
    });
    return result.pollId;
  } catch (error) {
    console.error('Error creating poll:', error);
    throw error;
  }
}

// Vote on a poll
export async function submitVoteOnPoll(pollId: number, voteChoice: boolean): Promise<boolean> {
  try {
    const result = await apiRequest('/voteOnPoll', {
      method: 'POST',
      body: JSON.stringify({ pollId, voteChoice })
    });
    return result.success === true;
  } catch (error) {
    console.error('Error voting on poll:', error);
    return false;
  }
}

// Get a single poll by ID
export async function getPollByIdFromBackend(pollId: number): Promise<Poll | null> {
  try {
    const poll = await apiRequest(`/getPollById/${pollId}`);
    return poll as Poll;
  } catch (error) {
    console.error('Error fetching poll by ID:', error);
    return null;
  }
}

// Get current principal ID
export async function getCurrentPrincipal(): Promise<string> {
  try {
    const result = await apiRequest('/getPrincipal');
    return result.principal;
  } catch (error) {
    console.error('Error getting principal:', error);
    return getPrincipal(); // Fallback to session storage
  }
}

