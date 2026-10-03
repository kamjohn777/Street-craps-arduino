import './DiceRollPanel.css'
import dicePanelFrame from '../../../assets/panels/street-craps-dice-holder-panel-middle-sec.png'

const diePips = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9]
}

const visibleFaces = {
  1: { top: 2, right: 3 },
  2: { top: 1, right: 3 },
  3: { top: 1, right: 2 },
  4: { top: 1, right: 2 },
  5: { top: 1, right: 3 },
  6: { top: 2, right: 3 }
}

function DieFace({ value, position }) {
  return (
    <span className={`dice-roll__face dice-roll__face--${position}`}>
      {Array.from({ length: 9 }, (_, index) => (
        <span
          key={index}
          className={diePips[value].includes(index + 1) ? 'dice-roll__pip' : undefined}
        />
      ))}
    </span>
  )
}

function Die({ value, className = '' }) {
  return (
    <span className={`dice-roll__die ${className}`} role="img" aria-label={`Die showing ${value}`}>
      <span className="dice-roll__cube" aria-hidden="true">
        <DieFace value={value} position="front" />
        <DieFace value={7 - value} position="back" />
        <DieFace value={visibleFaces[value].top} position="top" />
        <DieFace value={7 - visibleFaces[value].top} position="bottom" />
        <DieFace value={visibleFaces[value].right} position="right" />
        <DieFace value={7 - visibleFaces[value].right} position="left" />
      </span>
    </span>
  )
}

function DiceRollPanel({ currentPlayer = 1, dice = [4, 3] }) {
  const total = dice[0] + dice[1]

  return (
    <section className="dice-roll" aria-label="Current turn and last roll">
      <img className="dice-roll__frame" src={dicePanelFrame} alt="" aria-hidden="true" />
      <div className="dice-roll__content">
        <div className="dice-roll__prompt">
          <h2 className="dice-roll__turn">
            Player {currentPlayer}'s <span>turn</span>
          </h2>
          <p className="dice-roll__shake">Shake the dice</p>
          <p className="dice-roll__instruction">Use your physical dice to roll</p>
        </div>
        <div className="dice-roll__dice" role="group" aria-label={`Dice: ${dice.join(' and ')}`}>
          {dice.map((value, index) => (
            <Die key={index} value={value} className={`dice-roll__die--${index + 1}`} />
          ))}
        </div>
        <div className="dice-roll__last-roll" aria-label={`Last roll: ${total}, ${dice[0]} plus ${dice[1]}`}>
          <span className="dice-roll__last-label">Last roll</span>
          <strong className="dice-roll__total">{total}</strong>
          <span className="dice-roll__breakdown">{dice[0]} + {dice[1]}</span>
        </div>
      </div>
    </section>
  )
}

export default DiceRollPanel
