export class RTCConnectionStorage {
  connections:{[targetSocketId:string]: RTCPeerConnection | null} = {}

  set(socketId: string, rtcPeerConnection: RTCPeerConnection){
    if(this.connections[socketId]){
      throw new Error(`Socket is already exist in connection storage (socketId: ${socketId})`);
    }
    this.connections[socketId] = rtcPeerConnection;
  }

  get(socketId: string){
    const connection = this.connections[socketId];
    if(!connection){
      throw new Error(`Doesn't exist connection to get (socketId: ${socketId})`)
    }

    return connection;
  }

  remove(socketId: string){
    if(!this.connections[socketId]){
      throw new Error(`Doesn't exist connection to delete (socketId: ${socketId})`)
    }

    this.connections[socketId] = null;
  }
}