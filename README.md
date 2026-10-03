# Street Craps

Street Craps is a small web-and-hardware project for recording physical dice
rolls and displaying them in a browser. The intended setup is an Arduino that
reads two dice, a Node.js server that validates and distributes each roll, and
a React client that displays the game.

> **Implementation status:** The backend roll API and Socket.IO broadcast are
> implemented. The React app currently shows a static UI with example data; it
> is not connected to the server yet. There is no Arduino sketch in this
> repository yet, and the server does not currently read a serial port. See
> [CRAPS_RULES.md](./CRAPS_RULES.md) for the fuller rules and project status.

## How the pieces fit together

```text
Arduino (planned)
  reads / determines die1 and die2
  POSTs a roll over Wi-Fi
          |
          v
Node.js + Express server
  validates the roll and keeps the latest roll in memory
          |
          +---- Socket.IO "dice-roll" event ----> Browser clients (planned)
          |
          +---- HTTP response ------------------> Arduino

React + Vite client (current UI is static and not yet connected)
```

The intended data flow is:

1. The Arduino determines the values of two dice.
2. It sends `die1`, `die2`, and their `total` to the backend using HTTP.
3. The server checks that both dice are integers from 1 through 6 and that
   `total` equals their sum.
4. For a valid roll, the server assigns an increasing ID, records it as the
   latest roll in memory, and emits a `dice-roll` event to connected Socket.IO
   clients.
5. The server responds to the HTTP request with the accepted roll. A future
   connected frontend can use the Socket.IO event to update its display live.

The server currently distributes dice results only. It does not yet calculate
craps outcomes, manage a point, process bets, or persist rolls across restarts.

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

Arduino firmware is not included yet. When it is added, it can live in an
`Arduino/` directory (for example, as an Arduino IDE `.ino` sketch).

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
- The current panels use sample dice rolls and player data. The client does not
  yet install `socket.io-client` or fetch roll data from the backend.

### Arduino (planned)

The intended Arduino responsibility is to read or determine the two die values
and submit them to the backend over a network connection. The Arduino code must
provide its own connectivity and HTTP request logic; no board, sensor, wiring,
or firmware behavior is specified by the current repository.

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
`http://localhost:5173`). The frontend is currently a visual prototype and will
not display live backend rolls yet.

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

### Socket.IO events

- **Server to clients — `dice-roll`:** emitted to all connected sockets for
  every accepted Arduino or phone roll. The payload has the same roll fields as
  the successful response, without `success`; `source` is `"arduino"` or
  `"phone"`.
- **Client to server — `phone-roll`:** accepted with `{ "die1": 4, "die2": 2,
  "total": 6 }`. Invalid values cause the server to emit `roll-error` back to
  the submitting socket.

The server does not currently send the latest roll automatically when a
Socket.IO client connects. The React app is not yet listening to these events.

## Game rules

The detailed rules and planned gameplay features are in
[CRAPS_RULES.md](./CRAPS_RULES.md). The current server handles dice-roll
validation and delivery only; craps game-state and betting logic remain future
work.