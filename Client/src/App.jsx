import './App.css'
import GameHeader from './components/GameHeader/GameHeader'
import RollHistoryPanel from './components/GameHeader/RollHistoryPanel/RHPanel'
import DiceRollPanel from './components/GameHeader/DiceRollPanel/DiceRollPanel'
import OutComePanel from './components/GameHeader/OutComePanel/OutComePanel'

function App() {
  return (
    <main className="app-shell" aria-label="Street Craps game">
      <GameHeader />
      <div className="game-panels">
        <RollHistoryPanel />
        <DiceRollPanel />
        <OutComePanel />
      </div>
    </main>
  )
}

export default App
