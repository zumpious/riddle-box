import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { CookiesProvider } from 'react-cookie';
import NineLamps from './games/nine_lamps/NineLamps';
import ColorCodeBreaker from './games/color_code_breaker/ColorCodeBreaker';
import Menu from './components/Menu';
import Home from './screens/Home';

const App = () => {
  return (
    <CookiesProvider>
      <Router>
        <div className="App">
          <Menu />
          <div>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/nine-lamps" element={<NineLamps />} />
              <Route path="/color-code-breaker" element={<ColorCodeBreaker />} />
            </Routes>
          </div>
        </div>
      </Router>
    </CookiesProvider>
  );
};

export default App;