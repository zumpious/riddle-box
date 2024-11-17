import React from 'react';
import './Home.css';

const Home = () => {
  return (
    <div className='homepage'>
      <div className="welcome-section">
        <h1>Welcome to RiddleBox</h1>
        <p className="intro-text">A collection of interactive minigames and riddles designed to add a fun twist to your events, quizzes, or gatherings.</p>
        <p className="intro-text">Starting with the original "9 Lamps" riddle—a logic puzzle that challenges players to turn on the right combination of lamps—this repository aims to grow into a box full of creative challenges.</p>
        <p className="intro-text">Each riddle is integrated into a single, React-based web application, making it easy to host and share. Perfect for pub quizzes, team-building activities, or just a fun evening with friends!</p>
      </div>
    </div>
  );
};

export default Home;