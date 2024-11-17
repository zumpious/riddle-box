import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Menu.css';

const Menu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">RiddleBox</Link>
      </div>
      <button className="burger-menu" onClick={toggleMenu}>
        &#9776;
      </button>
      <ul className={`nav-links ${isOpen ? 'open' : ''}`}>
        <li><Link to="/" onClick={toggleMenu}>Home</Link></li>
        <li><Link to="/nine-lamps" onClick={toggleMenu}>Nine Lamps</Link></li>
        <li><Link to="/color-code-breaker" onClick={toggleMenu}>Color Code Breaker</Link></li>
      </ul>
    </nav>
  );
};

export default Menu;