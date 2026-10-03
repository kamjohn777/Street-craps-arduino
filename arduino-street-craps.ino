#include "WiFiS3.h"
// #include "arduino_secrets.h"

// ========================================
// WIFI SETTINGS
// ========================================
// Put your Wi-Fi network name (SSID) and password in the quotes below.
char ssid[] = "";
char pass[] = "";

int status = WL_IDLE_STATUS;


// ========================================
// SERVER SETTINGS
// ========================================

// Your computer's local IPv4 address.
// Example:
// const char server[] = "192.168.1.25";

const char server[] = "";

const int serverPort = 3000;

WiFiClient client;


// ========================================
// SENSOR SETTINGS
// ========================================

const int SENSOR_PIN = 2;

int previousState = LOW;
int shakeCount = 0;


// ========================================
// DICE
// ========================================

int die1;
int die2;
int total;


// ========================================
// SETUP
// ========================================

void setup() {

  // ----------------------------------------
  // Start Serial Monitor
  // ----------------------------------------

  Serial.begin(9600);

  while (!Serial) {
    ;
  }

  Serial.println();
  Serial.println("================================");
  Serial.println("       STREET CRAPS DICE");
  Serial.println("================================");


  // ----------------------------------------
  // Initialize shake sensor
  // ----------------------------------------

  pinMode(SENSOR_PIN, INPUT);

  Serial.println("Shake sensor initialized.");


  // ----------------------------------------
  // Check Wi-Fi module
  // ----------------------------------------

  if (WiFi.status() == WL_NO_MODULE) {

    Serial.println("WiFi module not detected!");

    while (true) {
      ;
    }
  }

  Serial.println("WiFi module detected.");


  // ----------------------------------------
  // Connect to Wi-Fi
  // ----------------------------------------

  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(ssid);

  while (status != WL_CONNECTED) {

    status = WiFi.begin(ssid, pass);

    Serial.println("Attempting Wi-Fi connection...");

    delay(5000);
  }

  Serial.println();
  Serial.println("Connected to Wi-Fi!");

  printCurrentNet();


  // ----------------------------------------
  // Seed random number generator
  // ----------------------------------------

  randomSeed(analogRead(A0));

  Serial.println();
  Serial.println("Random number generator ready.");
  Serial.println("DICE READY!");
  Serial.println();
}


// ========================================
// LOOP
// ========================================

void loop() {

  // Read the current sensor state
  int currentState = digitalRead(SENSOR_PIN);


  // ----------------------------------------
  // Detect NEW shake
  // ----------------------------------------

  if (
    currentState == HIGH &&
    previousState == LOW
  ) {

    shakeCount++;

    Serial.println();
    Serial.println("================================");

    Serial.print("SHAKE #");
    Serial.println(shakeCount);


    // ----------------------------------------
    // Roll first die
    // ----------------------------------------

    die1 = random(1, 7);


    // ----------------------------------------
    // Roll second die
    // ----------------------------------------

    die2 = random(1, 7);


    // ----------------------------------------
    // Calculate total
    // ----------------------------------------

    total = die1 + die2;


    // ----------------------------------------
    // Display dice results
    // ----------------------------------------

    Serial.print("DIE 1: ");
    Serial.println(die1);

    Serial.print("DIE 2: ");
    Serial.println(die2);

    Serial.print("TOTAL: ");
    Serial.println(total);


    // ----------------------------------------
    // Send roll to Node server
    // ----------------------------------------

    sendRollToServer(
      die1,
      die2,
      total
    );

    Serial.println("================================");
  }


  // ----------------------------------------
  // Remember current sensor state
  // ----------------------------------------

  previousState = currentState;


  // ----------------------------------------
  // Small delay
  // ----------------------------------------

  delay(5);
}


// ========================================
// SEND DICE ROLL TO EXPRESS SERVER
// ========================================

void sendRollToServer(
  int die1Value,
  int die2Value,
  int totalValue
) {

  Serial.println("Sending dice roll to server...");


  // ----------------------------------------
  // Connect to Node / Express
  // ----------------------------------------

  if (client.connect(server, serverPort)) {

    Serial.println("Connected to server!");


    // ----------------------------------------
    // Create JSON data
    // ----------------------------------------

    String jsonData = "{";

    jsonData += "\"die1\":";
    jsonData += die1Value;

    jsonData += ",\"die2\":";
    jsonData += die2Value;

    jsonData += ",\"total\":";
    jsonData += totalValue;

    jsonData += "}";


    // Example:
    //
    // {"die1":4,"die2":2,"total":6}


    // ----------------------------------------
    // Send HTTP POST request
    // ----------------------------------------

    client.println("POST /api/roll HTTP/1.1");

    client.print("Host: ");
    client.println(server);

    client.println("Content-Type: application/json");

    client.print("Content-Length: ");
    client.println(jsonData.length());

    // This tells Node that this HTTP
    // connection can close after the response.
    client.println("Connection: close");

    // Blank line separates HTTP headers
    // from the JSON body.
    client.println();

    // Send JSON body
    client.println(jsonData);


    // ----------------------------------------
    // Wait for server response
    // ----------------------------------------

    unsigned long timeout = millis();

    while (client.available() == 0) {

      if (millis() - timeout > 5000) {

        Serial.println("Server response timeout.");

        client.stop();

        return;
      }
    }


    // ----------------------------------------
    // Print server response
    // ----------------------------------------

    Serial.println("Server response:");

    while (client.available()) {

      String line = client.readStringUntil('\r');

      Serial.println(line);
    }


    // ----------------------------------------
    // Close HTTP connection
    // ----------------------------------------

    client.stop();

    Serial.println("Dice roll sent successfully!");
  }

  else {

    Serial.println("Connection to server failed!");

  }
}


// ========================================
// PRINT NETWORK INFORMATION
// ========================================

void printCurrentNet() {

  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());


  long rssi = WiFi.RSSI();

  Serial.print("Signal strength (RSSI): ");
  Serial.println(rssi);


  IPAddress ip = WiFi.localIP();

  Serial.print("Arduino IP Address: ");
  Serial.println(ip);
}