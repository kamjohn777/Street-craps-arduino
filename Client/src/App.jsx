import { useEffect, useRef, useState } from 'react'
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

const defaultStartingBankroll = 500
const characterAccents = {
  orange: '#ff9d00',
  blue: '#08adf4',
  red: '#ff2439',
  purple: '#c21cff'
}

function createPlayers(bankroll) {
  return [
    {
      playerNumber: 1,
      character: 'orange',
      bankroll,
      currentBets: [],
      activeBet: null,
      sideBets: []
    },
    {
      playerNumber: 2,
      character: 'purple',
      bankroll,
      currentBets: [],
      activeBet: null,
      sideBets: []
    }
  ]
}

function resolveSideBet(bet, roll) {
  if (bet.type === 'Place') {
    if (roll.total === bet.number) {
      const odds = { 4: [9, 5], 5: [7, 5], 6: [7, 6], 8: [7, 6], 9: [7, 5], 10: [9, 5] }
      const [wins, units] = odds[bet.number]
      return { result: 'win', payout: bet.amount + bet.amount * wins / units }
    }

    return roll.total === 7 ? { result: 'lose', payout: 0 } : null
  }

  if (bet.type === 'Field') {
    if ([2, 3, 4, 9, 10, 11, 12].includes(roll.total)) {
      const multiplier = roll.total === 2 ? 2 : roll.total === 12 ? 3 : 1
      return { result: 'win', payout: bet.amount * (multiplier + 1) }
    }

    return { result: 'lose', payout: 0 }
  }

  if (bet.type === "Don't Pass") {
    if (bet.point !== null) {
      if (roll.total === 7) return { result: 'win', payout: bet.amount * 2 }
      if (roll.total === bet.point) return { result: 'lose', payout: 0 }
    } else if (roll.phase === 'come-out') {
      if ([2, 3].includes(roll.total)) return { result: 'win', payout: bet.amount * 2 }
      if (roll.total === 12) return { result: 'push', payout: bet.amount }
      if ([7, 11].includes(roll.total)) return { result: 'lose', payout: 0 }
      if ([4, 5, 6, 8, 9, 10].includes(roll.total)) {
        return { pointEstablished: true, point: roll.total }
      }
    }

    return null
  }

  if (bet.type === 'Come' || bet.type === "Don't Come") {
    const isDont = bet.type === "Don't Come"

    if (bet.point !== null) {
      if (roll.total === 7) {
        return { result: isDont ? 'win' : 'lose', payout: isDont ? bet.amount * 2 : 0 }
      }
      if (roll.total === bet.point) {
        return { result: isDont ? 'lose' : 'win', payout: isDont ? 0 : bet.amount * 2 }
      }
      return null
    }

    if (roll.total === 12 && isDont) return { result: 'push', payout: bet.amount }
    if ([7, 11].includes(roll.total)) {
      return { result: isDont ? 'lose' : 'win', payout: isDont ? 0 : bet.amount * 2 }
    }
    if ([2, 3, 12].includes(roll.total)) {
      return { result: isDont ? 'win' : 'lose', payout: isDont ? bet.amount * 2 : 0 }
    }
    if ([4, 5, 6, 8, 9, 10].includes(roll.total)) {
      return { pointEstablished: true, point: roll.total }
    }
  }

  return null
}

