import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'
import GameHeader from './components/GameHeader/GameHeader'
import RollHistoryPanel from './components/GameHeader/RollHistoryPanel/RHPanel'
import DiceRollPanel from './components/GameHeader/DiceRollPanel/DiceRollPanel'
import GameBoard from './components/GameHeader/GameBoard/GameBoard'
import OutComePanel from './components/GameHeader/OutComePanel/OutComePanel'
import BottomPanel from './components/BottomPanel/BottomPanel'

const serverUrl = import.meta.env.VITE_SERVER_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000`

const initialGameState = {
  currentPlayer: 1,
  phase: 'come-out',
  point: null,
  lastOutcome: 'Waiting for the first roll.',
  lastRollId: 0,
  history: []
}

function App() {
  const [game, setGame] = useState(initialGameState)

  useEffect(() => {
    const socket = io(serverUrl)
    const abortController = new AbortController()
    let latestSeenRollId = 0

    socket.on('dice-roll', (roll) => {
      if (!Number.isInteger(roll?.id) || !roll.gameState || roll.id <= latestSeenRollId) {
        return
      }

      latestSeenRollId = roll.id
      setGame((currentGame) => ({
        ...roll.gameState,
        history: [...currentGame.history.filter((item) => item.id !== roll.id), roll]
          .sort((first, second) => first.id - second.id)
      }))
    })

    fetch(`${serverUrl}/api/game`, { signal: abortController.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Game state request failed: ${response.status}`)
        }

        return response.json()
      })
      .then((snapshot) => {
        if (snapshot.lastRollId >= latestSeenRollId) {
          latestSeenRollId = snapshot.lastRollId
          setGame(snapshot)
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Unable to load game state:', error)
        }
      })

    return () => {
      abortController.abort()
      socket.disconnect()
    }
  }, [])

  return (
    <main className="app-shell" aria-label="Street Craps game">
      <GameHeader currentPlayer={game.currentPlayer} />
      <div className="game-panels">
        <RollHistoryPanel rolls={game.history} />
        <div className="table-area">
          <DiceRollPanel currentPlayer={game.currentPlayer} />
          <GameBoard point={game.point} />
        </div>
        <OutComePanel
          phase={game.phase}
          point={game.point}
          lastOutcome={game.lastOutcome}
        />
      </div>
      <BottomPanel />
    </main>
  )
}

export default App
