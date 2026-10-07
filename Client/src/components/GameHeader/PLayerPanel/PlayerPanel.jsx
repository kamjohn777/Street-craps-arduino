import './PlayerPanel.css'
import orangeFrame from '../../../assets/gameheader/street-craps-orange-HUD-frame-bg.png'
import blueFrame from '../../../assets/gameheader/street-craps-blue-HUD-frame-bg.png'
import redFrame from '../../../assets/gameheader/street-craps-red-HUD-frame-bg.png'
import purpleFrame from '../../../assets/gameheader/street-craps-purple-HUG-frame-bg.png'
import orangePortrait from '../../../assets/characters/street-craps-player-portrait-orange.png'
import bluePortrait from '../../../assets/characters/street-craps-player-portrait-blue.png'
import redPortrait from '../../../assets/characters/street-craps-player-portrait-red.png'
import purplePortrait from '../../../assets/characters/street-craps-player-portrait-purple.png'
import shooterIndicator from '../../../assets/gameheader/street-craps-shooter-img-2.png'
import waitingIndicator from '../../../assets/gameheader/street-craps-waiting-img.png'

const characterAssets = {
  orange: { frame: orangeFrame, portrait: orangePortrait, accent: '#ff9d00', shooterHue: '0deg' },
  blue: { frame: blueFrame, portrait: bluePortrait, accent: '#08adf4', shooterHue: '155deg' },
  red: { frame: redFrame, portrait: redPortrait, accent: '#ff2439', shooterHue: '310deg' },
  purple: { frame: purpleFrame, portrait: purplePortrait, accent: '#c21cff', shooterHue: '245deg' }
}

function PlayerPanel({ player, onCharacterChange }) {
  const character = characterAssets[player.character] ? player.character : 'orange'
  const assets = characterAssets[character]
  const playerName = player.name || `Player ${player.playerNumber}`

  return (
    <section
      className="player-panel"
      aria-label={`${playerName} player panel`}
      style={{
        '--hud-frame': `url("${assets.frame}")`,
        '--player-accent': assets.accent,
        '--shooter-hue': assets.shooterHue
      }}
    >
      <img className="player-panel__portrait" src={assets.portrait} alt={`${character} character`} />
      <div className="player-panel__content">
        <h2 className="player-panel__name">{playerName}</h2>
        <label className="player-panel__character-control">
          <span className="visually-hidden">{playerName} character</span>
          <select
            value={character}
            onChange={(event) => onCharacterChange?.(event.target.value)}
            aria-label={`${playerName} character`}
          >
            {Object.keys(characterAssets).map((characterOption) => (
              <option key={characterOption} value={characterOption}>
                {characterOption[0].toUpperCase() + characterOption.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <div className="player-panel__bankroll">
          <span>Bankroll</span>
          <strong>${Number(player.bankroll ?? 0).toLocaleString()}</strong>
        </div>
        <div className="player-panel__bets">
          <span className="player-panel__eyebrow">Current bets</span>
          {player.currentBets?.length ? (
            <ul>
              {player.currentBets.map((bet, index) => (
                <li key={`${bet.label}-${bet.amount}-${index}`}>
                  <span>{bet.label}</span>
                  <strong>${Number(bet.amount).toLocaleString()}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <span className="player-panel__empty-bets">No active bets</span>
          )}
        </div>
      </div>
      <img
        className={`player-panel__turn-indicator${player.isShooter ? ' is-shooter' : ''}`}
        src={player.isShooter ? shooterIndicator : waitingIndicator}
        alt={player.isShooter ? 'Shooter' : 'Waiting'}
      />
    </section>
  )
}

export default PlayerPanel      