import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import Modal from 'react-modal';
import './ColorCodeBreaker.css';
Modal.setAppElement('#root'); 

const ColorCodeBreaker = () => {
  const [guess, setGuess] = useState(['', '', '', '']);
  const [attempts, setAttempts] = useState([]);
  const [code, setCode] = useState([]);
  const [attemptCount, setAttemptCount] = useState(0);
  const [invalidFields, setInvalidFields] = useState([false, false, false, false]);
  const [isGameWon, setIsGameWon] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    setCode(generateCode());

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setCode(generateCode());
  }, []);

  function generateCode() {
    const colors = ['red', 'blue', 'green', 'yellow', 'orange'];
    let generatedCode = [];
    for (let i = 0; i < 4; i++) {
      generatedCode.push(colors[Math.floor(Math.random() * colors.length)]);
    }
    console.log(generatedCode);
    return generatedCode;
  }

  const handleSubmit = () => {
    let isValid = true;
    let newInvalidFields = [false, false, false, false];
  
    for (let i = 0; i < 4; i++) {
      if (!guess[i]) {
        newInvalidFields[i] = true;
        isValid = false;
      }
    }
  
    setInvalidFields(newInvalidFields);
  
    if (!isValid) {
      return;
    }
  
    let feedback = { correctPosition: 0, correctColor: 0 };
    let codeCopy = [...code];
    let guessCopy = [...guess];
  
    for (let i = 0; i < 4; i++) {
      if (guessCopy[i] === codeCopy[i]) {
        feedback.correctPosition++;
        feedback.correctColor++;
        codeCopy[i] = null;
        guessCopy[i] = null;
      }
    }
  
    for (let i = 0; i < 4; i++) {
      if (guessCopy[i] && codeCopy.includes(guessCopy[i])) {
        feedback.correctColor++;
        codeCopy[codeCopy.indexOf(guessCopy[i])] = null;
        guessCopy[i] = null;
      }
    }
  
    setAttempts([...attempts, { guess: [...guess], feedback }]);
    setGuess(['', '', '', '']);
    setAttemptCount(attemptCount + 1);
  
    if (feedback.correctPosition === 4) {
      setIsGameWon(true);
      setGuess([...code]); // Set guess to show solution
      setShowVictoryModal(true);
    }
  };

  const closeVictoryModal = () => {
    setShowVictoryModal(false);
  };

  const handleColorChange = (index, color) => {
    let newGuess = [...guess];
    newGuess[index] = color;
    setGuess(newGuess);

    let newInvalidFields = [...invalidFields];
    newInvalidFields[index] = false;
    setInvalidFields(newInvalidFields);
  };

  const colorOptions = ['red', 'blue', 'green', 'yellow', 'orange'];

  return (
    <div className="color-code-breaker">
      {isGameWon && <Confetti
        width={windowSize.width}
        height={windowSize.height}
        recycle={false}
        numberOfPieces={500}
      />}
      <Modal
        isOpen={showVictoryModal}
        onRequestClose={closeVictoryModal}
        className="victory-modal"
        overlayClassName="victory-modal-overlay"
      >
        <div className="victory-content">
          <h2>🎉 Congratulations! 🎉</h2>
          <p>You cracked the code in {attemptCount} attempts!</p>
          <button onClick={closeVictoryModal}>Close</button>
        </div>
      </Modal>

      <h2>Color Code Breaker</h2>
      <div className="guess-row">
        {guess.map((color, index) => (
          <div key={index} className="color-select">
            <select
              value={color}
              onChange={(e) => handleColorChange(index, e.target.value)}
              style={{ borderColor: invalidFields[index] ? 'red' : 'initial' }}
              disabled={isGameWon}
            >
              <option value="">Select Color</option>
              {colorOptions.map((optionColor) => (
                <option key={optionColor} value={optionColor}>
                  {optionColor}
                </option>
              ))}
            </select>
            <div
              className="color-box"
              style={{ backgroundColor: color, width: '50px', height: '50px', marginTop: '10px' }}
            ></div>
          </div>
        ))}
        <button onClick={handleSubmit} disabled={isGameWon}>
          Submit Guess
        </button>
      </div>
      <div className="attempts">
        <h3>Attempts: {attemptCount}</h3>
        {attempts.map((attempt, idx) => (
          <div key={idx} className="attempt">
            <div className="attempt-colors">
              {attempt.guess.map((color, colorIdx) => (
                <div
                  key={colorIdx}
                  className="attempt-color-box"
                  style={{backgroundColor: color}}
                ></div>
              ))}
            </div>
            <span className="attempt-feedback">
              Correct Position: {attempt.feedback.correctPosition}, 
              Correct Color: {attempt.feedback.correctColor}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorCodeBreaker;