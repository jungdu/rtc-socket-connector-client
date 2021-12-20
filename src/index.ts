import { Socket } from "socket.io-client"
import RTCConnectionManager, { RTCConnectionHandler } from "./RTCConnectionManager"

function createRTCConnectionManager(socket: Socket, connectionHandler: RTCConnectionHandler){
  const rtcConnectionManager = new RTCConnectionManager(socket, connectionHandler);
  return rtcConnectionManager;
}

function importTest(){
  console.log("Hello World")
}

export {
  importTest,
  createRTCConnectionManager,
  RTCConnectionManager,
  RTCConnectionHandler,
}