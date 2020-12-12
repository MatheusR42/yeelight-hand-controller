# Yeelight Hand Controller

With Yeelight Hand Controller you can turn on and off your Yeelight just with a finger snap and change the brightness intensity raising or lowering your hand.

![Yeelight Hand Controller In Action](yeelight-hand-controller.gif?raw=true)

## Equipments

* Webcam
* Microphone
* [Yeelight 2nd generation YLDP06YL](https://www.amazon.com/YEELIGHT-YLDP06YL-Wireless-Control-Colorful/dp/B0841PXPLB) (it's possible to use another versions too, you will just need to find out a nice lib to work with your version)

## Libs
* [TensorFlow.js](https://www.tensorflow.org/js)
* [Teachablemachine](https://teachablemachine.withgoogle.com/)
* [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands)
* [YEELIGHT AWESOME](https://github.com/samuraitruong/yeelight)
* [Express](https://expressjs.com/)

## How it works

The YEELIGHT AWESOME lib gives handful methods to play with Yeelight so you just need to use your imagination to work with that :wink:. 

To turn on and off the light with a finger snap I recorded background noises of my room together with some finger snaps. With this data I trained a TensorFlow model using Teachablemachine.

To control the brightness intensity I use MediaPipe Hands lib. This lib can track with high precision many hand landmarks. I choose to use the wrist landmark because it is more stable to angle changes so it will work similarly even if you use other hand positions like with the palm pointing forward.

![Hand Landmarks](hand_landmarks.png)

To put everything together, I use a node back-end with Express to create API endpoints that trigger YEELIGHT AWESOME commands. At the front-end I just write some functions to listen to Tensorflow and MediaPipe and call the back-end. You can find the code [here](../frontend/main.js).

## Improvements
The Yeelight also can change colors so it is possible to train more categories like clap and whistle with Tensorflow or listen for other types of movements to play with the light. 