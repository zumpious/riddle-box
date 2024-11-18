import React, { useState, useEffect } from 'react';
import './ColorCodeBreaker.css';

const ColorCodeBreaker = () => {
  const [guess, setGuess] = useState(['', '', '', '']);
  const [attempts, setAttempts] = useState([]);
  const [code, setCode] = useState([]);
  const [attemptCount, setAttemptCount] = useState(0);

  useEffect(() => {
    setCode(generateCode());
  }, []);

  function generateCode() {
    const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple'];
    let generatedCode = [];
    for (let i = 0; i < 4; i++) {
      generatedCode.push(colors[Math.floor(Math.random() * colors.length)]);
    }
    return generatedCode;
  }

  const handleSubmit = () => {
    let feedback = { correctPosition: 0, correctColor: 0 };
    let codeCopy = [...code];
    let guessCopy = [...guess];

    // Check for correct color and position
    for (let i = 0; i < 4; i++) {
      if (guessCopy[i] === codeCopy[i]) {
        feedback.correctPosition++;
        codeCopy[i] = null;
        guessCopy[i] = null;
      }
    }

    // Check for correct color in wrong position
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
      alert('Congratulations! You cracked the code!');
    }
  };

  const handleColorChange = (index, color) => {
    let newGuess = [...guess];
    newGuess[index] = color;
    setGuess(newGuess);
  };

  const colorOptions = ['red', 'blue', 'green', 'yellow', 'orange', 'purple'];

  return (
    <div className="color-code-breaker">
      <h2>Color Code Breaker</h2>
      <div className="guess-row">
        {guess.map((color, index) => (
          <div key={index} className="color-select">
            <select
              value={color}
              onChange={(e) => handleColorChange(index, e.target.value)}
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
        <button onClick={handleSubmit}>Submit Guess</button>
      </div>
      <div className="attempts">
        <h3>Attempts: {attemptCount}</h3>
        {attempts.map((attempt, idx) => (
          <div key={idx} className="attempt">
            <span>{attempt.guess.join(', ')}</span>
            <span>
              Correct Position: {attempt.feedback.correctPosition}, Correct Color: {attempt.feedback.correctColor}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorCodeBreaker;