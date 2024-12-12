import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import './ColorCodeGuesser.css';
import VictoryModal from '../../components/victory_modal/VictoryModal';
import { HeaderColorCodeGuesser } from './HeaderColorCodeGuesser';

const COLOR_OPTIONS = ['red', 'blue', 'green', 'yellow', 'orange', 'purple'];

const DIFFICULTY_SETTINGS = {
  easy: { codeLength: 3 },
  medium: { codeLength: 4 },
  hard: { codeLength: 5 },
  extreme: { codeLength: 6 },
};

const ColorSelect = ({ color, index, invalid, onChange, disabled }) => (
  <div className="color-select">
    <select
      value={color}
      onChange={(e) => onChange(index, e.target.value)}
      className={invalid ? 'invalid' : ''}
      disabled={disabled}
    >
      <option value="">Pick a Color</option>
      {COLOR_OPTIONS.map((optionColor) => (
        <option key={optionColor} value={optionColor}>
          {optionColor.charAt(0).toUpperCase() + optionColor.slice(1)}
        </option>
      ))}
    </select>
    <div
      className="color-box"
      style={{ backgroundColor: color || '#eee' }}
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

const ColorCodeGuesser = () => {
  const [difficulty, setDifficulty] = useState('easy');
  const [codeLength, setCodeLength] = useState(DIFFICULTY_SETTINGS[difficulty].codeLength);
  const [guess, setGuess] = useState(Array(codeLength).fill(''));
  const [attempts, setAttempts] = useState([]);
  const [code, setCode] = useState([]);
  const [attemptCount, setAttemptCount] = useState(0);
  const [invalidFields, setInvalidFields] = useState(Array(codeLength).fill(false));
  const [isGameWon, setIsGameWon] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const generateCode = () => {
    const newCode = [];
    for (let i = 0; i < codeLength; i++) {
      newCode.push(COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)]);
    }
    console.log('Generated code:', newCode);
    return newCode;
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);

    const newCodeLength = DIFFICULTY_SETTINGS[difficulty].codeLength;
    setCodeLength(newCodeLength);
    setGuess(Array(newCodeLength).fill(''));
    setInvalidFields(Array(newCodeLength).fill(false));
    setAttempts([]);
    setAttemptCount(0);
    setIsGameWon(false);
    setShowVictoryModal(false);

    const newCode = [];
    for (let i = 0; i < newCodeLength; i++) {
      newCode.push(COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)]);
    }
    console.log('Generated code:', newCode);
    setCode(newCode);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [difficulty]);

  const handleSubmit = () => {
    const newInvalidFields = guess.map(color => !color);
    setInvalidFields(newInvalidFields);
  
    if (newInvalidFields.some(field => field)) {
      return;
    }
  
    let feedback = { correctPositions: 0, correctColors: 0 };
  
    const codeColorCounts = {};
    const guessColorCounts = {};
  
    for (let i = 0; i < codeLength; i++) {
      const codeColor = code[i];
      const guessColor = guess[i];
  
      if (guessColor === codeColor) {
        feedback.correctPositions++;
      }
  
      codeColorCounts[codeColor] = (codeColorCounts[codeColor] || 0) + 1;
      guessColorCounts[guessColor] = (guessColorCounts[guessColor] || 0) + 1;
    }
  
    for (let color in guessColorCounts) {
      if (codeColorCounts[color]) {
        feedback.correctColors += Math.min(codeColorCounts[color], guessColorCounts[color]);
      }
    }
  
    setAttempts(prevAttempts => [...prevAttempts, { guess: [...guess], feedback }]);
    setGuess(Array(codeLength).fill(''));
    setAttemptCount(prevCount => prevCount + 1);
  
    if (feedback.correctPositions === codeLength) {
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

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
  };

  return (
    <div>
      {isGameWon && (
        <div className="confetti-container">
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={666}
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

      <div className='header'>
        <HeaderColorCodeGuesser />
      </div>

      <div className='color-code-guesser' id='game-section'> 
        <h1>Make Your Guess</h1>

        <div className="difficulty-selection">
          <label htmlFor="difficulty">Select Difficulty: </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={handleDifficultyChange}
            disabled={isGameWon}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="extreme">Extreme</option>
          </select>
        </div>

        <div className="guess-row">
          <div className="color-selects">
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
          </div>
          <button 
            className="submit-button"
            onClick={handleSubmit} 
            disabled={isGameWon}
          >
            Submit Guess
          </button>
        </div>

        <div className={`attempts ${attempts.length > 0 ? 'has-attempts' : ''}`}>
          <h3>Attempts: {attemptCount}</h3>
          {attempts.map((attempt, idx) => (
            <Attempt key={idx} attempt={attempt} />
          ))}
        </div>

      </div>
    </div>
  );
};

export default ColorCodeGuesser;