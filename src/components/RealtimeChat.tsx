import React, { useState, useRef, useEffect } from 'react';
import './RealtimeChat.css';

interface RealtimeChatProps {
  onClose: () => void;
}

const RealtimeChat: React.FC<RealtimeChatProps> = ({ onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [statusText, setStatusText] = useState('Click to speak');
  
  const orbRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const beepRef = useRef<{ play: () => void } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const createBeep = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    };
    
    beepRef.current = { play: createBeep };

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (beepRef.current) {
        try {
          beepRef.current.play();
        } catch (e) {
          console.log('Beep play failed:', e);
        }
      }

      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
        setStatusText('Recording...');
        if (orbRef.current) orbRef.current.classList.add('listening');
        if (ringRef.current) ringRef.current.classList.add('listening');
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        if (orbRef.current) orbRef.current.classList.remove('listening');
        if (ringRef.current) ringRef.current.classList.remove('listening');
        
        stream.getTracks().forEach(track => track.stop());

        if (audioChunksRef.current.length > 0) {
          await processAudio();
        } else {
          setStatusText('Click to speak');
        }
      };

      mediaRecorder.start();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setStatusText('Error accessing microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const processAudio = async () => {
    setStatusText('Processing...');

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      const formData = new FormData();
      formData.append('data', audioBlob, 'audio.webm');

      const response = await fetch('https://nshadiyar.app.n8n.cloud/webhook/process-audio', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Server response error: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      console.log('Response content-type:', contentType);

      if (contentType && contentType.includes('audio')) {
        const blob = await response.blob();
        const audioURL = URL.createObjectURL(blob);
        const audio = new Audio(audioURL);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsPlaying(true);
          setStatusText('Responding...');
          if (orbRef.current) orbRef.current.classList.add('playing');
          if (ringRef.current) ringRef.current.classList.add('playing');
        };

        audio.onended = () => {
          setIsPlaying(false);
          setStatusText('Click to speak');
          if (orbRef.current) orbRef.current.classList.remove('playing');
          if (ringRef.current) ringRef.current.classList.remove('playing');
          URL.revokeObjectURL(audioURL);
          audioRef.current = null;
        };

        audio.onerror = () => {
          setIsPlaying(false);
          setStatusText('Playback error');
          if (orbRef.current) orbRef.current.classList.remove('playing');
          if (ringRef.current) ringRef.current.classList.remove('playing');
          URL.revokeObjectURL(audioURL);
          audioRef.current = null;
        };

        await audio.play();
      } else {
        const data = await response.json();
        console.log('JSON response:', data);
        
        if (data.audioUrl) {
          const audio = new Audio(data.audioUrl);
          audioRef.current = audio;
          
          audio.onplay = () => {
            setIsPlaying(true);
            setStatusText('Responding...');
            if (orbRef.current) orbRef.current.classList.add('playing');
            if (ringRef.current) ringRef.current.classList.add('playing');
          };

          audio.onended = () => {
            setIsPlaying(false);
            setStatusText('Click to speak');
            if (orbRef.current) orbRef.current.classList.remove('playing');
            if (ringRef.current) ringRef.current.classList.remove('playing');
            audioRef.current = null;
          };

          audio.onerror = () => {
            setIsPlaying(false);
            setStatusText('Playback error');
            if (orbRef.current) orbRef.current.classList.remove('playing');
            if (ringRef.current) ringRef.current.classList.remove('playing');
            audioRef.current = null;
          };

          await audio.play();
        } else {
          setStatusText(`Response: ${data.response || data.message || 'Received response'}`);
          setTimeout(() => {
            setStatusText('Click to speak');
          }, 3000);
        }
      }

    } catch (err) {
      console.error('Error sending or processing response:', err);
      setStatusText('Error connecting to AI');
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    if (orbRef.current) orbRef.current.classList.remove('playing');
    if (ringRef.current) ringRef.current.classList.remove('playing');
  };

  const handleClose = () => {
    // Stop recording if it's in progress
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      // Stop all tracks
      const stream = mediaRecorderRef.current.stream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
    
    // Stop playback
    stopAudio();
    
    // Reset states
    setIsRecording(false);
    setIsPlaying(false);
    setStatusText('Click to speak');
    if (orbRef.current) {
      orbRef.current.classList.remove('listening');
      orbRef.current.classList.remove('playing');
    }
    if (ringRef.current) {
      ringRef.current.classList.remove('listening');
      ringRef.current.classList.remove('playing');
    }
    
    // Close window
    onClose();
  };

  const handleOrbClick = () => {
    if (isPlaying) {
      stopAudio();
      setStatusText('Click to speak');
      startRecording();
      return;
    }
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="realtime-chat-overlay">
      <div className="realtime-chat-container">
        <button className="close-button" onClick={handleClose} aria-label="Close">
          <span className="close-icon">✕</span>
        </button>
        
        <div className="orb-container">
          <div 
            ref={ringRef}
            className="ring"
          ></div>
          <div 
            ref={orbRef}
            className="orb"
            onClick={handleOrbClick}
            title={isPlaying ? "Click to interrupt and speak" : isRecording ? "Click to stop" : "Click to speak with AI"}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOrbClick();
              }
            }}
          ></div>
        </div>
        
        <div className="status-text">
          {statusText}
        </div>
      </div>
    </div>
  );
};

export default RealtimeChat;

