import './GameHeader.css'
import GameLogo from './GameLogo/GameLogo'
import PlayerPanel from './PLayerPanel/PlayerPanel'

function GameHeader({ currentPlayer = 1, players = [], onCharacterChange }) {
  return (
    <header className="game-header" aria-label="Street Craps game header">
      <PlayerPanel
        player={{ ...players[0], isShooter: currentPlayer === 1 }}
        onCharacterChange={(character) => onCharacterChange?.(1, character)}
      />
      <GameLogo />
      <PlayerPanel
        player={{ ...players[1], isShooter: currentPlayer === 2 }}
        onCharacterChange={(character) => onCharacterChange?.(2, character)}
      />
    </header>
  )
}

export default GameHeader