import { Socket } from "socket.io-client";
import { RTCClientSocket } from "rtc-socket-connector-types";
import { RTCConnectionStorage } from "./RTCConnectionStorage";

export interface RTCConnectionHandler {
	onDataChannel?: (socketId: string, dataChannel: RTCDataChannel) => void;
	onTrack?: (socketId: string, streams: MediaStream[]) => void;
	onRTCPeerConnection?: (socketId: string, rtcPeerConnection: RTCPeerConnection) => void;
}

interface ConnectOption {
	enableDataChannel?: boolean;
	enableMediaStream?: boolean;
}

const DEFAULT_RTC_CONFIGURATION = {
	iceServers: [
		{ urls: "stun:stun.services.mozilla.com" },
		{ urls: "stun:stun.l.google.com:19302" },
	],
};

export default class RTCConnectionManager {
	socket: RTCClientSocket;
	connectionStorage = new RTCConnectionStorage();
	mediaStream: MediaStream | null = null;

	constructor(
		socket: Socket,
		private connectionHandler: RTCConnectionHandler,
		private rtcConfiguration?: RTCConfiguration
	) {
		this.socket = socket;
		this.connectionHandler = connectionHandler;
		this.addSocketHandler(socket);
	}

	private createConnection(targetSocketId: string) {
		const connection = new RTCPeerConnection(
			this.rtcConfiguration || DEFAULT_RTC_CONFIGURATION
		);
		this.connectionStorage.set(targetSocketId, connection);
		
		if(this.connectionHandler.onRTCPeerConnection){
			this.connectionHandler.onRTCPeerConnection(targetSocketId, connection);
		}

		connection.addEventListener('connectionstatechange', (event) => {
			if(connection.connectionState === "disconnected"){
				this.connectionStorage.remove(targetSocketId);
			}
		})

		return connection;
	}

	private createDataChannel(rtcPeerConnection: RTCPeerConnection) {
		const dataChannel = rtcPeerConnection.createDataChannel("main");
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
		rtcPeerConnection.ontrack = (event) => {
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
				this.addMediaStreamTrack(rtcPeerConnection, this.mediaStream);
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
		if (!this.socket.connect) {
			throw new Error("Socket require to be connected");
		}

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

	setMediaStream(mediaStream: MediaStream) {
		this.mediaStream = mediaStream;
	}
}
