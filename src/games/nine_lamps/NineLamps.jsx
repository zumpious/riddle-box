import React, { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import elec_on from '../../img/nine_lamps/electricity_on.png';
import elec_off from '../../img/nine_lamps/electricity_off.png';
import Header from './Header';
import { arrayEquals, secondsToTime } from '../../utils/utils';
import './NineLamps.css';

const TIMER_IN_SECONDS = 300;
const INITIAL_LAMPS_STATE = [false, false, false, false, false, false, false, false, false];
const WINNING_LAMPS_STATE = [true, true, true, true, true, true, true, true, true];

const NineLamps = () => {
  const [lampsState, setLampsState] = useState(INITIAL_LAMPS_STATE);
  const [startStopTimer, setStartStopTimer] = useState(false);
  const [problemSolved, setProblemSolved] = useState(false);
  const [problemCouldntBeSolved, setProblemCouldntBeSolved] = useState(false);
  const [counter, setCounter] = useState(TIMER_IN_SECONDS);
  const [cookies, setCookie] = useCookies(['puzzle-solved']);

  // Handle saved state
  useEffect(() => {
    const savedState = cookies['puzzle-solved'];
    if (savedState) {
      const [status, state] = savedState.split('-');
      const lampsArray = state.split(',').map(value => value === 'true');
      if (status === 'failure') {
        setProblemCouldntBeSolved(true);
        setCounter(0);
        setLampsState(lampsArray);
      } else if (status === 'success') {
        setProblemSolved(true);
        setLampsState(WINNING_LAMPS_STATE);
        setCounter(parseInt(state, 10));
      }
    }
  }, [cookies]);

  // Handle timer
  useEffect(() => {
    let timer;
    if (startStopTimer) {
      timer = setInterval(() => {
        setCounter((prevCounter) => prevCounter - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [startStopTimer]);

  // Handle time out
  useEffect(() => {
    if (counter <= 0 && startStopTimer) {
      setProblemCouldntBeSolved(true);
      setCookie('puzzle-solved', `failure-${lampsState}`, { path: '/', maxAge: 2000 });
      setStartStopTimer(false);
    }
  }, [counter, startStopTimer, setCookie, lampsState]);

  // Puzzle completion logic 
  useEffect(() => {
    if (arrayEquals(lampsState, WINNING_LAMPS_STATE) && !cookies['puzzle-solved']) {
      setStartStopTimer(false);
      setProblemSolved(true);
      setCookie('puzzle-solved', `success-${counter}`, { path: '/', maxAge: 2000 });
    }
  }, [lampsState, cookies, counter, setCookie]);

  const changeLampState = (lamp) => {
    if (problemSolved || problemCouldntBeSolved) return;

    if (!startStopTimer) setStartStopTimer(true);

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
    <button onClick={() => changeLampState(index + 1)} className={lampsState[index] ? 'active' : 'not-active'}>
      <img src={lampsState[index] ? elec_on : elec_off} alt="Toggle electricity" />
    </button>
  );

  return (
    <div>
      <div className='header'>
        <Header />
      </div>
      <div className="content">
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