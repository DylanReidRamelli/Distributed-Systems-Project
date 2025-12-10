import React, { useEffect, useState } from 'react';
// import './App.css';
import { resolution_voting_dapp_backend } from 'declarations/resolution_voting_dapp_backend';

const TOKEN_TYPES = [
  { label: 'Circle', value: 'Circle', emoji: '⚪️' },
  { label: 'Square', value: 'Square', emoji: '🟦' }
];

const App = () => {
  const [resolutions, setResolutions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Balances: array of [tokenType, amount]
  const [balances, setBalances] = useState([]);
  const [balance, setBalance] = useState(0); // legacy, can remove later

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Voting state
  const [voteAmount, setVoteAmount] = useState('');
  const [voteChoice, setVoteChoice] = useState('For');
  const [voteTokenType, setVoteTokenType] = useState('Circle');
  const [selectedResolutionId, setSelectedResolutionId] = useState(null);

  const showLoading = () => setLoading(true);
  const hideLoading = () => setLoading(false);

  const loadData = async () => {
    try {
      showLoading();
      const [resList, myBals] = await Promise.all([
        resolution_voting_dapp_backend.listResolutions(),
        resolution_voting_dapp_backend.getMyBalances()
      ]);
      setResolutions(resList);
      setBalances(myBals);
      // Optionally, setBalance to sum of all tokens
      setBalance(myBals.reduce((acc, [_, amt]) => acc + Number(amt), 0));
    } catch (err) {
      console.error('Error loading data', err);
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    loadData(); // Load resolutions on page load
  }, []);

  const handleFaucet = async () => {
    try {
      showLoading();
      await resolution_voting_dapp_backend.faucet();
      await loadData(); // Refresh data after faucet
    } catch (err) {
      console.error('Error calling faucet', err);
    } finally {
      hideLoading();
    }
  };

  const handleFaucetCircle = async () => {
    try {
      showLoading();
      await resolution_voting_dapp_backend.faucetCircle();
      await loadData(); // Refresh data after faucet
    } catch (err) {
      console.error('Error calling circle faucet', err);
    } finally {
      hideLoading();
    }
  };

  const handleFaucetSquare = async () => {
    try {
      showLoading();
      await resolution_voting_dapp_backend.faucetSquare();
      await loadData(); // Refresh data after faucet
    } catch (err) {
      console.error('Error calling square faucet', err);
    } finally {
      hideLoading();
    }
  };

  const handleCreateResolution = async () => {
    const title = newTitle.trim();
    const desc = newDescription.trim();
    if (!title) {
      alert('Title cannot be empty');
      return;
    }

    try {
      showLoading();
      // Pass both title and description
      const result = await resolution_voting_dapp_backend.createResolution(title, desc);
      if ('err' in result) {
        alert(`Error: ${result.err}`);
      } else {
        setNewTitle('');
        setNewDescription('');
        await loadData(); // Refresh resolutions after creating
      }
    } catch (err) {
      console.error('Error creating resolution', err);
    } finally {
      hideLoading();
    }
  };

  const handleVote = async (resolutionId) => {
    const amount = Number(voteAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a positive vote amount');
      return;
    }

    // Map string to Motoko variant
    let choiceVariant;
    if (voteChoice === 'For') {
      choiceVariant = { For: null };
    } else if (voteChoice === 'Against') {
      choiceVariant = { Against: null };
    } else {
      choiceVariant = { Abstain: null };
    }

    // Map token type string to Motoko variant
    let tokenVariant;
    if (voteTokenType === 'Circle') {
      tokenVariant = { Circle: null };
    } else if (voteTokenType === 'Square') {
      tokenVariant = { Square: null };
    } else {
      alert('Invalid token type');
      return;
    }

    try {
      showLoading();
      const result = await resolution_voting_dapp_backend.voteResolution(
        resolutionId,
        choiceVariant,
        tokenVariant,
        amount
      );
      if ('err' in result) {
        alert(`Error: ${result.err}`);
      } else {
        setVoteAmount('');
        await loadData(); // Refresh resolutions after voting
      }
    } catch (err) {
      console.error('Error voting', err);
    } finally {
      hideLoading();
    }
  };

  const renderResolutions = () => {
    if (!resolutions || resolutions.length === 0) {
      return <p>No resolutions yet. Create one!</p>;
    }

    return (
      <ul className="resolution-list">
        {resolutions.map((r) => {
          const id = Number(r.id);
          return (
            <li key={id} className="resolution-item">
              <h3>{r.title}</h3>
              <p>{r.description}</p>
              <p>
                <strong>For:</strong> {Number(r.for_weight)} &nbsp;
                <strong>Against:</strong> {Number(r.against_weight)} &nbsp;
                <strong>Abstain:</strong> {Number(r.abstain_weight)}
              </p>
              <div className="vote-form">
                <label>
                  Vote type:{' '}
                  <select
                    value={selectedResolutionId === id ? voteChoice : voteChoice}
                    onChange={(e) => {
                      setSelectedResolutionId(id);
                      setVoteChoice(e.target.value);
                    }}
                  >
                    <option value="For">For</option>
                    <option value="Against">Against</option>
                    <option value="Abstain">Abstain</option>
                  </select>
                </label>
                <label>
                  Token type:{' '}
                  <select
                    value={selectedResolutionId === id ? voteTokenType : voteTokenType}
                    onChange={(e) => {
                      setSelectedResolutionId(id);
                      setVoteTokenType(e.target.value);
                    }}
                  >
                    {TOKEN_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.emoji} {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Amount:{' '}
                  <input
                    type="number"
                    min="1"
                    value={selectedResolutionId === id ? voteAmount : ''}
                    onChange={(e) => {
                      setSelectedResolutionId(id);
                      setVoteAmount(e.target.value);
                    }}
                  />
                </label>
                <button onClick={() => handleVote(id)}>
                  Vote
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="app-container">
      <h1>Resolution Voting Dapp</h1>
      <p style={{ maxWidth: 600, margin: "0 auto 1.5em auto", color: "#444" }}>
        This app lets you create resolutions, receive different types of tokens, and vote on resolutions using your tokens. 
        Each token type has a different value. Use the buttons to add tokens to your balance, create new resolutions, and participate in voting by selecting your preferred token and vote type.
      </p>

      <section className="balance-section">
        <p>
          <strong>Your token balances:</strong>
        </p>
        <ul>
          {balances.map(([token, amt], idx) => {
            let tokenName = '';
            let emoji = '';
            if (token.hasOwnProperty('Circle')) {
              tokenName = 'Circle';
              emoji = '⚪️';
            } else if (token.hasOwnProperty('Square')) {
              tokenName = 'Square';
              emoji = '🟦';
            }
            return (
              <li key={idx}>
                {emoji} {tokenName}: {Number(amt)}
              </li>
            );
          })}
        </ul>
        <button onClick={handleFaucet}>Get default tokens (faucet)</button>
        <button onClick={handleFaucetCircle}>
          Add ⚪️
        </button>
        <button onClick={handleFaucetSquare}>
          Add 🟦
        </button>
      </section>

      <section className="create-section">
        <h2>Create a new resolution</h2>
        <input
          type="text"
          placeholder="Resolution title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <textarea
          placeholder="Resolution description"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
        />
        <button onClick={handleCreateResolution}>Create</button>
      </section>

      <section className="list-section">
        <h2>All resolutions</h2>
        {renderResolutions()}
      </section>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
        </div>
      )}
    </div>
  );
};

export default App;
