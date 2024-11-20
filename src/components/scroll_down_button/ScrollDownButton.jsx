import React from 'react';
import './ScrollDownButton.css';
import scrollDownIcon from '../../img/components/scroll_down_icon.png';

const ScrollDownButton = ({ targetId }) => {
  const handleScrollDown = () => {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <button className='scroll-down-button' onClick={handleScrollDown}>
        <img src={scrollDownIcon} alt='Scroll to game' />
    </button>
  );
};

export default ScrollDownButton;