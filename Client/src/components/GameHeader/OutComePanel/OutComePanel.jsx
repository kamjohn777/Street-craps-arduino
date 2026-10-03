import { useState } from 'react'
import './OutComePanel.css'
import rightPanelFrame from '../../../assets/panels/street-craps-right-side-panel.png'

const numberBets = [4, 5, 6, 8, 9, 10]
const propositionBets = [
  { label: 'Come', className: 'come' },
  { label: "Don't Come", className: 'dont-come' },
  { label: 'Field', className: 'field' },
  { label: "Don't Pass", className: 'dont-pass' },
  { label: 'Pass Line', className: 'pass-line' }
]

function OutComePanel() {
  const [selectedBet, setSelectedBet] = useState('')

  function clearBet() {
    setSelectedBet('')
  }

  return (
    <aside className="outcome-panel" aria-label="Game status and place bets">
      <img className="outcome-panel__frame" src={rightPanelFrame} alt="" aria-hidden="true" />
      <div className="outcome-panel__content">
        <section className="game-status" aria-labelledby="game-status-title">
          <h2 className="outcome-panel__heading" id="game-status-title">Game Status</h2>
          <p className="game-status__phase">Come Out Roll</p>
          <div className="game-status__point">
            <span>Point</span>
            <strong aria-label="No point set">—</strong>
            <span>(Not Set)</span>
          </div>
        </section>

        <section className="place-bets" aria-labelledby="place-bets-title">
          <div className="place-bets__heading-row">
            <h2 className="outcome-panel__heading" id="place-bets-title">Place Bets</h2>
            <button className="place-bets__clear" type="button" onClick={clearBet}>
              Clear
            </button>
          </div>
          <div className="place-bets__grid place-bets__grid--numbers">
            {numberBets.map((number) => (
              <button
                className={`place-bets__button place-bets__number${selectedBet === String(number) ? ' is-selected' : ''}`}
                key={number}
                type="button"
                aria-pressed={selectedBet === String(number)}
                onClick={() => setSelectedBet(String(number))}
              >
                {number}
              </button>
            ))}
          </div>
          <div className="place-bets__grid place-bets__grid--propositions">
            {propositionBets.map(({ label, className }) => (
              <button
                className={`place-bets__button place-bets__${className}${selectedBet === label ? ' is-selected' : ''}`}
                key={label}
                type="button"
                aria-pressed={selectedBet === label}
                onClick={() => setSelectedBet(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  )
}

export default OutComePanel