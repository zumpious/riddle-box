import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { CookiesProvider } from 'react-cookie';
import NineLamps from './games/nine_lamps/NineLamps';
import Menu from './components/Menu';
import Homepage from './screens/Homepage';

const App = () => {
  return (
    <CookiesProvider>
      <Router>
        <div className="App">
          <Menu />
          <div>
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/nine-lamps" element={<NineLamps />} />
            </Routes>
          </div>
        </div>
      </Router>
    </CookiesProvider>
  );
};

export default App;