function settleBets(players, roll, automaticAmount) {
  const shooter = players.find((player) => player.playerNumber === roll.player)

  if (!shooter) {
    return players
  }

  let activeBet = shooter.activeBet
  let automaticBetAdded = false
  let opponentCredit = 0
  let shooterCredit = 0

  if (roll.phase === 'come-out' && (activeBet?.baseAmount ?? 0) === 0) {
    if (shooter.bankroll >= automaticAmount) {
      activeBet = {
        amount: (activeBet?.amount ?? 0) + automaticAmount,
        baseAmount: automaticAmount,
        additionalAmount: activeBet?.additionalAmount ?? 0,
        placedAtRollId: activeBet?.placedAtRollId ?? roll.id - 1
      }
      automaticBetAdded = true
    }
  }

  if (activeBet) {
    const wins = (roll.phase === 'come-out' && (roll.total === 7 || roll.total === 11)) ||
      (roll.phase === 'point' && roll.total === roll.point)
    const loses = (roll.phase === 'come-out' && [2, 3, 12].includes(roll.total)) ||
      (roll.phase === 'point' && roll.total === 7)
    const resolves = wins || loses

    if (resolves) {
      if (wins) shooterCredit += activeBet.amount * 2
      if (loses) opponentCredit += activeBet.amount
      activeBet = null
    }
  }

  let sideBets = []
  for (const bet of shooter.sideBets) {
    const resolution = resolveSideBet(bet, roll)
    if (!resolution) {
      sideBets.push(bet)
      continue
    }
    if (resolution.pointEstablished) {
      sideBets.push({ ...bet, point: resolution.point })
      continue
    }
    shooterCredit += resolution.payout
    if (resolution.result === 'lose') opponentCredit += bet.amount
  }

  const currentBets = [
    ...(activeBet?.baseAmount ? [{ label: 'Pass Line', amount: activeBet.baseAmount }] : []),
    ...(activeBet?.additionalAmount
      ? [{ label: 'Additional Pass Line', amount: activeBet.additionalAmount }]
      : []),
    ...sideBets.map((bet) => ({ label: bet.label, amount: bet.amount }))
  ]

  return players.map((player) => {
    if (player.playerNumber === roll.player) {
      return {
        ...player,
        bankroll: player.bankroll - (automaticBetAdded ? automaticAmount : 0) + shooterCredit,
        activeBet,
        sideBets,
        currentBets
      }
    }

    if (opponentCredit) {
      return {
        ...player,
        bankroll: player.bankroll + opponentCredit
      }
    }

    return player
  })
}

