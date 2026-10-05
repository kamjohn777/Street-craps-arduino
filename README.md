# Street Craps

Street Craps is a small web-and-hardware project for recording physical dice
rolls and displaying them in a browser. The intended setup is an Arduino that
reads two dice, a Node.js server that validates and distributes each roll, and
a React client that displays the game.

> **Implementation status:** The Arduino sketch detects a shake and submits a
> generated dice roll over Wi-Fi. The backend validates and broadcasts rolls,
> tracks the Come-Out/Point phases and two-player shooter rotation, and keeps
> player-attributed roll history in memory. The frontend displays the live
> shooter, point, roll history, and dice. Betting settlement is not implemented.
> See [CRAPS_RULES.md](./CRAPS_RULES.md) for the fuller rules and project status.

## How the pieces fit together

```text
Arduino
  detects a shake and generates die1 and die2
  POSTs a roll over Wi-Fi
          |
          v
Node.js + Express server
  validates the roll and keeps the latest roll in memory
          |
          +---- Socket.IO "dice-shake", then "dice-roll" ----> Dice panel
          |
          +---- HTTP response ------------------> Arduino

React + Vite client (live dice, game state, and roll history)
```

The intended data flow is:

1. The Arduino detects a new shake and determines the values of two dice.
2. It sends `die1`, `die2`, and their `total` to the backend using HTTP.
3. The server checks that both dice are integers from 1 through 6 and that
   `total` equals their sum.
4. The server attributes the roll to the current shooter and applies the
   Come-Out/Point rules. An Arduino roll also emits `dice-shake` before the
   accepted roll is published.
5. The server records the outcome, point, and shooter in roll history, then
   broadcasts the new game state. The browser updates the dice, shooter,
   point, and history; it fetches the current game state when it starts.

Game state and history are held in memory and reset when the server restarts.
Bet placement and bankroll settlement are not implemented.

## Repository layout

```text
.
├── Server.js                 Express API and Socket.IO server
├── CRAPS_RULES.md            Craps rules, planned features, and project status
├── package.json              Backend dependencies
└── Client/
    ├── package.json          React/Vite dependencies and scripts
    ├── index.html             Vite HTML entry point
    └── src/
        ├── App.jsx            Main game-screen composition
        ├── main.jsx           React entry point
        └── components/        Game header and display panels
```

The Arduino firmware is in the root-level `arduino-street-craps.ino` sketch.

## Technology and package roles

### Backend (`Server.js`)

- **Node.js** runs the backend JavaScript.
- **Express** provides the HTTP routes for submitting and retrieving rolls.
- **Socket.IO** broadcasts accepted rolls to connected clients in real time.
- **cors** allows cross-origin browser requests during development.
- **serialport** and **@serialport/parser-readline** are installed backend
  dependencies, but are not used by the current server. The current Arduino
  integration path is a network HTTP request, not a USB serial connection.

### Frontend (`Client/`)

- **React** builds the browser interface from components.
- **Vite** runs the development server and builds the static frontend.
- The dice roll panel uses live Socket.IO events. The game tracks Come-Out and
  Point phases, rotates the shooter between two players after a Seven-Out, and
  displays in-memory roll history attributed to the shooter for each roll.
- Bet selection is visual only; bets and bankrolls are not settled.

### Arduino

The sketch detects a shake, generates two die values, and submits them to the
backend over Wi-Fi. Configure the network credentials and server address in the
sketch before uploading it to the board.

## Getting started

Install and run the backend from the repository root:

```bash
npm install
node Server.js
```

By default, the server listens on port `3000` on all network interfaces. Set
`PORT` to use a different port:

```powershell
$env:PORT = "3001"
node Server.js
```

Run the frontend in a second terminal:

```bash
cd Client
npm install
npm run dev
```

Vite prints the local URL to open in a browser (usually
`http://localhost:5173`). The dice panel connects to the backend at port `3000`
on the browser's current hostname by default. Set `VITE_SERVER_URL` before
starting Vite if the backend is hosted at another URL.

To create and lint a production frontend build:

```bash
cd Client
npm run build
npm run lint
```

## Backend roll interface

### Submit a roll

Send an HTTP `POST` request to `/api/roll` with a JSON body:

```http
POST /api/roll
Content-Type: application/json

{"die1":4,"die2":2,"total":6}
```

For an Arduino on the same network as the server, use the server computer's LAN
IP address instead of `localhost`, for example
`http://192.168.1.20:3000/api/roll`. The computer and Arduino need network
connectivity to each other, and the computer's firewall may need to allow the
server port.

A successful response includes the accepted roll:

```json
{
  "success": true,
  "id": 1,
  "die1": 4,
  "die2": 2,
  "total": 6,
  "source": "arduino"
}
```

Each die must be an integer from `1` to `6`; `total` must be the sum of the two
dice. Invalid input receives HTTP `400` with:

```json
{
  "success": false,
  "error": "Invalid dice roll."
}
```

### Read the most recent roll

`GET /api/roll/latest` returns the most recently accepted roll, or `null` if no
roll has been accepted since the server started. Rolls are currently held in
memory and are lost when the server restarts.

### Read game state and roll history

`GET /api/game` returns the current shooter, phase, point, last outcome, and all
rolls recorded since the server started. Each history item includes the player
who rolled it, the phase and point before the roll, dice, outcome, and timestamp.

### Socket.IO events

- **Server to clients — `dice-shake`:** emitted when a valid Arduino roll is
  received, with `{ "duration": 900 }` to set the animation length.
- **Server to clients — `dice-roll`:** emitted to all connected sockets for
  every accepted Arduino or phone roll. Along with the roll fields, it includes
  the assigned `player`, the roll `phase`, `point`, `outcome`, `createdAt`, and
  the updated `gameState`.
- **Client to server — `phone-roll`:** accepted with `{ "die1": 4, "die2": 2,
  "total": 6 }`. Invalid values cause the server to emit `roll-error` back to
  the submitting socket.

The client fetches `/api/game` on startup and listens for live `dice-roll`
events. The server does not automatically send the latest state on Socket.IO
connection.

## Game rules

The detailed rules and planned gameplay features are in
[CRAPS_RULES.md](./CRAPS_RULES.md). The server implements Come-Out/Point
resolution and two-player shooter rotation; bets and payouts remain future work.