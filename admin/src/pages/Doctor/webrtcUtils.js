// src/components/webrtcUtils.js

export const setupLocalMedia = async (videoRef, setStream, pcRef, socketRef, roomId, remoteRef) => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  setStream(stream);
  videoRef.current.srcObject = stream;

  const pc = new RTCPeerConnection();
  stream.getTracks().forEach(track => pc.addTrack(track, stream));

  let remoteStream = new MediaStream();
  pc.ontrack = (event) => {
    remoteStream.addTrack(event.track);
    remoteRef.current.srcObject = remoteStream;
  };


  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socketRef.current.emit('ice-candidate', { roomId, candidate: event.candidate });
    }
  };

  pcRef.current = pc;
};

// webrtcUtils.js

export const createOffer = async (socketRef, pcRef, roomId) => {
  const offer = await pcRef.current.createOffer();
  await pcRef.current.setLocalDescription(offer);
  socketRef.current.emit('offer', { roomId, sdp: offer }); // ✅ Use correct roomId
};

export const handleOffer = async (sdp, socketRef, pcRef, roomId) => {
  await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
  const answer = await pcRef.current.createAnswer();
  await pcRef.current.setLocalDescription(answer);
  socketRef.current.emit('answer', { roomId, sdp: answer }); // ✅ Use correct roomId
};

export const handleIceCandidate = async (candidate, pcRef, socketRef, roomId) => {
  if (candidate) {
    await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    socketRef.current.emit('ice-candidate', { roomId, candidate }); // ✅ Use correct roomId
  }
};

