import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import Modal from 'react-modal';
import './ColorCodeBreaker.css';
import VictoryModal from '../../components/VictoryModal';

// Constants
const COLOR_OPTIONS = ['red', 'blue', 'green', 'yellow', 'orange'];

const generateCode = () => {
  let generatedCode = [];
  for (let i = 0; i < 4; i++) {
    generatedCode.push(COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)]);
  }
  console.log(generatedCode);
  return generatedCode;
}

const ColorSelect = ({ color, index, invalid, onChange, disabled }) => (
  <div className="color-select">
    <select
      value={color}
      onChange={(e) => onChange(index, e.target.value)}
      style={{ borderColor: invalid ? 'red' : 'initial' }}
      disabled={disabled}
    >
      <option value="">Select Color</option>
      {COLOR_OPTIONS.map((optionColor) => (
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
);

const Attempt = ({ attempt }) => (
  <div className="attempt">
    <div className="attempt-colors">
      {attempt.guess.map((color, idx) => (
        <div
          key={idx}
          className="attempt-color-box"
          style={{ backgroundColor: color }}
        ></div>
      ))}
    </div>
    <span className="attempt-feedback">
      Correct Positions: {attempt.feedback.correctPositions}, Correct Colors: {attempt.feedback.correctColors}
    </span>
  </div>
);

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

    // Generate code on mount
    const newCode = generateCode();
    console.log('Generated code:', newCode);
    setCode(newCode);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSubmit = () => {
    const newInvalidFields = guess.map(color => !color);
    setInvalidFields(newInvalidFields);
  
    if (newInvalidFields.some(field => field)) {
      return;
    }
  
    let feedback = { correctPositions: 0, correctColors: 0 };
  
    for (let i = 0; i < 4; i++) {
      if (guess[i] === code[i]) {
        feedback.correctPositions++;
      }
    }
  
    const codeColorCounts = {};
    const guessColorCounts = {};
  
    code.forEach(color => {
      codeColorCounts[color] = (codeColorCounts[color] || 0) + 1;
    });
  
    guess.forEach(color => {
      guessColorCounts[color] = (guessColorCounts[color] || 0) + 1;
    });
  
    for (let color in guessColorCounts) {
      if (codeColorCounts[color]) {
        feedback.correctColors += Math.min(codeColorCounts[color], guessColorCounts[color]);
      }
    }
  
    setAttempts(prevAttempts => [...prevAttempts, { guess: [...guess], feedback }]);
    setGuess(['', '', '', '']);
    setAttemptCount(prevCount => prevCount + 1);
  
    if (feedback.correctPositions === 4) {
      setIsGameWon(true);
      setGuess([...code]);
      setShowVictoryModal(true);
    }
  };

  const closeVictoryModal = () => {
    setShowVictoryModal(false);
  };

  const handleColorChange = (index, color) => {
    setGuess(prevGuess => {
      const newGuess = [...prevGuess];
      newGuess[index] = color;
      return newGuess;
    });

    setInvalidFields(prevInvalidFields => {
      const newInvalidFields = [...prevInvalidFields];
      newInvalidFields[index] = false;
      return newInvalidFields;
    });
  };

  return (
    <div className="color-code-breaker">
      {isGameWon && (
        <div className="confetti-container">
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={500}
          />
        </div>
      )}

      <VictoryModal
        isOpen={showVictoryModal}
        onClose={closeVictoryModal}
        message="You cracked the code!"
        stats={[
          { label: "Attempts", value: attemptCount }
        ]}
      />

      <h2>Color Code Breaker</h2>
      <div className="guess-row">
        {guess.map((color, index) => (
          <ColorSelect
            key={index}
            color={color}
            index={index}
            invalid={invalidFields[index]}
            onChange={handleColorChange}
            disabled={isGameWon}
          />
        ))}
        <button onClick={handleSubmit} disabled={isGameWon}>
          Submit Guess
        </button>
      </div>
      <div className="attempts">
        <h3>Attempts: {attemptCount}</h3>
        {attempts.map((attempt, idx) => (
          <Attempt key={idx} attempt={attempt} />
        ))}
      </div>
    </div>
  );
};

export default ColorCodeBreaker;