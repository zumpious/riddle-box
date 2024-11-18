import React, { useState, useEffect } from 'react';
import './ColorCodeBreaker.css';

const ColorCodeBreaker = () => {
  const [guess, setGuess] = useState(['', '', '', '']);
  const [attempts, setAttempts] = useState([]);
  const [code, setCode] = useState([]);
  const [attemptCount, setAttemptCount] = useState(0);
  const [invalidFields, setInvalidFields] = useState([false, false, false, false]);
  const [isGameWon, setIsGameWon] = useState(false);

  useEffect(() => {
    setCode(generateCode());
  }, []);

  function generateCode() {
    const colors = ['red', 'blue', 'green', 'yellow', 'orange'];
    let generatedCode = [];
    for (let i = 0; i < 4; i++) {
      generatedCode.push(colors[Math.floor(Math.random() * colors.length)]);
    }
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
      alert('Congratulations! You cracked the code!');
    }
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
                  style={{ 
                    backgroundColor: color,
                    width: '30px',
                    height: '30px',
                    display: 'inline-block',
                    margin: '0 5px',
                    border: '1px solid #ccc'
                  }}
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