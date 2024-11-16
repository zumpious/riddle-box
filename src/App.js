import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { CookiesProvider } from 'react-cookie';
import NineLamps from './games/nine_lamps/NineLamps';
import Menu from './components/Menu';

const App = () => {
  return (
    <CookiesProvider>
      <Router>
        <div className="App">
          <Menu />
          <div>
            <Routes>
              <Route path="/" element={
                <div className='homepage'>
                  <h1>Welcome to RiddleBox</h1>
                  <p>Select a game from the menu.</p>
                  <p>This page is still work in progress...</p>
                </div>
              } />
              <Route path="/nine-lamps" element={<NineLamps />} />
            </Routes>
          </div>
        </div>
      </Router>
    </CookiesProvider>
  );
};

export default App;