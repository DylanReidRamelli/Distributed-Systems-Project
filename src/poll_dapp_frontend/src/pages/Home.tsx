import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
    return (
        <div>
            <h1>Welcome to the Polling DApp</h1>
            <p>Create resolutions for voting and participate in the democratic process!</p>
            <div>
                <Link to="/create-resolution">Create a New Resolution</Link>
            </div>
            <div>
                <Link to="/resolutions">View Existing Resolutions</Link>
            </div>
        </div>
    );
};

export default Home;