#include <WiFi.h>
#include <WebSocketsServer.h>
#include <Arduino.h>

#define AIN1 22
#define AIN2 23
#define BIN1 18
#define BIN2 19

const char* ssid = "DD00";
const char* password = "DD1996@063";

WebSocketsServer webSocket = WebSocketsServer(81);

const int AIN1_CHANNEL = 0;
const int AIN2_CHANNEL = 1;
const int BIN1_CHANNEL = 2;
const int BIN2_CHANNEL = 3;

void handleWebSocketMessage(void *arg, uint8_t *data, size_t len) {
  data[len] = '\0';
  Serial.printf("Received message: %s\n", data);

  int speed, direction;
  sscanf((char*)data, "%d,%d", &speed, &direction);

   // Control the speed and direction of the motors
    if (speed > 0) {
      if (speed > 200) {
        ledcWrite(AIN1, 200);
      } else {
        ledcWrite(AIN1, speed);
      }
      ledcWrite(AIN2, 0);
    } else {
      ledcWrite(AIN1, 0);
      ledcWrite(AIN2, -speed);
    }

    if (direction == 0) {
      ledcWrite(BIN1, 0);
      ledcWrite(BIN2, 0);
    } else if (direction == 1) {
      ledcWrite(BIN1, 0);
      ledcWrite(BIN2, 255);
    } else if (direction == -1) {
      ledcWrite(BIN1, 255);
      ledcWrite(BIN2, 0);
    }

  Serial.printf("Motor control: Speed=%d, Direction=%d\n", speed, direction);
}

void onWebSocketEvent(uint8_t num, WStype_t type, uint8_t *payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("Client %u disconnected\n", num);
      break;
    case WStype_CONNECTED:
      Serial.printf("Client %u connected from %s\n", num, webSocket.remoteIP(num).toString().c_str());
      break;
    case WStype_TEXT:
      handleWebSocketMessage((void *)num, payload, length);
      break;
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }

  Serial.println("Connected to WiFi");

  webSocket.begin();
  webSocket.onEvent(onWebSocketEvent);

  // Attach pins to PWM channels
   ledcAttach(AIN1, 5000, 8);
  ledcAttach(AIN2, 5000, 8);
  ledcAttach(BIN1, 5000, 8);
  ledcAttach(BIN2, 5000, 8);
}

void loop() {
  webSocket.loop();
}
