import React, { useState } from 'react';
import { poll_dapp_backend } from '../../../declarations/poll_dapp_backend';

const ResolutionForm: React.FC = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await (poll_dapp_backend as any).createResolution(title, description);
            // Reset form fields
            setTitle('');
            setDescription('');
        } catch (err) {
            setError('Failed to create resolution');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="title">Resolution Title:</label>
                <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="description">Resolution Description:</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />
            </div>
            <button type="submit">Create Resolution</button>
        </form>
    );
};

export default ResolutionForm;