import { useState } from 'react'
import './GameHeader.css'
import GameLogo from './GameLogo/GameLogo'
import PlayerPanel from './PLayerPanel/PlayerPanel'

function GameHeader({ currentPlayer = 1 }) {
  const [players, setPlayers] = useState([
    {
      playerNumber: 1,
      character: 'orange',
      bankroll: 125,
      currentBets: [
        { label: 'Pass Line', amount: 10 },
        { label: 'Field', amount: 5 }
      ]
    },
    {
      playerNumber: 2,
      character: 'purple',
      bankroll: 100,
      currentBets: [{ label: 'Come', amount: 5 }]
    }
  ])

  function updateCharacter(playerNumber, character) {
    setPlayers((currentPlayers) => currentPlayers.map((player) => (
      player.playerNumber === playerNumber ? { ...player, character } : player
    )))
  }

  return (
    <header className="game-header" aria-label="Street Craps game header">
      <PlayerPanel
        player={{ ...players[0], isShooter: currentPlayer === 1 }}
        onCharacterChange={(character) => updateCharacter(1, character)}
      />
      <GameLogo />
      <PlayerPanel
        player={{ ...players[1], isShooter: currentPlayer === 2 }}
        onCharacterChange={(character) => updateCharacter(2, character)}
      />
    </header>
  )
}

export default GameHeader