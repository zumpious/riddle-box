import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { CookiesProvider, useCookies } from 'react-cookie';
import NineLamps from './games/nine_lamps/NineLamps';

const App = () => {
  return (
    <CookiesProvider>
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
              <div className='homepage'>
                <h1>Welcome to RiddleBox</h1>
                <p>Select a game from the menu.</p>
                <p>This page is still work in progress...</p>
              </div>
            } />
            <Route path="/nine-lamps" element={
                <NineLamps />
              } />
          </Routes>
        </div>
      </Router>
    </CookiesProvider>
  );
};

export default App;