function App() {
  const [game, setGame] = useState(initialGameState)
  const [startingBankroll, setStartingBankroll] = useState(defaultStartingBankroll)
  const [players, setPlayers] = useState(() => createPlayers(defaultStartingBankroll))
  const [selectedAmount, setSelectedAmount] = useState(5)
  const [selectedBet, setSelectedBet] = useState('')
  const [lastBet, setLastBet] = useState(null)
  const selectedAmountRef = useRef(selectedAmount)
  const playersRef = useRef(players)
  selectedAmountRef.current = selectedAmount
  playersRef.current = players
  const [betStatus, setBetStatus] = useState(
    'The selected amount is wagered automatically. Use Add Bet for an optional extra wager.'
  )

  useEffect(() => {
    const socket = io(serverUrl)
    const abortController = new AbortController()
    let latestSeenRollId = 0

    socket.on('dice-roll', (roll) => {
      if (!Number.isInteger(roll?.id) || !roll.gameState || roll.id <= latestSeenRollId) {
        return
      }

      latestSeenRollId = roll.id
      const isPassLineLoss =
        (roll.phase === 'come-out' && [2, 3, 12].includes(roll.total)) ||
        (roll.phase === 'point' && roll.total === 7)

      if (roll.phase === 'come-out') {
        const player = playersRef.current.find((item) => item.playerNumber === roll.player)
        const amount = selectedAmountRef.current

        if (player && (player.activeBet?.baseAmount ?? 0) === 0) {
          const canPlaceAutomaticBet = player.bankroll >= amount

          if (isPassLineLoss) {
            const losingAmount = (player.activeBet?.amount ?? 0) +
              (canPlaceAutomaticBet ? amount : 0)
            setBetStatus(losingAmount
              ? `Player ${roll.player} crapped out. $${losingAmount} transferred to Player ${roll.player === 1 ? 2 : 1}.`
              : `Player ${roll.player} crapped out without an active wager.`)
          } else {
            setBetStatus(canPlaceAutomaticBet
              ? `Player ${roll.player} automatically wagered $${amount} on Pass Line.`
              : `Player ${roll.player} cannot cover the $${amount} automatic Pass Line wager.`)
          }
        }
      } else if (isPassLineLoss) {
        const player = playersRef.current.find((item) => item.playerNumber === roll.player)
        const losingAmount = player?.activeBet?.amount ?? 0
        setBetStatus(losingAmount
          ? `Player ${roll.player} crapped out. $${losingAmount} transferred to Player ${roll.player === 1 ? 2 : 1}.`
          : `Player ${roll.player} crapped out without an active wager.`)
      }

      setPlayers((currentPlayers) => (
        settleBets(currentPlayers, roll, selectedAmountRef.current)
      ))
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

  function placeBet(type = selectedBet, amount = selectedAmount) {
    if (!type) {
      setBetStatus('Select a bet in Place Bets before clicking Add Bet.')
      return
    }

    const activePlayer = players.find((player) => player.playerNumber === game.currentPlayer)
    const activeBet = activePlayer?.activeBet

    if (!activePlayer) {
      setBetStatus(`Player ${game.currentPlayer} is unavailable.`)
      return
    }

    if (type === 'Pass Line' && game.phase !== 'come-out') {
      setBetStatus('Pass Line bets can only be added before a Come-Out roll.')
      return
    }

    if (type === "Don't Pass" && game.phase !== 'come-out') {
      setBetStatus("Don't Pass bets can only be placed before a Come-Out roll.")
      return
    }

    if (['Come', "Don't Come"].includes(type) && game.phase !== 'point') {
      setBetStatus(`${type} bets can only be placed after a point is established.`)
      return
    }

    if (type === 'Pass Line' && activeBet && activeBet.placedAtRollId !== game.lastRollId) {
      setBetStatus(`Player ${game.currentPlayer} already has a Pass Line bet in play.`)
      return
    }

    if (amount > activePlayer.bankroll) {
      setBetStatus(`Player ${game.currentPlayer} does not have enough money for a $${amount} bet.`)
      return
    }

    if (type !== 'Pass Line') {
      const isPlaceNumber = /^\d+$/.test(type)
      const label = isPlaceNumber ? `Place ${type}` : type
      const sideBet = {
        type: isPlaceNumber ? 'Place' : type,
        label,
        amount,
        number: isPlaceNumber ? Number(type) : null,
        point: null,
        placedAtRollId: game.lastRollId
      }

      setPlayers((currentPlayers) => currentPlayers.map((player) => (
        player.playerNumber === game.currentPlayer
          ? {
              ...player,
              bankroll: player.bankroll - amount,
              sideBets: [...player.sideBets, sideBet],
              currentBets: [...player.currentBets, { label, amount }]
            }
          : player
      )))
      setLastBet({ type, amount, playerNumber: game.currentPlayer })
      setBetStatus(`Player ${game.currentPlayer} placed a $${amount} ${label} bet.`)
      return
    }

    const nextAdditionalAmount = (activeBet?.additionalAmount ?? 0) + amount

    setPlayers((currentPlayers) => currentPlayers.map((player) => (
      player.playerNumber === game.currentPlayer
        ? {
            ...player,
            bankroll: player.bankroll - amount,
            activeBet: {
              amount: (activeBet?.amount ?? 0) + amount,
              baseAmount: activeBet?.baseAmount ?? 0,
              additionalAmount: nextAdditionalAmount,
              placedAtRollId: activeBet?.placedAtRollId ?? game.lastRollId
            },
            currentBets: [
              ...player.currentBets.filter(
                (bet) => bet.label !== 'Pass Line' && bet.label !== 'Additional Pass Line'
              ),
              ...(activeBet?.baseAmount
                ? [{ label: 'Pass Line', amount: activeBet.baseAmount }]
                : []),
              { label: 'Additional Pass Line', amount: nextAdditionalAmount }
            ]
          }
        : player
    )))
    setLastBet({ type, amount, playerNumber: game.currentPlayer })
    setBetStatus(`Player ${game.currentPlayer} added $${amount} to the Pass Line wager.`)
  }

  function undoBet() {
    const activePlayer = players.find((player) => player.playerNumber === game.currentPlayer)

    if (
      lastBet?.playerNumber === game.currentPlayer &&
      lastBet.type !== 'Pass Line' &&
      activePlayer?.sideBets.at(-1)?.placedAtRollId === game.lastRollId
    ) {
      const lastSideBet = activePlayer.sideBets.at(-1)
      setPlayers((currentPlayers) => currentPlayers.map((player) => {
        if (player.playerNumber !== game.currentPlayer) {
          return player
        }

        const betIndex = player.currentBets.findIndex(
          (bet) => bet.label === lastSideBet.label && bet.amount === lastSideBet.amount
        )

        return {
          ...player,
          bankroll: player.bankroll + lastSideBet.amount,
          sideBets: player.sideBets.slice(0, -1),
          currentBets: player.currentBets.filter((_, index) => index !== betIndex)
        }
      }))
      setLastBet(null)
      setBetStatus(`${lastSideBet.label} bet returned to the bankroll.`)
      return
    }

    if (
      !activePlayer?.activeBet ||
      activePlayer.activeBet.placedAtRollId !== game.lastRollId ||
      game.phase !== 'come-out' ||
      !activePlayer.activeBet.additionalAmount ||
      lastBet?.playerNumber !== game.currentPlayer ||
      lastBet.type !== 'Pass Line'
    ) {
      setBetStatus('There is no additional bet to undo.')
      return
    }

    setPlayers((currentPlayers) => currentPlayers.map((player) => {
      if (player.playerNumber !== game.currentPlayer) {
        return player
      }

      const additionalAmount = player.activeBet.additionalAmount
      const baseAmount = player.activeBet.baseAmount

      return {
        ...player,
        bankroll: player.bankroll + additionalAmount,
        activeBet: baseAmount
          ? { ...player.activeBet, amount: baseAmount, additionalAmount: 0 }
          : null,
        currentBets: [
          ...(baseAmount ? [{ label: 'Pass Line', amount: baseAmount }] : []),
          ...player.currentBets.filter(
            (bet) => !['Pass Line', 'Additional Pass Line'].includes(bet.label)
          )
        ]
      }
    }))
    setLastBet(null)
    setBetStatus('Additional Pass Line bet returned to the bankroll.')
  }

  function changeStartingBankroll(event) {
    const amount = Number(event.target.value)
    setStartingBankroll(amount)
    setPlayers((currentPlayers) => currentPlayers.map((player) => ({
      ...player,
      bankroll: amount,
      activeBet: null,
      currentBets: [],
      sideBets: []
    })))
    setLastBet(null)
    setBetStatus(`Both players' bankrolls reset to $${amount.toLocaleString()}; active bets cleared.`)
  }

  function updateCharacter(playerNumber, character) {
    setPlayers((currentPlayers) => currentPlayers.map((player) => (
      player.playerNumber === playerNumber ? { ...player, character } : player
    )))
  }

  return (
    <main className="app-shell" aria-label="Street Craps game">
      <GameHeader
        currentPlayer={game.currentPlayer}
        players={players}
        onCharacterChange={updateCharacter}
      />
      <div className="game-panels">
        <RollHistoryPanel rolls={game.history} />
        <div className="table-area">
          <DiceRollPanel
            currentPlayer={game.currentPlayer}
            turnColor={characterAccents[
              players.find((player) => player.playerNumber === game.currentPlayer)?.character
            ] || characterAccents.orange}
          />
          <GameBoard point={game.point} />
        </div>
        <OutComePanel
          phase={game.phase}
          point={game.point}
          lastOutcome={game.lastOutcome}
          selectedBet={selectedBet}
          onBetSelect={setSelectedBet}
        />
      </div>
      <BottomPanel
        selectedAmount={selectedAmount}
        onAmountChange={setSelectedAmount}
        startingBankroll={startingBankroll}
        onStartingBankrollChange={changeStartingBankroll}
        availableBalance={players.find((player) => player.playerNumber === game.currentPlayer)?.bankroll ?? 0}
        betStatus={betStatus}
        onPlaceBet={() => placeBet(selectedBet)}
        onUndoBet={undoBet}
        onRepeatBet={() => lastBet && placeBet(lastBet.type, lastBet.amount)}
        canRepeatBet={lastBet !== null}
      />
    </main>
  )
}

export default App
