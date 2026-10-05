import { useEffect, useState } from 'react'
import './DiceRollPanel.css'
import dicePanelFrame from '../../../assets/panels/street-craps-dice-holder-panel-middle-sec.png'
import { io } from 'socket.io-client'

const serverUrl = import.meta.env.VITE_SERVER_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000`
const defaultShakeDuration = 900

const diePips = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9]
}

const visibleFaces = {
  1: { top: 2, right: 3 },
  2: { top: 1, right: 3 },
  3: { top: 1, right: 2 },
  4: { top: 1, right: 2 },
  5: { top: 1, right: 3 },
  6: { top: 2, right: 3 }
}

function DieFace({ value, position }) {
  return (
    <span className={`dice-roll__face dice-roll__face--${position}`}>
      {Array.from({ length: 9 }, (_, index) => (
        <span
          key={index}
          className={diePips[value].includes(index + 1) ? 'dice-roll__pip' : undefined}
        />
      ))}
    </span>
  )
}

function Die({ value, index }) {
  const restingAngles = index === 0
    ? { '--dice-rest-x': '-25deg', '--dice-rest-y': '-35deg' }
    : { '--dice-rest-x': '-20deg', '--dice-rest-y': '-45deg' }

  return (
    <span
      className={`dice-roll__die dice-roll__die--${index + 1}`}
      style={restingAngles}
      role="img"
      aria-label={`Die showing ${value}`}
    >
      <span className="dice-roll__cube" aria-hidden="true">
        <DieFace value={value} position="front" />
        <DieFace value={7 - value} position="back" />
        <DieFace value={visibleFaces[value].top} position="top" />
        <DieFace value={7 - visibleFaces[value].top} position="bottom" />
        <DieFace value={visibleFaces[value].right} position="right" />
        <DieFace value={7 - visibleFaces[value].right} position="left" />
      </span>
    </span>
  )
}

function DiceRollPanel({ currentPlayer = 1, dice = [4, 3] }) {
  const [visibleDice, setVisibleDice] = useState(dice)
  const [isShaking, setIsShaking] = useState(false)
  const [connectionError, setConnectionError] = useState(false)
  const [shakeDuration, setShakeDuration] = useState(defaultShakeDuration)

  useEffect(() => {
    const socket = io(serverUrl)
    const abortController = new AbortController()
    let animationTimeout
    let activeShake = false
    let pendingRoll = null
    let latestRollId = 0

    const applyRoll = (roll) => {
      if (!Number.isInteger(roll?.id) || roll.id <= latestRollId) {
        return
      }

      if (
        !Number.isInteger(roll.die1) ||
        roll.die1 < 1 ||
        roll.die1 > 6 ||
        !Number.isInteger(roll.die2) ||
        roll.die2 < 1 ||
        roll.die2 > 6 ||
        roll.total !== roll.die1 + roll.die2
      ) {
        setConnectionError(true)
        return
      }

      latestRollId = roll.id
      setVisibleDice([roll.die1, roll.die2])
    }

    const handleShake = (payload = {}) => {
      const { duration } = payload
      const nextDuration = Number.isFinite(duration) && duration >= 0
        ? Math.min(duration, 5000)
        : defaultShakeDuration

      window.clearTimeout(animationTimeout)
      activeShake = true
      pendingRoll = null
      setShakeDuration(nextDuration)
      setIsShaking(true)

      animationTimeout = window.setTimeout(() => {
        activeShake = false
        setIsShaking(false)

        if (pendingRoll) {
          applyRoll(pendingRoll)
          pendingRoll = null
        }
      }, nextDuration)
    }

    const handleRoll = (roll) => {
      if (activeShake) {
        pendingRoll = roll
        return
      }

      applyRoll(roll)
    }

    socket.on('connect', () => setConnectionError(false))
    socket.on('connect_error', () => setConnectionError(true))
    socket.on('dice-shake', handleShake)
    socket.on('dice-roll', handleRoll)

    fetch(`${serverUrl}/api/roll/latest`, { signal: abortController.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Latest roll request failed: ${response.status}`)
        }

        return response.json()
      })
      .then(applyRoll)
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setConnectionError(true)
        }
      })

    return () => {
      window.clearTimeout(animationTimeout)
      abortController.abort()
      socket.disconnect()
    }
  }, [])

  const total = visibleDice[0] + visibleDice[1]

  return (
    <section className="dice-roll" aria-label="Current turn and last roll">
      <img className="dice-roll__frame" src={dicePanelFrame} alt="" aria-hidden="true" />
      <div className="dice-roll__content">
        <div className="dice-roll__prompt">
          <h2 className="dice-roll__turn">
            Player {currentPlayer}'s <span>turn</span>
          </h2>
          <p className="dice-roll__shake" aria-live="polite">
            {isShaking ? 'Rolling...' : 'Shake the dice'}
          </p>
          <p className={`dice-roll__instruction${connectionError ? ' dice-roll__instruction--error' : ''}`}>
            {connectionError ? 'Unable to connect to dice server' : 'Shake the Arduino to roll'}
          </p>
        </div>
        <div
          className={`dice-roll__dice${isShaking ? ' dice-roll__dice--shaking' : ''}`}
          style={{ '--dice-roll-shake-duration': `${shakeDuration}ms` }}
          role="group"
          aria-label={`Dice: ${visibleDice.join(' and ')}`}
        >
          {visibleDice.map((value, index) => (
            <Die key={index} value={value} index={index} />
          ))}
        </div>
        <div className="dice-roll__last-roll" aria-label={`Last roll: ${total}, ${visibleDice[0]} plus ${visibleDice[1]}`}>
          <span className="dice-roll__last-label">Last roll</span>
          <strong className="dice-roll__total">{total}</strong>
          <span className="dice-roll__breakdown">{visibleDice[0]} + {visibleDice[1]}</span>
        </div>
      </div>
    </section>
  )
}

export default DiceRollPanel
