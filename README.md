# Street Craps Arduino

A project for rolling dice with an Arduino and displaying each result in a browser. The intended USB setup uses a Node.js server as the bridge between the Arduino and the browser.

## How the parts work together

Each part has a separate job:

- **Arduino code** detects a shake, generates or reads a dice result, and sends that result out.
- **SerialPort** is a Node.js library that lets the server read data sent over the Arduino's USB serial connection.
- **Express** runs the Node.js web server and can provide HTTP routes or serve the browser app.
- **Socket.IO** keeps a live connection between the server and browser, so the server can push a new result as soon as it arrives.
- **Browser code** listens for the result and updates the displayed dice.

With USB, the data flow is:

```text
Shake Arduino
	-> Arduino sends a dice result over USB serial
	-> Node server reads it with SerialPort
	-> Server emits the result with Socket.IO
	-> Browser updates the dice display
```

SerialPort and Socket.IO are not alternatives in this setup. SerialPort is for **Arduino-to-server** communication; Socket.IO is for **server-to-browser** communication.

## USB or Wi-Fi

### USB serial

Use this when the Arduino is connected to the computer running the Node.js server with a USB **data** cable. The cable must support data, not only charging. The server needs the correct serial port (for example, `COM3` on Windows) and baud rate, which must match the Arduino sketch.

```text
Arduino --USB serial--> Node server --Socket.IO--> Browser
```

### Wi-Fi or another network connection

Use this when the Arduino can communicate over a network and you want to avoid a USB data connection. The Arduino still needs code that sends each dice result to the server using a protocol the server supports, such as HTTP or WebSocket. Being powered on or connected to Wi-Fi alone does not send results. The server can then forward received results to the browser with Socket.IO.

```text
Arduino --network message--> Node server --Socket.IO--> Browser
```

In this network setup, SerialPort is not needed. Socket.IO remains useful for live browser updates. The Arduino does not have to speak Socket.IO directly; it can send data to a server endpoint, and the server can emit Socket.IO events to the browser.

## Data format

The Arduino and server need to agree on the message format. The server expects one two-dice total per line, as decimal digits from `2` through `12`. For example:

```text
7
```

Send a line ending after each result (`Serial.println(roll)` in Arduino code works). The server accepts LF and CRLF line endings, and ignores malformed or out-of-range values. It broadcasts each valid result as a Socket.IO `newDiceRoll` event with the payload `{ roll: 7 }`. The Arduino should send a result when a roll is ready, rather than continuously sending sensor readings.

## Project setup

Node.js and npm are required. Install the current dependencies with:

```bash
npm install
```

Express, CORS, SerialPort, the readline parser, and Socket.IO are project dependencies. Install them from the project manifest with:

```bash
npm install
```

If the browser is served by this same Socket.IO server, the Socket.IO browser client can be loaded from that server. If the browser app is hosted separately, it will need the matching `socket.io-client` package:

```bash
npm install socket.io-client
```

`Server.js` reads serial settings from environment variables. It defaults to `COM4` and `9600` baud; set these to match your Arduino and sketch. For example, in PowerShell:

```powershell
$env:ARDUINO_PORT = "COM3"
$env:ARDUINO_BAUD_RATE = "9600"
node Server.js
```

On macOS or Linux, a serial path may look like `/dev/ttyUSB0` or `/dev/tty.usbmodem...`.

## Running and connecting

Once the server is implemented, the typical workflow will be:

1. Connect the Arduino with a USB data cable and upload the Arduino sketch.
2. Find the Arduino's serial port in the operating system's device list.
3. Set `ARDUINO_PORT` and `ARDUINO_BAUD_RATE` to match the port and baud rate used by the sketch.
4. Start the Node.js server and open the browser app at the address it serves or connects to.
5. Shake the Arduino and confirm that one valid dice result reaches the browser for each roll.

Keep the Arduino and server serial baud rates identical. Only one program can normally own a serial port at a time, so close the Arduino IDE Serial Monitor or other serial tools before starting the server.

## Current status

- Express, CORS, SerialPort, the readline parser, and Socket.IO are installed.
- `Server.js` reads newline-delimited serial results and broadcasts valid totals over Socket.IO.
- The Arduino sketch must send one total from `2` through `12` per line.
- The browser dice display still needs to connect to the Socket.IO event and render the result.