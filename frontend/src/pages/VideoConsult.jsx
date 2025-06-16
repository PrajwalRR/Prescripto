// src/components/VideoConsult.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { setupLocalMedia, createOffer, handleOffer, handleAnswer, handleIceCandidate } from './webrtcUtils';

const VideoConsult = () => {
  const { appointmentId } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [reports, setReports] = useState([]);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const socket = io(backendUrl, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', appointmentId);
    });

    socket.on('initiate', (isInitiator) => {
      if (isInitiator) {
createOffer(socketRef, peerConnectionRef, appointmentId);
      }
    });

    socket.on('offer', (sdp) => {
handleOffer(sdp, socketRef, peerConnectionRef, appointmentId);
    });

    socket.on('answer', (sdp) => {
      handleAnswer(sdp, peerConnectionRef);
    });

    socket.on('ice-candidate', ({ candidate }) => {
handleIceCandidate(candidate, peerConnectionRef, socketRef, appointmentId);
    });

    setupLocalMedia(localVideoRef, setLocalStream, peerConnectionRef, socketRef, appointmentId, remoteVideoRef);

    return () => socket.disconnect();
  }, [appointmentId]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${backendUrl}/api/user/get-reports/${appointmentId}`, {
        headers: { token }
      });
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [appointmentId]);

  const handleUpload = async () => {
    if (!selectedFile) return alert('Select a file first!');
    const formData = new FormData();
    formData.append('report', selectedFile);
    formData.append('appointmentId', appointmentId);
    formData.append('uploadedBy', 'patient');

    try {
      const { data } = await axios.post(`${backendUrl}/api/user/upload-report`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          token: localStorage.getItem('token')
        }
      });

      if (data.success) {
        alert('Report uploaded!');
        setSelectedFile(null);
        fetchReports();
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed');
    }
  };

  const handleEndCall = () => {
    localStream?.getTracks().forEach(track => track.stop());
    peerConnectionRef.current?.close();
    socketRef.current?.disconnect();
    alert('Call ended');
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Patient Video Consult — #{appointmentId}</h1>
      <div className="flex gap-6">
        <video ref={localVideoRef} autoPlay muted playsInline className="w-72 h-48 border rounded" />
        <video ref={remoteVideoRef} autoPlay playsInline className="w-72 h-48 border rounded" />
      </div>

      <div className="flex gap-4 mt-4 mb-6">
        <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} />
        <button onClick={handleUpload} className="bg-blue-500 text-white px-4 py-2 rounded">Upload Report</button>
        <button onClick={handleEndCall} className="bg-red-500 text-white px-4 py-2 rounded">End Call</button>
      </div>

      <div className="mt-6 w-full max-w-2xl">
        <h3 className="font-semibold">Uploaded Reports:</h3>
        {reports.length ? (
          reports.map((r, i) => (
            <div key={i}>
              <a href={`${backendUrl}${r.url}`} target="_blank" rel="noopener noreferrer">
                Report {i + 1}
              </a> — {r.uploadedBy}
            </div>
          ))
        ) : (
          <p>No reports uploaded.</p>
        )}
      </div>
    </div>
  );
};

export default VideoConsult;
