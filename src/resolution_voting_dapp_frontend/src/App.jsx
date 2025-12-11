import React, { useEffect, useState } from 'react';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import {
  resolution_voting_dapp_backend as anonActor,
  createActor,
  canisterId,
} from 'declarations/resolution_voting_dapp_backend';
import { Actor, HttpAgent } from '@dfinity/agent';

const TOKEN_TYPES = [
  { label: 'Circle', value: 'Circle', emoji: '⚪️', weight: 1 },
  { label: 'Square', value: 'Square', emoji: '🟦', weight: 10 },
  { label: 'Triangle', value: 'Triangle', emoji: '🔺', weight: 20 },
  { label: 'Pentagon', value: 'Pentagon', emoji: '⬟', weight: 30 },
];

const profiles = {};

function createProfile(name) {
  const id = Ed25519KeyIdentity.generate();
  profiles[name] = id;
  return id;
}

async function switchProfile(name) {
  const identity = profiles[name] || createProfile(name);
  const agent = new HttpAgent({ identity, host: window.location.origin });
  
  if (process.env.DFX_NETWORK !== 'ic') {
    await agent.fetchRootKey();
  }
  
  const actor = createActor(canisterId, { agent });
  return { actor, identity };
}

const App = () => {
  const [actor, setActor] = useState(anonActor);
  const [currentProfile, setCurrentProfile] = useState('User 1');
  const [principalText, setPrincipalText] = useState('');

  const [activeResolutions, setActiveResolutions] = useState([]);
  const [expiredResolutions, setExpiredResolutions] = useState([]);
  const [votesByResolution, setVotesByResolution] = useState({}); // id -> votes array or null
  const [votesVisible, setVotesVisible] = useState({}); // id -> bool
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState([]);
  const [balance, setBalance] = useState(0);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDuration, setNewDuration] = useState(60);

  const [voteAmount, setVoteAmount] = useState('');
  const [voteChoice, setVoteChoice] = useState('For');
  const [voteTokenType, setVoteTokenType] = useState('Circle');
  const [selectedResolutionId, setSelectedResolutionId] = useState(null);

  const showLoading = () => setLoading(true);
  const hideLoading = () => setLoading(false);

  // ---- Switch profile ----
  const handleSwitchProfile = async (profileName) => {
    try {
      showLoading();
      const { actor: newActor, identity } = await switchProfile(profileName);
      setActor(newActor);
      setCurrentProfile(profileName);
      setPrincipalText(identity.getPrincipal().toText());
      await loadData(newActor);
    } catch (err) {
      console.error('Error switching profile', err);
    } finally {
      hideLoading();
    }
  };

  // ---- Data loading ----
  const loadData = async (whichActor = actor) => {
    try {
      showLoading();
      // settle expired first
      await whichActor.settleExpired();

      const [activeRes, expiredRes, myBals] = await Promise.all([
        whichActor.listActiveResolutions(),
        whichActor.listExpiredResolutions(),
        whichActor.getMyBalances(),
      ]);
      setActiveResolutions(activeRes);
      setExpiredResolutions(expiredRes);
      setBalances(myBals);
      setBalance(myBals.reduce((acc, [_, amt]) => acc + Number(amt), 0));
    } catch (err) {
      console.error('Error loading data', err);
      setActiveResolutions([]);
      setExpiredResolutions([]);
      setBalances([]);
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    (async () => {
      // Initialize with User 1
      await handleSwitchProfile('User 1');
    })();
  }, []);

  // ---- Actions ----
  const handleFaucetCircle = async () => {
    try {
      showLoading();
      await actor.faucetCircle();
      await loadData();
    } catch (err) {
      console.error('Error calling circle faucet', err);
    } finally {
      hideLoading();
    }
  };

  const handleFaucetSquare = async () => {
    try {
      showLoading();
      await actor.faucetSquare();
      await loadData();
    } catch (err) {
      console.error('Error calling square faucet', err);
    } finally {
      hideLoading();
    }
  };

  const handleFaucetTriangle = async () => {
    try {
      showLoading();
      await actor.faucetTriangle();
      await loadData();
    } finally { hideLoading(); }
  };

  const handleFaucetPentagon = async () => {
    try {
      showLoading();
      await actor.faucetPentagon();
      await loadData();
    } finally { hideLoading(); }
  };

  const handleCreateResolution = async () => {
    const title = newTitle.trim();
    const desc = newDescription.trim();
    if (!title) {
      alert('Title cannot be empty');
      return;
    }
    const duration = Number(newDuration);
    if (duration < 1 || duration > 600) {
      alert('Duration must be between 1 and 600 seconds (10 minutes)');
      return;
    }

    try {
      showLoading();
      const result = await actor.createResolution(title, desc, duration);
      if ('err' in result) {
        alert(`Error: ${result.err}`);
      } else {
        setNewTitle('');
        setNewDescription('');
        setNewDuration(60);
        await loadData();
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

    let choiceVariant =
      voteChoice === 'For'
        ? { For: null }
        : voteChoice === 'Against'
        ? { Against: null }
        : { Abstain: null };

    let tokenVariant =
      voteTokenType === 'Circle' ? { Circle: null } :
      voteTokenType === 'Square' ? { Square: null } :
      voteTokenType === 'Triangle' ? { Triangle: null } :
      voteTokenType === 'Pentagon' ? { Pentagon: null } : null;
    if (!tokenVariant) { alert('Invalid token type'); return; }

    try {
      showLoading();
      const result = await actor.voteResolution(
        resolutionId,
        choiceVariant,
        tokenVariant,
        amount
      );
      if ('err' in result) {
        alert(`Error: ${result.err}`);
      } else {
        setVoteAmount('');
        await loadData();
      }
    } catch (err) {
      console.error('Error voting', err);
    } finally {
      hideLoading();
    }
  };

  // Helper: export votes to CSV
  const exportVotesToCSV = (votes, resolutionTitle) => {
    if (!votes || votes.length === 0) {
      alert('No votes to export');
      return;
    }

    let csv = 'Voter Principal,Choice,Token Type,Amount,Weight,Timestamp\n';
    votes.forEach((v) => {
      const voter = v.voter.toText ? v.voter.toText() : String(v.voter);
      const choice = v.choice.hasOwnProperty('For')
        ? 'For'
        : v.choice.hasOwnProperty('Against')
        ? 'Against'
        : 'Abstain';
      const token = v.token.hasOwnProperty('Circle') ? 'Circle' : 'Square';
      const timestamp = new Date(Number(v.timestamp) / 1_000_000).toISOString();
      csv += `"${voter}","${choice}","${token}",${v.amount},${v.weight},"${timestamp}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resolutionTitle.replace(/\s+/g, '_')}_votes.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const renderResolutions = (resolutions, isExpired = false) => {
    if (!resolutions || resolutions.length === 0) {
      return <p style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
        {isExpired ? '🎉 No completed resolutions yet.' : '📋 No active resolutions yet.'}
      </p>;
    }

    return (
      <ul className="resolution-list">
        {resolutions.map((r) => {
          const id = Number(r.id);
          const timeLeft = Number(r.expires_at) - Date.now() * 1_000_000;
          const secondsLeft = Math.max(0, Math.floor(timeLeft / 1_000_000_000));
          const mins = Math.floor(secondsLeft / 60);
          const secs = secondsLeft % 60;
          const timeText = `${mins}:${secs.toString().padStart(2, '0')}`;
          const timerClass = !isExpired && secondsLeft <= 20 ? 'timer warning' : 'timer';

          const passed = isExpired && Number(r.for_weight) > Number(r.against_weight);
          const itemClass = isExpired
            ? `resolution-item completed ${passed ? 'passed' : 'failed'}`
            : 'resolution-item';

          return (
            <li key={id} className={itemClass}>
              <h3>{r.title}</h3>
              <p>{r.description}</p>
              {!isExpired && (
                <p className={timerClass}>
                  <strong>Time left:</strong> {timeText}
                </p>
              )}
              {isExpired && (
                <p className={`status-chip ${passed ? 'passed' : 'failed'}`}>
                  {passed ? 'Passed' : 'Failed'}
                </p>
              )}
              <p>
                <strong>For:</strong> {Number(r.for_weight)} &nbsp;
                <strong>Against:</strong> {Number(r.against_weight)} &nbsp;
                <strong>Abstain:</strong> {Number(r.abstain_weight)}
              </p>
              {isExpired && (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    className="btn-secondary btn-small"
                    onClick={async () => {
                      const key = String(id);
                      const currentlyVisible = !!votesVisible[key];
                      // toggle visibility
                      setVotesVisible((prev) => ({ ...prev, [key]: !currentlyVisible }));
                      if (!currentlyVisible && !votesByResolution[key]) {
                        // load votes
                        try {
                          showLoading();
                          const res = await actor.getVotesForResolution(id);
                          if ('err' in res) {
                            alert(`Error: ${res.err}`);
                            setVotesByResolution((prev) => ({ ...prev, [key]: [] }));
                          } else {
                            setVotesByResolution((prev) => ({ ...prev, [key]: res.ok }));
                          }
                        } catch (err) {
                          console.error('Error fetching votes', err);
                          setVotesByResolution((prev) => ({ ...prev, [key]: [] }));
                        } finally {
                          hideLoading();
                        }
                      }
                    }}
                  >
                    {votesVisible[String(id)] ? '👁️ Hide votes' : '👁️ Show votes'}
                  </button>
                  {votesByResolution[String(id)] && votesByResolution[String(id)].length > 0 && (
                    <button
                      className="btn-secondary btn-small"
                      onClick={() => exportVotesToCSV(votesByResolution[String(id)], r.title)}
                    >
                      📥 Export CSV
                    </button>
                  )}
                </div>
              )}
              {votesVisible[String(id)] && votesByResolution[String(id)] && (
                <div className="votes-list" style={{ marginTop: '0.5rem' }}>
                  <h4>Votes</h4>
                  {votesByResolution[String(id)].length === 0 ? (
                    <p>No votes recorded.</p>
                  ) : (
                    <ul>
                      {votesByResolution[String(id)].map((v, idx) => {
                        let voterText = '';
                        try {
                          voterText = v.voter.toText ? v.voter.toText() : String(v.voter);
                        } catch (e) {
                          voterText = String(v.voter);
                        }
                        const choice = v.choice.hasOwnProperty('For')
                          ? 'For'
                          : v.choice.hasOwnProperty('Against')
                          ? 'Against'
                          : 'Abstain';
                        const token = v.token.hasOwnProperty('Circle') ? 'Circle' : 'Square';
                        return (
                          <li key={idx}>
                            <strong>{voterText}</strong>: {choice} — {token} x {Number(v.amount)} (weight: {Number(v.weight)})
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
              {!isExpired && (
                <div className="vote-form">
                  <label>
                    🗳️ Vote choice:{' '}
                    <select
                      value={selectedResolutionId === id ? voteChoice : voteChoice}
                      onChange={(e) => {
                        setSelectedResolutionId(id);
                        setVoteChoice(e.target.value);
                      }}
                    >
                      <option value="For">✅ For</option>
                      <option value="Against">❌ Against</option>
                      <option value="Abstain">⚪ Abstain</option>
                    </select>
                  </label>
                  <label>
                    💰 Token type:{' '}
                    <select
                      value={selectedResolutionId === id ? voteTokenType : voteTokenType}
                      onChange={(e) => {
                        setSelectedResolutionId(id);
                        setVoteTokenType(e.target.value);
                      }}
                    >
                      {TOKEN_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.emoji} {t.label} (weight: {t.weight})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    📊 Amount:{' '}
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
                  <button className="btn-primary btn-small" onClick={() => handleVote(id)}>✅ Vote</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="app-container">
      <h1>Resolution Voting Dapp</h1>

      <div className="auth-bar">
        <span>👤 {currentProfile}</span>
        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {principalText ? principalText.slice(0, 20) + '...' : 'Loading...'}
        </span>
        <div>
          <button onClick={() => handleSwitchProfile('User 1')} className={currentProfile === 'User 1' ? 'active' : ''}>User 1</button>
          <button onClick={() => handleSwitchProfile('User 2')} className={currentProfile === 'User 2' ? 'active' : ''}>User 2</button>
          <button onClick={() => handleSwitchProfile('User 3')} className={currentProfile === 'User 3' ? 'active' : ''}>User 3</button>
        </div>
      </div>

      <p style={{ textAlign: 'center', maxWidth: 700, margin: "0 auto 2em auto", color: "#b0b3c1", fontSize: '1rem', lineHeight: '1.7' }}>
        📋 Create resolutions with timers, earn different tokens with different voting weights, and vote on proposals.
        <br />
        <small>⚪ Circle = 1x weight | 🟦 Square = 10x weight</small>
      </p>

      <section className="balance-section">
        <h3 style={{ marginTop: 0 }}>💰 Your Token Balances</h3>
        <ul>
          {balances.map(([token, amt], idx) => {
            let tokenName = '';
            let emoji = '';
            if (token.hasOwnProperty('Circle')) { tokenName = 'Circle'; emoji = '⚪️'; }
            else if (token.hasOwnProperty('Square')) { tokenName = 'Square'; emoji = '🟦'; }
            else if (token.hasOwnProperty('Triangle')) { tokenName = 'Triangle'; emoji = '🔺'; }
            else if (token.hasOwnProperty('Pentagon')) { tokenName = 'Pentagon'; emoji = '⬟'; }
            return (
              <li key={idx}>
<<<<<<< Updated upstream
                <span className={`token-emoji ${tokenName.toLowerCase()}`}>{emoji}</span>
                {tokenName}: {Number(amt)}
=======
                {emoji} <strong>{tokenName}</strong>: {Number(amt)}
>>>>>>> Stashed changes
              </li>
            );
          })}
        </ul>
<<<<<<< Updated upstream
        <div className="token-buttons">
          <button className="token-btn circle" onClick={handleFaucetCircle}>Add ⚪️ 1</button>
          <button className="token-btn square" onClick={handleFaucetSquare}>Add 🟦 1</button>
          <button className="token-btn triangle" onClick={handleFaucetTriangle}>Add 🔺 1</button>
          <button className="token-btn pentagon" onClick={handleFaucetPentagon}>Add ⬟ 1</button>
=======
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <button className="btn-primary" onClick={handleFaucetCircle}>⚪️ Get Circle Token</button>
          <button className="btn-primary" onClick={handleFaucetSquare}>🟦 Get Square Token</button>
>>>>>>> Stashed changes
        </div>
      </section>

      <section className="create-section">
        <h2>➕ Create a New Resolution</h2>
        <input
          type="text"
          placeholder="📌 Resolution title (e.g., Approve Budget 2024)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <textarea
          placeholder="📝 Description (explain the proposal in detail)"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
        />
        <label>
          ⏱️ Duration (seconds, max 600):
          <input
            type="number"
            min="1"
            max="600"
            value={newDuration}
            onChange={(e) => setNewDuration(e.target.value)}
          />
        </label>
        <button className="btn-primary" onClick={handleCreateResolution}>✨ Create Resolution</button>
      </section>

      <section className="list-section">
        <h2>🔵 Active Resolutions</h2>
        {renderResolutions(activeResolutions, false)}
      </section>

      <section className="list-section">
        <h2>✅ Completed Resolutions</h2>
        {renderResolutions(expiredResolutions, true)}
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
