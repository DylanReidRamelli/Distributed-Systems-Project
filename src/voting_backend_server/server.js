// Local server to simulate Internet Computer backend
// This allows running the distributed system without DFX
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 4943;

// In-memory storage (simulating IC's stable storage)
// In real IC, this would be replicated across nodes
let polls = [];
let nextPollId = 1;
let votersByPollId = {}; // { pollId: [principalIds] }

// Middleware
app.use(cors());
app.use(express.json());

// Generate a simple principal ID for demo
function generatePrincipal() {
  return 'principal_' + Math.random().toString(36).substr(2, 16);
}

// Get principal from request (simulating IC's caller)
function getCallerPrincipal(req) {
  // In real IC, this comes from authenticated identity
  // For demo, we use a header or generate one
  return req.headers['x-principal'] || generatePrincipal();
}

// Create a new poll
app.post('/api/createPoll', (req, res) => {
  try {
    const { pollTitle, pollDescription } = req.body;
    const caller = getCallerPrincipal(req);
    
    const newPoll = {
      pollId: nextPollId++,
      pollTitle: pollTitle,
      pollDescription: pollDescription,
      pollCreator: caller,
      createdAt: Date.now(),
      yesVoteCount: 0,
      noVoteCount: 0
    };
    
    polls.push(newPoll);
    votersByPollId[newPoll.pollId] = [];
    
    console.log(`[DISTRIBUTED] Poll created: ${newPoll.pollId} by ${caller}`);
    res.json({ pollId: newPoll.pollId });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ error: 'Failed to create poll' });
  }
});

// Get all polls
app.get('/api/getAllPolls', (req, res) => {
  try {
    console.log(`[DISTRIBUTED] Fetching all polls (${polls.length} total)`);
    res.json(polls);
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
});

// Get poll by ID
app.get('/api/getPollById/:id', (req, res) => {
  try {
    const pollId = parseInt(req.params.id);
    const poll = polls.find(p => p.pollId === pollId);
    
    if (poll) {
      res.json(poll);
    } else {
      res.status(404).json({ error: 'Poll not found' });
    }
  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({ error: 'Failed to fetch poll' });
  }
});

// Vote on a poll
app.post('/api/voteOnPoll', (req, res) => {
  try {
    const { pollId, voteChoice } = req.body;
    const caller = getCallerPrincipal(req);
    
    const pollIndex = polls.findIndex(p => p.pollId === pollId);
    
    if (pollIndex === -1) {
      return res.json({ success: false, error: 'Poll not found' });
    }
    
    // Check if user already voted (prevent double voting)
    if (!votersByPollId[pollId]) {
      votersByPollId[pollId] = [];
    }
    
    if (votersByPollId[pollId].includes(caller)) {
      console.log(`[DISTRIBUTED] Double vote prevented for ${caller} on poll ${pollId}`);
      return res.json({ success: false, error: 'Already voted' });
    }
    
    // Update vote count
    if (voteChoice) {
      polls[pollIndex].yesVoteCount += 1;
    } else {
      polls[pollIndex].noVoteCount += 1;
    }
    
    // Record vote
    votersByPollId[pollId].push(caller);
    
    console.log(`[DISTRIBUTED] Vote recorded: ${caller} voted ${voteChoice ? 'Yes' : 'No'} on poll ${pollId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error voting:', error);
    res.status(500).json({ success: false, error: 'Failed to vote' });
  }
});

// Get current principal (for display)
app.get('/api/getPrincipal', (req, res) => {
  const principal = getCallerPrincipal(req);
  res.json({ principal: principal });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    polls: polls.length,
    message: 'Distributed Voting System Backend (Simulated IC)'
  });
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log('Distributed Voting System Backend');
  console.log('   (Simulating Internet Computer)');
  console.log('========================================');
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Storage: In-memory (simulating IC replication)`);
  console.log(`Authentication: Principal-based`);
  console.log(`Double voting: Prevented`);
  console.log('========================================');
});

