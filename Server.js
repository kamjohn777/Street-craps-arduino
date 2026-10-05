const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');


// ========================================
// EXPRESS SETUP
// ========================================

const app = express();

const PORT = Number(process.env.PORT || 3000);


// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());

app.use(express.json());


// ========================================
// HTTP SERVER
// ========================================

const server = http.createServer(app);


// ========================================
// SOCKET.IO
// ========================================

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});


// ========================================
// GAME DATA
// ========================================

// Most recent dice roll
let latestRoll = null;

const rollHistory = [];

const gameState = {
  currentPlayer: 1,
  phase: 'come-out',
  point: null,
  lastOutcome: 'Waiting for the first roll.',
  lastRollId: 0
};

// Unique ID for every roll
let rollId = 0;

const DICE_SHAKE_DURATION_MS = 900;


function isValidRoll(die1, die2, total) {

  return (
    Number.isInteger(die1) &&
    Number.isInteger(die2) &&
    Number.isInteger(total) &&
    die1 >= 1 &&
    die1 <= 6 &&
    die2 >= 1 &&
    die2 <= 6 &&
    total === die1 + die2
  );
}


// ========================================
// PUBLISH DICE ROLL
// ========================================

function publishRoll(
  die1,
  die2,
  total,
  source
) {

  if (!isValidRoll(die1, die2, total)) {

    return null;
  }

  const player = gameState.currentPlayer;
  const phase = gameState.phase;
  const point = gameState.point;
  let outcome;

  if (phase === 'come-out') {

    if (total === 7 || total === 11) {

      outcome = 'Natural — Pass Line wins.';

    } else if (total === 2 || total === 3) {

      outcome = 'Craps — Pass Line loses.';

    } else if (total === 12) {

      outcome = "Craps — Pass Line loses; Don't Pass pushes.";

    } else {

      gameState.point = total;
      gameState.phase = 'point';
      outcome = `Point established: ${total}.`;

    }

  } else if (total === point) {

    gameState.point = null;
    gameState.phase = 'come-out';
    outcome = `Point ${point} made — Pass Line wins.`;

  } else if (total === 7) {

    gameState.currentPlayer = player === 1 ? 2 : 1;
    gameState.point = null;
    gameState.phase = 'come-out';
    outcome = `Seven-out — Player ${player}'s turn ends.`;

  } else {

    outcome = `No decision — point is ${point}.`;

  }

  // ----------------------------------------
  // Create roll object
  // ----------------------------------------

  latestRoll = {

    id: ++rollId,

    die1,

    die2,

    total,

    source,

    player,

    phase,

    point,

    outcome,

    createdAt: new Date().toISOString()

  };

  gameState.lastOutcome = outcome;
  gameState.lastRollId = latestRoll.id;
  rollHistory.push(latestRoll);


  // ----------------------------------------
  // Send roll to connected browsers
  // ----------------------------------------

  io.emit('dice-roll', {
    ...latestRoll,
    gameState: { ...gameState }
  });


  // ----------------------------------------
  // Return roll
  // ----------------------------------------

  return latestRoll;
}


// ========================================
// HOME ROUTE
// ========================================

app.get('/', (req, res) => {

  res.send(
    'Street Craps server is running!'
  );

});


// ========================================
// ARDUINO DICE ROLL
// ========================================

app.post('/api/roll', (req, res) => {

  // ----------------------------------------
  // Get dice data from Arduino
  // ----------------------------------------

  const {
    die1,
    die2,
    total
  } = req.body || {};


  // ----------------------------------------
  // Convert values to numbers
  // ----------------------------------------

  const die1Value = Number(die1);
  const die2Value = Number(die2);
  const totalValue = Number(total);


  // ----------------------------------------
  // Reject invalid roll
  // ----------------------------------------

  if (!isValidRoll(die1Value, die2Value, totalValue)) {

    return res.status(400).json({

      success: false,

      error: 'Invalid dice roll.'

    });

  }

  io.emit('dice-shake', {
    duration: DICE_SHAKE_DURATION_MS
  });

  setTimeout(() => {

    const result = publishRoll(
      die1Value,
      die2Value,
      totalValue,
      'arduino'
    );

    if (!result) {

      return res.status(500).json({

        success: false,

        error: 'Unable to publish dice roll.'

      });
    }

    // ----------------------------------------
    // Log roll
    // ----------------------------------------

    console.log(
      `[Arduino] Dice received: ${result.die1} + ${result.die2} = ${result.total}`
    );


    // ----------------------------------------
    // Send response to Arduino
    // ----------------------------------------

    res.json({

      success: true,

      ...result

    });

  }, DICE_SHAKE_DURATION_MS);

});


// ========================================
// GET MOST RECENT ROLL
// ========================================

app.get('/api/roll/latest', (req, res) => {

  res.json(latestRoll);

});

// ========================================
// GET GAME STATE AND ROLL HISTORY
// ========================================

app.get('/api/game', (req, res) => {

  res.json({
    ...gameState,
    history: rollHistory
  });

});


// ========================================
// SOCKET.IO CONNECTION
// ========================================

io.on('connection', (socket) => {

  console.log(
    `[Socket] Client connected: ${socket.id}`
  );


  // ----------------------------------------
  // Phone dice roll
  // ----------------------------------------

  socket.on('phone-roll', (data) => {

    // We will update the phone controller
    // later to send two dice.
    //
    // For now this expects:
    //
    // {
    //   die1: 4,
    //   die2: 2,
    //   total: 6
    // }

    const result = publishRoll(

      Number(data?.die1),

      Number(data?.die2),

      Number(data?.total),

      'phone'

    );


    if (!result) {

      socket.emit(
        'roll-error',
        'Invalid dice roll.'
      );

      return;
    }


    console.log(
      `[Phone] Dice received: ${result.die1} + ${result.die2} = ${result.total}`
    );

  });


  // ----------------------------------------
  // Browser disconnected
  // ----------------------------------------

  socket.on('disconnect', () => {

    console.log(
      `[Socket] Client disconnected: ${socket.id}`
    );

  });

});


// ========================================
// START SERVER
// ========================================

server.listen(
  PORT,
  '0.0.0.0',
  () => {

    console.log(
      `Street Craps server listening on port ${PORT}`
    );

    console.log(
      `Arduino endpoint: POST /api/roll`
    );

    console.log(
      'Expected JSON: { "die1": 4, "die2": 2, "total": 6 }'
    );

  }
);