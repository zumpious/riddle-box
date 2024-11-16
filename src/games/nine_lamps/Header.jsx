import './Header.css';

export function Header() {
  return (
    <div className='container'>
      <div className="heading">
        <h1> PUB QUIZ </h1>
      </div>
      <div className="ruleset">
        <p>
          Scrollt ihr im Anschluss an diesen Text nach unten seht ihr <span className="bold">9 ausgeschaltete Lampen</span>, symbolisiert durch die Blitze.
          Durch klicken auf eine Lampe schaltet ihr diese an, bzw durch erneutes klicken auf die selbe Lampe wieder aus.
          Wird eine Lampe eingeschaltet, so schalten sich auch alle direkten vertikalen und horizontalen Lampen ein, bzw aus, wenn sie bereits an sind.
          Eure Aufgabe ist es, alle <span className="bold"> 9 Lampen gleichzeitig einzuschalten</span>.
        </p>
        <p>
          Für die Bearbeitung habt ihr <span className="bold">5 min</span> Zeit. Nur durch die richtige Lösung werden euch die Punkte gutgeschrieben.
        </p>
        <p>
          Ihr habt so viele Versuche wie ihr mögt.
          <span className="bold"> Eure Zeit läuft sobald die erste Lampe beleuchtet wird.</span>
        </p>
        <p>
          Bei korrekter Lösung kann sich ein <span className="bold">Extrapunkt</span> verdient werden.
          Dafür müsst ihr nach Ablauf der Rätselrunde eure Lösung nochmal vor der ganzen Gruppe präsentieren.
        </p>
      </div>
    </div>
  );
}

export default Header;