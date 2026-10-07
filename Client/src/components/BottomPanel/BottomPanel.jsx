import './BottomPanel.css'
import bottomPanelFrame from '../../assets/panels/street-craps-bottom-panel.png'

const chipAmounts = [1, 5, 25, 100]
const startingAmounts = [100, 250, 500, 1000, 5000]

function BottomPanel({
  selectedAmount,
  onAmountChange,
  startingBankroll,
  onStartingBankrollChange,
  availableBalance,
  betStatus,
  onPlaceBet,
  onUndoBet,
  onRepeatBet,
  canRepeatBet
}) {
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
                disabled={amount > availableBalance}
                onClick={() => onAmountChange(amount)}
              >
                ${amount}
              </button>
            ))}
          </div>
          <p className="bottom-panel__selected-bet" aria-live="polite">
            Automatic Pass Line + Add Bet amount: ${selectedAmount}
          </p>
        </div>

        <div className="bottom-panel__starting-bankroll">
          <label className="bottom-panel__heading" htmlFor="starting-bankroll">
            Starting bankroll
          </label>
          <select
            id="starting-bankroll"
            className="bottom-panel__bankroll-select"
            value={startingBankroll}
            onChange={onStartingBankrollChange}
          >
            {startingAmounts.map((amount) => (
              <option key={amount} value={amount}>${amount.toLocaleString()}</option>
            ))}
          </select>
          <p className="bottom-panel__selected-bet">For both players</p>
        </div>

        <div className="bottom-panel__actions">
          <h2 className="bottom-panel__heading">Actions</h2>
          <div className="bottom-panel__action-buttons">
            <button
              className="bottom-panel__action bottom-panel__action--roll"
              type="button"
              onClick={onPlaceBet}
            >
              <span className="bottom-panel__die-icon" aria-hidden="true">●</span>
              Add Bet
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
              disabled={!canRepeatBet}
              onClick={onRepeatBet}
            >
              <span className="bottom-panel__repeat-icon" aria-hidden="true">↻</span>
              Repeat Bets
            </button>
          </div>
          <p className="bottom-panel__bet-status" role="status">{betStatus}</p>
        </div>
      </div>
    </section>
  )
}

export default BottomPanel
