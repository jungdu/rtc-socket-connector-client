# rtc-socket-connector-client

**rtc-socket-connector-client** is a library for WebRTC connection with [**rtc-socket-connector-server**](https://github.com/jungdu/rtc-socket-connector-server).  
Clients send socket messages **rtc-socket-connector-client** for WebRTC to the server using **rtc-socket-connector-server**.  
These two libraries simplify the process required for WebRTC connection.




# How to use

### 1. Connect [socket.io](https://socket.io/) server
Connect to socket server which is added WebRTC connection handlers by [**rtc-socket-connector-server**](https://github.com/jungdu/rtc-socket-connector-server). 

```javascript
const socket = io("YOUR SERVER URL");
```

### 2. Define RTCConnectionHandler

```RTCConnectionHandler``` is handlers related on WebRTC events.


```javascript
const handler = {
  onTrack: (socketId, mediaStream) => {
    // Use mediaStream
  },
  onDataChannel: (socketId, dataChannel) => {
    // Use dataChannel
  }
}

```
```onTrack``` will be executed when a [track](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/track_event) has been added to the RTCPeerConnection.  
 this event is sent when a new incoming MediaStreamTrack has been created and associated with an RTCRtpReceiver.   
The incoming track to the ```<video>``` element which will be used to display the incoming video.

```onDataChannel``` will be executed when [RTCDataChannel](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel) is added to the connection by the remote peer.  
RTCDataChannel can be used for bidirectional peer-to-peer transfers of arbitrary data
   

### 3. Create ```RTCConnectionManager```
```RTCConnectionManager``` handles socket messages for WebRTC connection.  

Use ```createRTCConnectionManager``` to create ```RTCConnectionManager```

Set the socket(step 1. Connect socket.io server) and the defined handler(step 2 Define handlers) as parameters. 

```javascript
import { createRTCConnectionManager } from "rtc-socket-connector-client";

const rtcConnectionManager = createRTCConnectionManager(socket, handler);
```

### 3. Set MediaStream

```javascript
rtcConnectionManager.setMediaStream(mediaStream)
```

### 4. Connect to another client
Clients can be identified by Socket ID.  
Execute ```RTCConnectionManager.connect``` to start process to connect to the target client.   
```javascript
rtcConnecitonManager.connect(targetSocketId, {
  enableMediaStream: true,
  enableDataChannel: true,
})
```
Set ```enableMediaStream``` to true to enable MediaStream. Requires setting mediaStream by using ```RTCConnectionManager.setMediaStream``` method before calling  ```RTCConnectionManager.connect``` to connect MediaStream.

Set ```enableDataChannel``` to true to enable DataStream. onDataChannel handlers will be executed.


# API

### createRTCConnectionManager(socket, handlers)
**arguments**
- socket(```Socket```): A socket created to socket server.
- handlers
  - onTrack(```(socketId, mediaStream) => void```): Triggers when a track has been added to the RTCPeerConnection
  - onDataChannel(```(socketId, dataChannel) => void```): Triggers when new DataChannel is opened.

## RTCConnectionManager
## methods
### connect(answerSocketId, option)
**Arguments**
- answerSocketId(```string```): Socket id on another client to connect
- option
  - enableDataChannel(```boolean```): Set true to enable DataChannel. onDataStream handler will be executed.
  - enableMediaStream(```boolean```): Set true to enable MediaStream. onTrack handler will be executed.

### setMediaStream(mediaStream)
**Arguments**
- mediaStream(```MediaStream```): MediaStream to send to connected client.


# Resources
- [RTCPeerConnection - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection)
- [Socket.io](https://socket.io/)
