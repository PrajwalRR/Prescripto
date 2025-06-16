// src/components/DoctorVideoConsult.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { setupLocalMedia, createOffer, handleOffer, handleAnswer, handleIceCandidate } from './webrtcUtils';

const DoctorVideoConsult = () => {
  const { appointmentId } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [reports, setReports] = useState([]);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const socket = io(backendUrl, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected socket:', socket.id);
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
      const dToken = localStorage.getItem('dToken');
      const { data } = await axios.get(`${backendUrl}/api/user/get-reports/${appointmentId}`, {
        headers: { Authorization: `Bearer ${dToken}` }
      });
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [appointmentId]);

  const handleEndCall = () => {
    localStream?.getTracks().forEach(track => track.stop());
    peerConnectionRef.current?.close();
    socketRef.current?.disconnect();
    alert('Call ended');
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Doctor Video Consult — #{appointmentId}</h1>
      <div className="flex gap-6">
        <video ref={localVideoRef} autoPlay muted playsInline className="w-72 h-48 border rounded" />
        <video ref={remoteVideoRef} autoPlay playsInline className="w-72 h-48 border rounded" />
      </div>
      <button onClick={handleEndCall} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
        End Call
      </button>

      <div className="mt-6 w-full max-w-xl">
        <h3 className="font-semibold">Patient Uploaded Reports:</h3>
        {reports.length ? (
          <ul className="list-disc ml-6">
            {reports.map((r, i) => (
              <li key={i}>
                <a href={`${backendUrl}${r.url}`} target="_blank" rel="noopener noreferrer">
                  Report {i + 1}
                </a>{' '}
                ({r.uploadedBy})
              </li>
            ))}
          </ul>
        ) : (
          <p>No reports yet.</p>
        )}
      </div>
    </div>
  );
};

export default DoctorVideoConsult;
