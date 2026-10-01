const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

let latestRoll = null;
let rollId = 0;

function publishRoll(value, source) {
  const rollValue = typeof value === 'string' && /^\d+$/.test(value.trim())
    ? Number(value.trim())
    : value;

  if (!Number.isInteger(rollValue) || rollValue < 2 || rollValue > 12) {
    return null;
  }

  latestRoll = {
    id: ++rollId,
    roll: rollValue,
    source
  };

  io.emit('dice-roll', latestRoll);
  return latestRoll;
}

app.get('/', (req, res) => {
  res.send('Street Craps server is running!');
});

app.post('/api/roll', (req, res) => {
  const result = publishRoll(req.body?.roll, 'arduino');

  if (!result) {
    return res.status(400).json({
      success: false,
      error: 'Roll must be a whole-number dice total from 2 to 12.'
    });
  }

  console.log('[Arduino] Roll received:', result.roll);
  res.json({ success: true, ...result });
});

app.get('/api/roll/latest', (req, res) => {
  res.json(latestRoll);
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('phone-roll', (value) => {
    const result = publishRoll(value, 'phone');

    if (!result) {
      socket.emit('roll-error', 'Roll must be a whole-number dice total from 2 to 12.');
      return;
    }

    console.log('[Phone] Roll received:', result.roll);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Street Craps server listening on port ${PORT}`);
  console.log('Send Arduino rolls to POST /api/roll as JSON: { "roll": 7 }');
});