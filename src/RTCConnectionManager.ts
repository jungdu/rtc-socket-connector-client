import { Socket } from "socket.io-client";
import { RTCClientSocket } from "rtc-socket-connector-types";
import { RTCConnectionStorage } from "./RTCConnectionStorage";

export interface RTCConnectionHandler {
	onDataChannel?: (socketId: string, dataChannel: RTCDataChannel) => void;
	onTrack?: (socketId: string, streams: MediaStream[]) => void;
}

interface ConnectOption {
	enableDataChannel?: boolean;
	enableMediaStream?: boolean;
}

const DEFAULT_ICE_SERVERS = {
	iceServers: [
		{ urls: "stun:stun.services.mozilla.com" },
		{ urls: "stun:stun.l.google.com:19302" },
	],
};

export default class RTCConnectionManager {
	socket: RTCClientSocket;
	mediaStream: null | MediaStream;
	connectionStorage = new RTCConnectionStorage();
	connectionHandler: RTCConnectionHandler;

	constructor(socket: Socket, connectionHandler: RTCConnectionHandler, mediaStream:MediaStream|null = null) {
		if (!socket.id) {
			throw new Error("Socket require socketId");
		}

		this.socket = socket;
		this.connectionHandler = connectionHandler;
		this.mediaStream = mediaStream;
		this.addSocketHandler(socket);
	}

	private createConnection(targetSocketId: string) {
		const connection = new RTCPeerConnection(DEFAULT_ICE_SERVERS);
		this.connectionStorage.set(targetSocketId, connection);
		return connection;
	}

	private createDataChannel(rtcPeerConnection: RTCPeerConnection) {
		const dataChannel = rtcPeerConnection.createDataChannel("arraybuffer");
		dataChannel.binaryType = "arraybuffer";
		return dataChannel;
	}

	private addCandidateHandler(
		rtcPeerConnection: RTCPeerConnection,
		targetSocketId: string
	) {
		rtcPeerConnection.onicecandidate = (event) => {
			const { candidate } = event;
			if (candidate) {
				this.socket.emit("candidate", {
					candidate,
					destSocketId: targetSocketId,
					fromSocketId: this.socket.id,
				});
			}
		};
	}

	private addDataChannelHandler(
		rtcPeerConnection: RTCPeerConnection,
		targetSocketId: string
	) {
		rtcPeerConnection.addEventListener("datachannel", (event) => {
			const dataChannel = event.channel;
			if (this.connectionHandler.onDataChannel) {
				this.connectionHandler.onDataChannel(targetSocketId, dataChannel);
			}
		});
	}

	private addTrackHandler(
		rtcPeerConnection: RTCPeerConnection,
		targetSocketId: string
	) {
		console.log("addTrackHandler");
		rtcPeerConnection.ontrack = (event) => {
			console.log("ontrack");
			if (this.connectionHandler.onTrack) {
				this.connectionHandler.onTrack(targetSocketId, [...event.streams]);
			}
		};
	}

	private addSocketHandler(socket: RTCClientSocket) {
		socket.on("offer", (msg) => {
			const { offer, offerSocketId, enableDataChannel, enableMediaStream } =
				msg;

			const rtcPeerConnection = this.createConnection(offerSocketId);
			this.addCandidateHandler(rtcPeerConnection, offerSocketId);

			if (enableDataChannel) {
				this.addDataChannelHandler(rtcPeerConnection, offerSocketId);
			}

			if (enableMediaStream) {
				this.addMediaStreamTrack(rtcPeerConnection, this.mediaStream)
				this.addTrackHandler(rtcPeerConnection, offerSocketId);
			}

			rtcPeerConnection.setRemoteDescription(offer);
			rtcPeerConnection.createAnswer().then((answer) => {
				rtcPeerConnection.setLocalDescription(answer);

				socket.emit("answer", {
					answerSocketId: this.socket.id,
					answer,
					offerSocketId,
				});
			});
		});

		socket.on("answer", (msg) => {
			const { answer, answerSocketId } = msg;
			const rtcPeerConnection = this.connectionStorage.get(answerSocketId);
			rtcPeerConnection.setRemoteDescription(answer);
		});

		socket.on("candidate", (msg) => {
			const { candidate, fromSocketId } = msg;
			const connection = this.connectionStorage.get(fromSocketId);
			connection.addIceCandidate(candidate);
		});
	}

	private addMediaStreamTrack(
		rtcPeerConnection: RTCPeerConnection,
		mediaStream: MediaStream | null
	) {
		if (mediaStream) {
			rtcPeerConnection.addTrack(mediaStream.getTracks()[0], mediaStream);
		} else {
			rtcPeerConnection.addTransceiver("video");
		}
	}

	connect(answerSocketId: string, option: ConnectOption) {
		const { enableDataChannel, enableMediaStream } = option;
		if (!(enableDataChannel || enableMediaStream)) {
			throw new Error("Enable either data channel or media stream");
		}

		const rtcPeerConnection = this.createConnection(answerSocketId);
		this.addCandidateHandler(rtcPeerConnection, answerSocketId);

		if (enableDataChannel) {
			this.addDataChannelHandler(rtcPeerConnection, answerSocketId);
			const dataChannel = this.createDataChannel(rtcPeerConnection);
			dataChannel.addEventListener("open", () => {
				if (this.connectionHandler.onDataChannel) {
					this.connectionHandler.onDataChannel(answerSocketId, dataChannel);
				}
			});
		}

		if (enableMediaStream) {
			this.addMediaStreamTrack(rtcPeerConnection, this.mediaStream || null);
			this.addTrackHandler(rtcPeerConnection, answerSocketId);
		}

		rtcPeerConnection.createOffer().then((offer) => {
			rtcPeerConnection.setLocalDescription(offer);

			this.socket.emit("offer", {
				answerSocketId: answerSocketId,
				offer,
				offerSocketId: this.socket.id,
				enableMediaStream: !!enableMediaStream,
				enableDataChannel: !!enableDataChannel,
			});
		});
	}

	setMediaStream(mediaStream:MediaStream){
		this.mediaStream = mediaStream;
	}
}
