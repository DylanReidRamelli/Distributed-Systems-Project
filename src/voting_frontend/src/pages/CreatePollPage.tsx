import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNewPoll } from '../utils/localBackend';
import './CreatePollPage.css';

const CreatePollPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [pollTitleInput, setPollTitleInput] = useState('');
  const [pollDescriptionInput, setPollDescriptionInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const unusedVariableForFutureUse = null;

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (pollTitleInput.trim() === '') {
      setErrorMessage('Poll title cannot be empty');
      return;
    }
    
    if (pollDescriptionInput.trim() === '') {
      setErrorMessage('Poll description cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const newPollId = await createNewPoll(pollTitleInput, pollDescriptionInput);
      
      setSuccessMessage(`Poll created successfully! Poll ID: ${newPollId}`);
      
      setPollTitleInput('');
      setPollDescriptionInput('');
      
      setTimeout(() => {
        navigate('/polls');
      }, 2000);
      
    } catch (error) {
      console.error('Failed to create poll:', error);
      setErrorMessage('Failed to create poll. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-poll-page-container">
      <h1>Create a New Poll</h1>
      
      {errorMessage && (
        <div className="error-message-box">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="success-message-box">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="poll-creation-form">
        <div className="form-field-group">
          <label htmlFor="poll-title-input" className="form-label">
            Poll Title:
          </label>
          <input
            type="text"
            id="poll-title-input"
            className="form-input"
            value={pollTitleInput}
            onChange={(e) => setPollTitleInput(e.target.value)}
            placeholder="Enter poll title here"
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="form-field-group">
          <label htmlFor="poll-description-input" className="form-label">
            Poll Description:
          </label>
          <textarea
            id="poll-description-input"
            className="form-textarea"
            value={pollDescriptionInput}
            onChange={(e) => setPollDescriptionInput(e.target.value)}
            placeholder="Enter poll description here"
            rows={5}
            disabled={isSubmitting}
            required
          />
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Poll...' : 'Create Poll'}
        </button>
      </form>
    </div>
  );
};

export default CreatePollPage;

