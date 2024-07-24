#include <WiFi.h>
#include <WiFiUdp.h>
#include <Arduino.h>




#define AIN1 22
#define AIN2 23
#define BIN1 18
#define BIN2 19

const char* ssid = "DD00"; //HUAWEI-SDwy
const char* password = "DD1996@063"; //w4SabjX7

WiFiUDP udp;
unsigned int localUdpPort = 4210;
char incomingPacket[255];

const int AIN1_CHANNEL = 0;
const int AIN2_CHANNEL = 1;
const int BIN1_CHANNEL = 2;
const int BIN2_CHANNEL = 3;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }

  Serial.println("Connected to WiFi");
  udp.begin(localUdpPort);
  Serial.printf("UDP server started at IP: %s, Port: %d\n", WiFi.localIP().toString().c_str(), localUdpPort);


  // Attach pins to PWM channels
  ledcAttach(AIN1, 5000, 8);
  ledcAttach(AIN2, 5000, 8);
  ledcAttach(BIN1, 5000, 8);
  ledcAttach(BIN2, 5000, 8);
  
}


void loop() {
  int packetSize = udp.parsePacket();
  if (packetSize) {
    int len = udp.read(incomingPacket, 255);
    if (len > 0) {
      incomingPacket[len] = 0;
    }
    Serial.printf("Received packet: %s\n", incomingPacket);

    int speed, direction, servoAngle;
    sscanf(incomingPacket, "%d,%d,%d", &speed, &direction, &servoAngle);

    // Control the speed and direction of the motors
    if (speed > 0) {
     
    
        ledcWrite(AIN1, speed);
      
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

    Serial.printf("Motor control: Speed=%d, Direction=%d, Servo Angle=%d\n;", speed, direction, servoAngle);
    delay(10);
  }
}
