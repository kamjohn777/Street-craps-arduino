import './RHPanel.css'
import rollHistoryFrame from '../../../assets/panels/street-craps-roll-history-panel.png'

const exampleRolls = [
  { id: 1, dice: [2, 5], player: 1, time: '10:24 PM' },
  { id: 2, dice: [2, 4], player: 1, time: '10:23 PM' },
  { id: 3, dice: [3, 5], player: 2, time: '10:21 PM' },
  { id: 4, dice: [2, 3], player: 2, time: '10:20 PM' },
  { id: 5, dice: [3, 6], player: 1, time: '10:18 PM' },
  { id: 6, dice: [1, 3], player: 1, time: '10:17 PM' },
  { id: 7, dice: [5, 6], player: 2, time: '10:16 PM' },
  { id: 8, dice: [1, 2], player: 2, time: '10:15 PM' }
]

const diePips = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9]
}

function Die({ value }) {
  return (
    <span className="roll-history__die" role="img" aria-label={`Die showing ${value}`}>
      {Array.from({ length: 9 }, (_, index) => (
        <span
          key={index}
          className={diePips[value].includes(index + 1) ? 'roll-history__pip' : undefined}
        />
      ))}
    </span>
  )
}

function RHPanel({ rolls = exampleRolls }) {
  return (
    <section className="roll-history" aria-labelledby="roll-history-title">
      <img
        className="roll-history__frame"
        src={rollHistoryFrame}
        alt=""
        aria-hidden="true"
      />
      <div className="roll-history__content">
        <h2 className="roll-history__title" id="roll-history-title">Roll History</h2>
        {rolls.length ? (
          <ol className="roll-history__list">
            {rolls.map((roll) => (
              <li className="roll-history__row" key={roll.id}>
                <strong className="roll-history__total">
                  {roll.dice[0] + roll.dice[1]}
                </strong>
                <span
                  className="roll-history__dice"
                  role="group"
                  aria-label={`Dice: ${roll.dice.join(' and ')}`}
                >
                  {roll.dice.map((value, index) => (
                    <Die key={`${roll.id}-${index}`} value={value} />
                  ))}
                </span>
                <span className={`roll-history__details roll-history__details--player-${roll.player}`}>
                  <span className="roll-history__player">Player {roll.player}</span>
                  <time className="roll-history__time">{roll.time}</time>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="roll-history__empty">No rolls yet</p>
        )}
      </div>
    </section>
  )
}

export default RHPanel