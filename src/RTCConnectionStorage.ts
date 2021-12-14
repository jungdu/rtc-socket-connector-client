export class RTCConnectionStorage {
  connections:{[targetSocketId:string]: RTCPeerConnection} = {}

  set(socketId: string, rtcPeerConnection: RTCPeerConnection){
    if(this.connections[socketId]){
      throw new Error("socket is already exist");
    }
    this.connections[socketId] = rtcPeerConnection;
  }

  get(socketId: string){
    const connection = this.connections[socketId];
    if(!connection){
      throw new Error(`There isn't stored rtcPeerConnection by socket id ${socketId}`)
    }

    return this.connections[socketId];
  }
}