import './GameBoard.css'
import tableBoard from '../../../assets/panels/street-craps-game-table-board.png'

const pointNumbers = [4, 5, 6, 8, 9, 10]
const fieldNumbers = [2, 3, 4, 9, 10, 11, 12]

function GameBoard({ point = null }) {
  return (
    <section className="game-board" aria-label="Craps betting table">
      <img className="game-board__frame" src={tableBoard} alt="" aria-hidden="true" />
      <div className="game-board__layout">
        <div className="game-board__side game-board__side--left" aria-hidden="true">
          Don&apos;t Pass Bar
        </div>

        <div className="game-board__numbers" aria-label="Place bet numbers">
          {pointNumbers.map((number) => (
            <div
              key={number}
              className={`game-board__number${point === number ? ' is-point' : ''}`}
              aria-current={point === number ? 'true' : undefined}
            >
              {point === number && <span className="game-board__point-marker">Point</span>}
              <span>{number}</span>
            </div>
          ))}
        </div>

        <div className="game-board__side game-board__side--right" aria-hidden="true">
          Don&apos;t Pass Bar
        </div>

        <div className="game-board__come" aria-label="Come bet area">
          Come
        </div>

        <div className="game-board__field" aria-label="Field bet area">
          <span className="game-board__field-label">Field</span>
          <div className="game-board__field-numbers">
            {fieldNumbers.map((number) => (
              <span
                key={number}
                className={number === 2 || number === 12 ? 'is-double' : undefined}
              >
                {number}
              </span>
            ))}
          </div>
        </div>

        <div className="game-board__pass-line">Pass Line</div>
      </div>
    </section>
  )
}

export default GameBoard