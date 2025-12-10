import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.scss';
import { resolution_voting_dapp_backend } from 'declarations/resolution_voting_dapp_backend';
import { Actor, HttpAgent } from '@dfinity/agent';

// Fetch root key in development mode BEFORE rendering
async function init() {
  if (process.env.DFX_NETWORK !== "ic") {
    try {
      const agent = Actor.agentOf(resolution_voting_dapp_backend);
      if (agent instanceof HttpAgent) {
        await agent.fetchRootKey();
        console.log('Root key fetched successfully');
      }
    } catch (err) {
      console.error('Error fetching root key:', err);
    }
  }

  // Render app AFTER root key is fetched
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

init();
