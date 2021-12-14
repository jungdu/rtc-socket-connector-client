import { Socket } from "socket.io-client"
import RTCConnectionManager, { ConnectionHandler } from "./RTCConnectionManager"

function createRTCConnectionManager(socket: Socket, connectionHandler: ConnectionHandler){
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
}