import { useState } from 'react'
import './BottomPanel.css'
import bottomPanelFrame from '../../assets/panels/street-craps-bottom-panel.png'

const chipAmounts = [1, 5, 25, 100]

function BottomPanel({ onRoll, onUndoBet, onRepeatBet }) {
  const [selectedAmount, setSelectedAmount] = useState(5)

  return (
    <section className="bottom-panel" aria-label="Bet amount and game actions">
      <img className="bottom-panel__frame" src={bottomPanelFrame} alt="" aria-hidden="true" />
      <div className="bottom-panel__content">
        <div className="bottom-panel__bet-amount">
          <h2 className="bottom-panel__heading">Bet Amount</h2>
          <div className="bottom-panel__chips" role="group" aria-label="Select bet amount">
            {chipAmounts.map((amount) => (
              <button
                className={`bottom-panel__chip bottom-panel__chip--${amount}${selectedAmount === amount ? ' is-selected' : ''}`}
                key={amount}
                type="button"
                aria-pressed={selectedAmount === amount}
                onClick={() => setSelectedAmount(amount)}
              >
                ${amount}
              </button>
            ))}
          </div>
        </div>

        <div className="bottom-panel__actions">
          <h2 className="bottom-panel__heading">Actions</h2>
          <div className="bottom-panel__action-buttons">
            <button
              className="bottom-panel__action bottom-panel__action--roll"
              type="button"
              onClick={onRoll}
            >
              <span className="bottom-panel__die-icon" aria-hidden="true">⚄</span>
              Shake Dice to Roll
            </button>
            <button
              className="bottom-panel__action"
              type="button"
              onClick={onUndoBet}
            >
              <span className="bottom-panel__undo-icon" aria-hidden="true">↶</span>
              Undo Bet
            </button>
            <button
              className="bottom-panel__action"
              type="button"
              onClick={onRepeatBet}
            >
              <span className="bottom-panel__repeat-icon" aria-hidden="true">↻</span>
              Repeat Bets
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default BottomPanel
