const dgram = require('dgram');
const HID = require('node-hid');

const client = dgram.createSocket('udp4');
const ESP32_IP = '192.168.0.103'; // Replace with your ESP32 IP
const ESP32_PORT = 4210;
const requestInterval = 200;

let lastRequestTime = 0;
let speed = 0;
let direction = 0;
let servoAngle = 0; // Initialize servo angle to a neutral position (90 degrees)
const servoStep = 0.5; // The amount to increment/decrement the servo angle

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

  // Process D-pad data for servo control
  if (dpad === 0x1C) { // Left
    servoAngle = Math.max(0, servoAngle - servoStep); // Decrease angle, ensuring it doesn't go below 0
  } else if (dpad === 0x0C) { // Right
    servoAngle = Math.min(180, servoAngle + servoStep); // Increase angle, ensuring it doesn't go above 180
  }

 
  // Send motor control to ESP32
  sendMotorControlToESP32(speed, -direction, Math.round(servoAngle));
});

function sendMotorControlToESP32(speed, direction, servoAngle) {
  const currentTime = Date.now();
  if (currentTime - lastRequestTime < requestInterval) {
    console.log('Request throttled' + " speed: " + speed + " direction: " + direction + " servoAngle: " + servoAngle)
    return;
  }
  lastRequestTime = currentTime;

  const message = `${speed},${direction},${servoAngle}`;
  client.send(message, ESP32_PORT, ESP32_IP, err => {
    if (err) {
      console.error('UDP message send error:', err);
    }
  });
}
