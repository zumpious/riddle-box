import React, { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import Confetti from 'react-confetti';
import elec_on from '../../img/nine_lamps/electricity_on.png';
import elec_off from '../../img/nine_lamps/electricity_off.png';
import Header from './Header';
import { arrayEquals, secondsToTime } from '../../utils/utils';
import './NineLamps.css';
import VictoryModal from '../../components/victory_modal/VictoryModal';

const TIMER_IN_SECONDS = 180;
const INITIAL_LAMPS_STATE = [false, false, false, false, false, false, false, false, false];
const WINNING_LAMPS_STATE = [true, true, true, true, true, true, true, true, true];

const NineLamps = () => {
  const [lampsState, setLampsState] = useState(INITIAL_LAMPS_STATE);
  const [startStopTimer, setStartStopTimer] = useState(false);
  const [problemSolved, setProblemSolved] = useState(false);
  const [problemCouldntBeSolved, setProblemCouldntBeSolved] = useState(false);
  const [counter, setCounter] = useState(TIMER_IN_SECONDS);
  const [cookies, setCookie, removeCookie] = useCookies(['puzzle-solved', 'start-time']);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [startTime, setStartTime] = useState(null);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle saved state
  useEffect(() => {
    const savedState = cookies['puzzle-solved'];
    if (savedState) {
      const [status, state] = savedState.split('-');
      if (status === 'failure') {
        const lampsArray = state.split(',').map(value => value === 'true');
        setProblemCouldntBeSolved(true);
        setCounter(0);
        setLampsState(lampsArray);
      } else if (status === 'success') {
        setProblemSolved(true);
        setLampsState(WINNING_LAMPS_STATE);
        setCounter(parseInt(state, 10));
      }
    }
    // Retrieve the start time from cookies if timer has started
    const savedStartTime = cookies['start-time']; // Retrieve start time from cookie
    if (savedStartTime) {
      setStartTime(parseInt(savedStartTime, 10));
      setStartStopTimer(true);
    }
  }, [cookies]);

  // Handle timer
  useEffect(() => {
    let timer;
    if (startStopTimer && startTime) {
      timer = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000); // Calculate elapsed time
        setCounter(TIMER_IN_SECONDS - elapsedTime);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [startStopTimer, startTime]);

  // Handle time out
  useEffect(() => {
    if (counter <= 0 && startStopTimer) {
      setProblemCouldntBeSolved(true);
      setCookie('puzzle-solved', `failure-${lampsState}`, { path: '/', maxAge: 2000 });
      removeCookie('start-time', { path: '/' }); // Remove the start-time cookie
      setStartStopTimer(false);
    }
  }, [counter, startStopTimer, setCookie, removeCookie, lampsState]);

  // Puzzle completion logic
  useEffect(() => {
    if (arrayEquals(lampsState, WINNING_LAMPS_STATE) && !cookies['puzzle-solved']) {
      setStartStopTimer(false);
      setProblemSolved(true);
      setShowVictoryModal(true);
      setShowConfetti(true);
      setCookie('puzzle-solved', `success-${counter}`, { path: '/', maxAge: 2000 });
      removeCookie('start-time', { path: '/' }); // Remove the start-time cookie
    }
  }, [lampsState, cookies, counter, setCookie, removeCookie]);

  const closeVictoryModal = () => {
    setShowVictoryModal(false);
    setShowConfetti(false);
  };

  const changeLampState = (lamp) => {
    if (problemSolved || problemCouldntBeSolved) return;

    //if (!startStopTimer) setStartStopTimer(true);

    if (!startStopTimer) {
      setStartStopTimer(true);
      const currentTime = Date.now();
      setStartTime(currentTime); // Set start time
      setCookie('start-time', currentTime, { path: '/', maxAge: TIMER_IN_SECONDS }); // Store start time in cookie
    }

    const newLampsState = [...lampsState];
    const toggle = (index) => newLampsState[index] = !newLampsState[index];

    switch (lamp) {
      case 1:
        toggle(0); toggle(1); toggle(3);
        break;
      case 2:
        toggle(0); toggle(1); toggle(2); toggle(4);
        break;
      case 3:
        toggle(1); toggle(2); toggle(5);
        break;
      case 4:
        toggle(0); toggle(3); toggle(4); toggle(6);
        break;
      case 5:
        toggle(1); toggle(3); toggle(4); toggle(5); toggle(7);
        break;
      case 6:
        toggle(2); toggle(4); toggle(5); toggle(8);
        break;
      case 7:
        toggle(3); toggle(6); toggle(7);
        break;
      case 8:
        toggle(4); toggle(6); toggle(7); toggle(8);
        break;
      case 9:
        toggle(5); toggle(7); toggle(8);
        break;
      default:
        break;
    }
    setLampsState(newLampsState);
  };

  const resetLampStates = () => {
    if (!problemSolved && !problemCouldntBeSolved) {
      setLampsState(INITIAL_LAMPS_STATE);
    }
  };

  const renderButton = (index) => (
    <button
      onClick={() => changeLampState(index + 1)}
      className={lampsState[index] ? 'active' : 'not-active'}
    >
      <img
        src={lampsState[index] ? elec_on : elec_off}
        alt="Toggle electricity"
      />
    </button>
  );

  return (
    <div>
      {showConfetti && ( // Use showConfetti to control confetti display
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
        message="You solved the puzzle!"
        stats={[
          { label: "Time", value: secondsToTime(TIMER_IN_SECONDS - counter) }
        ]}
      />
      
      <div className="header">
        <Header />
      </div>
      <div className="content" id="nine-lamps-game">
        <div>
          <div>
            <div className="timer">Timer: {secondsToTime(counter)}</div>
          </div>
          <div className="row">
            {renderButton(0)}
            {renderButton(1)}
            {renderButton(2)}
          </div>
          <div className="row">
            {renderButton(3)}
            {renderButton(4)}
            {renderButton(5)}
          </div>
          <div className="row">
            {renderButton(6)}
            {renderButton(7)}
            {renderButton(8)}
          </div>
          <div className="reset">
            <button onClick={resetLampStates}>Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NineLamps;