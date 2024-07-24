const mqtt = require('mqtt');
const HID = require('node-hid');
const fs = require('fs');

const mqttBrokerIP = '192.168.0.104';
const options = {
  host: mqttBrokerIP,
  port: 8883,
  protocol: 'mqtts',
  rejectUnauthorized: false, // This should be set to true in production with a valid certificate
  ca: fs.readFileSync('C:/Users/eddev/Desktop/ca.crt'), // Path to your CA certificate
  username: 'mBaarar',
  password: 'MB001'
};

const client = mqtt.connect(options); // Connect to Mosquitto broker with SSL/TLS
const requestInterval = 200;

let lastRequestTime = 0;
let speed = 0;
let direction = 0;

const devices = HID.devices().filter(
  device => device.vendorId === 0x146b && device.productId === 0x0603
);

const deviceInfo = devices[0];
const device = new HID.HID(deviceInfo.path);

device.on('data', (data) => {
  const [unused, unused1, leftStickX, leftStickY, rightStickX, rightStickY, , , , , , dpad] = data;

  // Process joystick data for speed and direction
  speed = Math.round(leftStickY);
  direction = Math.round(rightStickY);

  speed = Math.round((speed - 127.5) * 2);
  if (direction < 85) {
    direction = -1; // Left
  } else if (direction < 170) {
    direction = 0; // Center
  } else {
    direction = 1; // Right
  }

  // Send motor control to ESP32
  sendMotorControlToESP32(speed, -direction);
});

function sendMotorControlToESP32(speed, direction) {
  const currentTime = Date.now();
  if (currentTime - lastRequestTime < requestInterval) {
    console.log('Request throttled' + " speed: " + speed + " direction: " + direction);
    return;
  }
  lastRequestTime = currentTime;

  const message = JSON.stringify({ speed, direction });
  client.publish('rc/car/control', message);
}

client.on('connect', () => {
  console.log('Connected to MQTT broker');
});

client.on('error', (err) => {
  console.error('MQTT connection error:', err);
});
