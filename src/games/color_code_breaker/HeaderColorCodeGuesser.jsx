import './HeaderColorCodeGuesser.css';

export function HeaderColorCodeGuesser() {
  return (
    <div className='game-header-color-code-guesser'>
      <div className='ruleset'>
        <h1>Color Code Guesser</h1>
        <p>
          Your goal is to guess the <span className='bold'>secret combination</span> of four colors.
          Choose from the available colors and submit your guess.
        </p>
        <p>
          After each guess, you'll receive <span className='bold'>feedback</span> on how many colors are in the <span className='bold'>correct position</span>correct position and how many <span className='bold'>correct colors</span> are in the wrong position.
        </p>
        <p>
          Use <span className='bold'>logic</span> and deduction to crack the code in as few attempts as possible.
        </p>
        <p>
          Good luck, and have fun!
        </p>
        <p><span className='bold'>Scroll down</span> to play the game.</p>
      </div>
    </div>
  );
}

export default HeaderColorCodeGuesser;