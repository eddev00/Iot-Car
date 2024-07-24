const WebSocket = require('ws');
const HID = require('node-hid');

const ESP32_IP = '192.168.0.106'; // Replace with your ESP32 IP
const ESP32_PORT = 81;

const ws = new WebSocket(`ws://${ESP32_IP}:${ESP32_PORT}`);

let speed = 0;
let direction = 0;

let device;

try {
  const devices = HID.devices().filter(
    device => device.vendorId === 0x146b && device.productId === 0x0603
  );

  if (devices.length === 0) {
    console.error('Xbox 360 controller not found.');
    process.exit(1);
  }

  const deviceInfo = devices[0];
  device = new HID.HID(deviceInfo.path);

  device.on('data', (data) => {
    try {
      const [unused, unused1, leftStickX, leftStickY, rightStickX, rightStickY] = data;

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

      sendMotorControlToESP32(speed, -direction);
    } catch (err) {
      console.error('Error processing data from HID device:', err);
    }
  });
} catch (err) {
  console.error('Failed to initialize HID device:', err);
  process.exit(1);
}

ws.on('open', () => {
  console.log('Connected to ESP32');
});

ws.on('close', () => {
  console.log('Disconnected from ESP32');
});

function sendMotorControlToESP32(speed, direction) {
  const message = `${speed},${direction}`;
  ws.send(message, (err) => {
    if (err) {
      console.error('WebSocket message send error:', err);
    } else {
      console.log(`Sent: ${message}`);
    }
  });
}
