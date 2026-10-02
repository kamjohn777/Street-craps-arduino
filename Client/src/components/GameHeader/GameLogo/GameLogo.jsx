import './GameLogo.css'
import streetCrapsLogo from '../../../assets/logo/street-craps-logo-2-1.png'

function GameLogo() {
  return (
    <div className="game-logo" aria-label="Street Craps game logo">
      <img src={streetCrapsLogo} alt="Street Craps logo" />
    </div>
  )
}

export default GameLogo
