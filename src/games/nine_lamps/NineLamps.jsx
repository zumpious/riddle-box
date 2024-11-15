import React, { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import elec_on from '../../img/electricity_on.png';
import elec_off from '../../img/electricity_off.png';
import Header from './Header';

const NineLamps = () => {
    const TIMER_IN_SECONDS = 300;

    const [lampsState, setLampsState] = useState([false, false, false, false, false, false, false, false, false]);
    const [startStopTimer, setStartStopTimer] = useState(false);
    const [problemSolved, setProblemSolved] = useState(false);
    const [problemCouldntBeSolved, setProblemCouldntBeSolved] = useState(false);
    const [counter, setCounter] = useState(TIMER_IN_SECONDS);
    const [cookies, setCookie, removeCookie] = useCookies(['puzzle-solved']);

    useEffect(() => {
        if (cookies['puzzle-solved']) {
            let cookieArray = cookies['puzzle-solved'].split('-');
            if (cookieArray[0] === 'failure') {
                setProblemCouldntBeSolved(true);
                let loosingArrayWithString = cookieArray[1].split(',');
                loosingArrayWithString.forEach((value, key) => {
                    loosingArrayWithString[key] = value === 'true';
                });
                setCounter(0);
                setLampsState(loosingArrayWithString);
            }
            if (cookieArray[0] === "success") {
                setProblemSolved(true);
                setLampsState([true, true, true, true, true, true, true, true, true]);
                setCounter(cookieArray[1]);
            }
        }
    }, []);

    useEffect(() => {
        if (startStopTimer) {
            if (counter < 1) {
                setProblemCouldntBeSolved(true);
                setCookie('puzzle-solved', 'failure-' + lampsState.toString(), { path: '/', maxAge: 2000 });
            }
            const timer = counter > 0 && setInterval(() => setCounter(counter - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [counter, startStopTimer]);

    useEffect(() => {
        if (arrayEquals(lampsState, [true, true, true, true, true, true, true, true, true]) && !cookies['puzzle-solved']) {
            setStartStopTimer(false);
            setProblemSolved(true);
            setCookie('puzzle-solved', 'success-' + counter, { path: '/', maxAge: 2000 });
        }
    }, [lampsState]);

    function arrayEquals(a, b) {
        return Array.isArray(a) &&
            Array.isArray(b) &&
            a.length === b.length &&
            a.every((val, index) => val === b[index]);
    }

    const changeLampState = (lamp) => {
        if (problemSolved || problemCouldntBeSolved) return;
        if (!startStopTimer) setStartStopTimer(true);

        switch (lamp) {
            case 1:
                setLampsState([!lampsState[0], !lampsState[1], lampsState[2], !lampsState[3], lampsState[4], lampsState[5], lampsState[6], lampsState[7], lampsState[8]]);
                break;
            case 2:
                setLampsState([!lampsState[0], !lampsState[1], !lampsState[2], lampsState[3], !lampsState[4], lampsState[5], lampsState[6], lampsState[7], lampsState[8]]);
                break;
            case 3:
                setLampsState([lampsState[0], !lampsState[1], !lampsState[2], lampsState[3], lampsState[4], !lampsState[5], lampsState[6], lampsState[7], lampsState[8]]);
                break;
            case 4:
                setLampsState([!lampsState[0], lampsState[1], lampsState[2], !lampsState[3], !lampsState[4], lampsState[5], !lampsState[6], lampsState[7], lampsState[8]]);
                break;
            case 5:
                setLampsState([lampsState[0], !lampsState[1], lampsState[2], !lampsState[3], !lampsState[4], !lampsState[5], lampsState[6], !lampsState[7], lampsState[8]]);
                break;
            case 6:
                setLampsState([lampsState[0], lampsState[1], !lampsState[2], lampsState[3], !lampsState[4], !lampsState[5], lampsState[6], lampsState[7], !lampsState[8]]);
                break;
            case 7:
                setLampsState([lampsState[0], lampsState[1], lampsState[2], !lampsState[3], lampsState[4], lampsState[5], !lampsState[6], !lampsState[7], lampsState[8]]);
                break;
            case 8:
                setLampsState([lampsState[0], lampsState[1], lampsState[2], lampsState[3], !lampsState[4], lampsState[5], !lampsState[6], !lampsState[7], !lampsState[8]]);
                break;
            case 9:
                setLampsState([lampsState[0], lampsState[1], lampsState[2], lampsState[3], lampsState[4], !lampsState[5], lampsState[6], !lampsState[7], !lampsState[8]]);
                break;
            default:
                break;
        }
    };

    const resetLampStates = () => {
        if (!problemSolved && !problemCouldntBeSolved) {
            setLampsState([false, false, false, false, false, false, false, false, false]);
        }
    };

    function secondsToTime(e) {
        const m = Math.floor(e % 3600 / 60).toString().padStart(2, '0'),
            s = Math.floor(e % 60).toString().padStart(2, '0');
        return m + ':' + s;
    }

    return (
        <div>
            <div className='header'>
                <Header />
            </div>
            <div className="content">
                <div className="nine_lamps_content">
                    <div>
                        <div className="timer">Timer: {secondsToTime(counter)}</div>
                    </div>
                    <div className="row">
                        <button onClick={() => changeLampState(1)} className={lampsState[0] ? 'active' : 'not-active'}>
                            <img src={lampsState[0] ? elec_on : elec_off} alt="electricity off" />
                        </button>
                        <button onClick={() => changeLampState(2)} className={lampsState[1] ? 'active' : 'not-active'}>
                            <img src={lampsState[1] ? elec_on : elec_off} alt="electricity off" />
                        </button>
                        <button onClick={() => changeLampState(3)} className={lampsState[2] ? 'active' : 'not-active'}>
                            <img src={lampsState[2] ? elec_on : elec_off} alt="electricity off" />
                        </button>
                    </div>
                    <div className="row">
                        <button onClick={() => changeLampState(4)} className={lampsState[3] ? 'active' : 'not-active'}>
                            <img src={lampsState[3] ? elec_on : elec_off} alt="electricity off" />
                        </button>
                        <button onClick={() => changeLampState(5)} className={lampsState[4] ? 'active' : 'not-active'}>
                            <img src={lampsState[4] ? elec_on : elec_off} alt="electricity off" />
                        </button>
                        <button onClick={() => changeLampState(6)} className={lampsState[5] ? 'active' : 'not-active'}>
                            <img src={lampsState[5] ? elec_on : elec_off} alt="electricity off" />
                        </button>
                    </div>
                    <div className="row">
                        <button onClick={() => changeLampState(7)} className={lampsState[6] ? 'active' : 'not-active'}>
                            <img src={lampsState[6] ? elec_on : elec_off} alt="electricity off" />
                        </button>
                        <button onClick={() => changeLampState(8)} className={lampsState[7] ? 'active' : 'not-active'}>
                            <img src={lampsState[7] ? elec_on : elec_off} alt="electricity off" />
                        </button>
                        <button onClick={() => changeLampState(9)} className={lampsState[8] ? 'active' : 'not-active'}>
                            <img src={lampsState[8] ? elec_on : elec_off} alt="electricity off" />
                        </button>
                    </div>
                    <div className="reset">
                        <button onClick={resetLampStates}>Zurücksetzen</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NineLamps;