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

// Unique ID for every roll
let rollId = 0;


// ========================================
// PUBLISH DICE ROLL
// ========================================

function publishRoll(
  die1,
  die2,
  total,
  source
) {

  // ----------------------------------------
  // Make sure all values are integers
  // ----------------------------------------

  if (
    !Number.isInteger(die1) ||
    !Number.isInteger(die2) ||
    !Number.isInteger(total)
  ) {

    return null;
  }


  // ----------------------------------------
  // Make sure each die is between 1 and 6
  // ----------------------------------------

  if (
    die1 < 1 ||
    die1 > 6 ||
    die2 < 1 ||
    die2 > 6
  ) {

    return null;
  }


  // ----------------------------------------
  // Make sure total is actually correct
  // ----------------------------------------

  if (total !== die1 + die2) {

    return null;
  }


  // ----------------------------------------
  // Create roll object
  // ----------------------------------------

  latestRoll = {

    id: ++rollId,

    die1,

    die2,

    total,

    source

  };


  // ----------------------------------------
  // Send roll to connected browsers
  // ----------------------------------------

  io.emit(
    'dice-roll',
    latestRoll
  );


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
  } = req.body;


  // ----------------------------------------
  // Convert values to numbers
  // ----------------------------------------

  const result = publishRoll(

    Number(die1),

    Number(die2),

    Number(total),

    'arduino'

  );


  // ----------------------------------------
  // Reject invalid roll
  // ----------------------------------------

  if (!result) {

    return res.status(400).json({

      success: false,

      error: 'Invalid dice roll.'

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

});


// ========================================
// GET MOST RECENT ROLL
// ========================================

app.get('/api/roll/latest', (req, res) => {

  res.json(latestRoll);

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