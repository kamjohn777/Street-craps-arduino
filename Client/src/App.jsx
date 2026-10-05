import './App.css'
import GameHeader from './components/GameHeader/GameHeader'
import RollHistoryPanel from './components/GameHeader/RollHistoryPanel/RHPanel'
import DiceRollPanel from './components/GameHeader/DiceRollPanel/DiceRollPanel'
import GameBoard from './components/GameHeader/GameBoard/GameBoard'
import OutComePanel from './components/GameHeader/OutComePanel/OutComePanel'
import BottomPanel from './components/BottomPanel/BottomPanel'

function App() {
  return (
    <main className="app-shell" aria-label="Street Craps game">
      <GameHeader />
      <div className="game-panels">
        <RollHistoryPanel />
        <div className="table-area">
          <DiceRollPanel />
          <GameBoard />
        </div>
        <OutComePanel />
      </div>
      <BottomPanel />
    </main>
  )
}

export default App
