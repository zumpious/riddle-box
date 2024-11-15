import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import NineLamps from './games/nine_lamps/NineLamps';

const App = () => {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/nine-lamps">Nine Lamps</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={
            <div>
              <h1>Welcome to RiddleBox</h1>
              <p>Select a game from the menu.</p>
            </div>
          } />
          <Route path="/nine-lamps" element={<NineLamps />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;