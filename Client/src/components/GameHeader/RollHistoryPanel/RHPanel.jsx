import './RHPanel.css'
import rollHistoryFrame from '../../../assets/panels/street-craps-roll-history-panel.png'

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

function RHPanel({ rolls = [] }) {
  const recentRolls = [...rolls].reverse()

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
        {recentRolls.length ? (
          <ol className="roll-history__list">
            {recentRolls.map((roll) => {
              const dice = [roll.die1, roll.die2]
              const time = new Date(roll.createdAt)

              return (
                <li className="roll-history__row" key={roll.id}>
                  <strong className="roll-history__total">
                    {roll.total}
                  </strong>
                  <span
                    className="roll-history__dice"
                    role="group"
                    aria-label={`Dice: ${dice.join(' and ')}`}
                  >
                    {dice.map((value, index) => (
                      <Die key={`${roll.id}-${index}`} value={value} />
                    ))}
                  </span>
                  <span className={`roll-history__details roll-history__details--player-${roll.player}`}>
                    <span className="roll-history__meta">
                      <span className="roll-history__player">Player {roll.player}</span>
                      <time className="roll-history__time" dateTime={roll.createdAt}>
                        {time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </time>
                    </span>
                    <span className="roll-history__outcome">
                      {roll.phase === 'point' ? `Point ${roll.point}` : 'Come-out'}: {roll.outcome}
                    </span>
                  </span>
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="roll-history__empty">No rolls yet</p>
        )}
      </div>
    </section>
  )
}

export default RHPanel