import { Socket } from "socket.io-client"
import RTCConnectionManager, { RTCConnectionHandler } from "./RTCConnectionManager"

function createRTCConnectionManager(socket: Socket, connectionHandler: RTCConnectionHandler, rtcConfiguration?: RTCConfiguration){
  const rtcConnectionManager = new RTCConnectionManager(socket, connectionHandler, rtcConfiguration);
  return rtcConnectionManager;
}

export {
  createRTCConnectionManager,
  RTCConnectionManager,
  RTCConnectionHandler,
}