# rtc-socket-connector-client

**rtc-socket-connector-client** is a library for WebRTC connection with [**rtc-socket-connector-server**](https://github.com/jungdu/rtc-socket-connector-server).  
Clients send socket messages **rtc-socket-connector-client** for WebRTC to the server using **rtc-socket-connector-server**.  
These two libraries simplify the process required for WebRTC connection.  
**Example using this library**: [rtc-socket-connector-example](https://github.com/jungdu/rtc-socket-connector-example)



# How to use

### 1. Create socket using [socket.io](https://socket.io/)
Connect socket server which is added WebRTC connection handlers by [**rtc-socket-connector-server**](https://github.com/jungdu/rtc-socket-connector-server). 

```javascript
const socket = io("YOUR SERVER URL");
```

### 2. Define RTCConnectionHandler

```RTCConnectionHandler``` is handlers related on WebRTC events.


```javascript
const handler = {
  onRTCPeerConnection: (socketId, rtcPeerConnection) => {
    // Use rtcPeerConnection
  },
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

### 4. Set MediaStream (optional)
Set MediaStream which will be transmitted to the other peer.

```javascript
rtcConnectionManager.setMediaStream(mediaStream)
```

### 5. Connect another client
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

### createRTCConnectionManager(socket, handlers, rtcConfiguration)
Create RTCConnectionManager
**arguments**
- socket(```Socket```): A socket created to socket server.
- handlers
  - onRTCPeerConnection(```(socketId: string, rtcPeerConnection: RTCPeerConnection)```): Triggers when RTCPeerConnection is created.
  - onTrack(```(socketId: string, mediaStream: MediaStream[]) => void```): Triggers when a track has been added to the RTCPeerConnection
  - onDataChannel(```(socketId: string, dataChannel: RTCDataChannel) => void```): Triggers when new DataChannel is opened.  
- rtcConfiguration([RTCConfiguration](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/RTCPeerConnection))(optional): An object providing options to configure the new WebRTC connection.

## RTCConnectionManager
RTCConnectionManager is a class that provides method to connect to other clients and to set MediaStream to send to other clients.  

## methods
### connect(targetSocketId, option)
Connect another client that has targetSocketId as a socket id.  
**Arguments**
- answerSocketId(```string```): Socket id on another client to connect
- option
  - enableDataChannel(```boolean```): Set true to enable DataChannel. DataChannel, the label of which is ```main```, will be open. onDataStream handler will be executed.
  - enableMediaStream(```boolean```): Set true to enable MediaStream. onTrack handler will be executed.

### setMediaStream(mediaStream)
Set MediaStream to send to other clients will be connected.  
MediaStream should be set before connecting other clients.  
**Arguments**
- mediaStream(```MediaStream```): MediaStream which will be transmitted to the other peer.


# Resources
- [RTCPeerConnection - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection)
- [Socket.io](https://socket.io/)
