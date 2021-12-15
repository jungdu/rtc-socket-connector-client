# rtc-socket-connector-client

rtc-socket-connector-server is library for WebRTC specifications that deals with connecting two applications on different computers to communicate using a peer-to-peer protocol.
This library requires socket server using [**rtc-socket-connector-server**](https://github.com/jungdu/rtc-socket-connector-server).  
Using [**rtc-socket-connector-server**](https://github.com/jungdu/rtc-socket-connector-server) and **rtc-socket-connector-client**, It is easy to make that two peers communicate using WebRTC.

# How to use

### 1. Connect [socket.io](https://socket.io/) server
Connect to socket server which is added WebRTC connection handlers by [**rtc-socket-connector-server**](https://github.com/jungdu/rtc-socket-connector-server). 

```javascript
const socket = io("YOUR SERVER URL");
```

### 2. Define handlers
```onTrack``` will be executed when a track has been added to the RTCPeerConnection. You can use MediaStream in the handler.

```onDataChannel``` will be executed when RTCDataChannel is added to the connection by the remote peer. You can use DataChannel in the handler

```javascript
const handler = {
  onTrack: (socketId, mediaStream) => {
    // mediaStream from another client has socketId
  },
  onDataChannel: (socketId, dataChannel) => {
    // dataChannel from another client has socketId
  }
}

```

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
```RTCConnectionManager.connect``` starts process for WebRTC connection.
Several socket messages will be sent between this client, server, and a target client.

Set ```enableMediaStream``` to true to enable MediaStream. Requires setting mediaStream by using ```RTCConnectionManager.setMediaStream``` method before calling  ```RTCConnectionManager.connect``` to connect MediaStream.

Set ```enableDataChannel``` to true to enable DataStream. onDataChannel handlers will be executed.

```javascript
rtcConnecitonManager.connect(targetSocketId, {
  enableMediaStream: true,
  enableDataChannel: true,
})
```

# API

### createRTCConnectionManager(socket, handlers)
**arguments**
- **socket**(```Socket```): A socket created to socket server.
- **handlers**
  - **onTrack**(```(socketId, mediaStream) => void```): Triggers when a track has been added to the RTCPeerConnection
  - **onDataChannel**(```(socketId, dataChannel) => void```): Triggers when new DataChannel is opened.

## RTCConnectionManager
## methods
### connect(answerSocketId, option)
**Arguments**
- answerSocketId: Socket id on another client to connect
- option
  - enableDataChannel(```boolean```): Set true to enable DataChannel. onDataStream handler will be executed.
  - enableMediaStream(```boolean```): Set true to enable MediaStream. onTrack handler will be executed.

### setMediaStream(mediaStream)
**Arguments**
- mediaStream(```MediaStream```): MediaStream to send to connected client.
