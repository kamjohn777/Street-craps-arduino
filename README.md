# Street Craps

Street Craps is a small web-and-hardware project for recording physical dice
rolls and displaying them in a browser. The intended setup is an Arduino that
reads two dice, a Node.js server that validates and distributes each roll, and
a React client that displays the game.

> **Implementation status:** The Arduino sketch detects a shake and submits a
> generated dice roll over Wi-Fi. The backend validates and broadcasts rolls,
> and the dice panel connects to the server, animates Arduino shakes, and shows
> the accepted faces. Other game panels still use example data. See
> [CRAPS_RULES.md](./CRAPS_RULES.md) for the fuller rules and project status.

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

React + Vite client (dice panel connected; other panels use sample data)
```

The intended data flow is:

1. The Arduino detects a new shake and determines the values of two dice.
2. It sends `die1`, `die2`, and their `total` to the backend using HTTP.
3. The server checks that both dice are integers from 1 through 6 and that
   `total` equals their sum.
4. For a valid Arduino roll, the server emits `dice-shake` to start the panel
   animation, then publishes the accepted `dice-roll` after 900 ms.
5. The server assigns an increasing ID, records the roll in memory, and
   responds to the Arduino. The browser updates the dice faces from the live
   event; it also fetches the latest roll when it starts.

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
- The dice roll panel uses live Socket.IO events and fetches the latest roll
  when it connects. Other panels still use sample data.

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

### Socket.IO events

- **Server to clients — `dice-shake`:** emitted when a valid Arduino roll is
  received, with `{ "duration": 900 }` to set the animation length.
- **Server to clients — `dice-roll`:** emitted to all connected sockets for
  every accepted Arduino or phone roll. The payload has the same roll fields as
  the successful response, without `success`; `source` is `"arduino"` or
  `"phone"`.
- **Client to server — `phone-roll`:** accepted with `{ "die1": 4, "die2": 2,
  "total": 6 }`. Invalid values cause the server to emit `roll-error` back to
  the submitting socket.

The dice panel fetches the latest roll when it loads and listens for both
`dice-shake` and `dice-roll` events. The server does not automatically send the
latest roll on Socket.IO connection.

## Game rules

The detailed rules and planned gameplay features are in
[CRAPS_RULES.md](./CRAPS_RULES.md). The current server handles dice-roll
validation and delivery only; craps game-state and betting logic remain future
work.