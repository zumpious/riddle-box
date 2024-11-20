import './Header.css';
import ScrollDownButton from '../../components/scroll_down_button/ScrollDownButton';

export function Header() {
  return (
    <div className='game-header'>
      <div className='ruleset'>
        <h1> 9 Lamps </h1>
        <p>
          Below this text, you will see <span className="bold">9 unlit lamps</span>, represented by lightning bolts.
          Click on a lamp to turn it on, or click it again to turn it off.
          When a lamp is turned on, all directly adjacent vertical and horizontal lamps will also toggle their state.
          Your goal is to turn on all <span className="bold">9 lamps simultaneously</span>.
        </p>
        <p>
          You have <span className="bold">5 minutes</span> to complete this task. Points will only be awarded for the correct solution.
        </p>
        <p>
          You can attempt as many times as you like.
          <span className="bold"> Your time starts as soon as the first lamp is lit.</span>
        </p>
        <p>
          An <span className="bold">extra point</span> can be earned for presenting your solution to the group after the puzzle round ends.
        </p>
      </div>
      <ScrollDownButton targetId='nine-lamps-game' />
    </div>
  );
}

export default Header;