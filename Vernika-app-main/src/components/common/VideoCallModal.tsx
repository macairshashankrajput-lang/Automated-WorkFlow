import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  MessageSquare,
  Users,
  Shield,
  Sparkles,
  Maximize2,
  Smile,
  Send,
  X,
  Volume2,
  Radio
} from 'lucide-react';

interface VideoCallModalProps {
  meetingTitle: string;
  hostName: string;
  participants: string[];
  onClose: () => void;
  meetingLink?: string;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  meetingTitle,
  hostName,
  participants,
  onClose,
  meetingLink
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeTab, setActiveTab] = useState<'grid' | 'chat' | 'participants'>('grid');
  const [callTimeSeconds, setCallTimeSeconds] = useState(0);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: string; text: string; time: string }>>([
    { id: '1', sender: hostName, text: 'Welcome everyone! Let us begin our secure session.', time: 'Just now' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Call timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallTimeSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Request actual camera & microphone
  useEffect(() => {
    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        mediaStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsConnecting(false);
      } catch (err) {
        console.warn('Camera / mic permission denied or unavailable, running virtual video stream.', err);
        setIsConnecting(false);
      }
    }
    initMedia();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const toggleMic = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff;
      });
    }
    setIsVideoOff(!isVideoOff);
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);

        screenStream.getVideoTracks()[0].onended = () => {
          if (mediaStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = mediaStreamRef.current;
          }
          setIsScreenSharing(false);
        };
      } else {
        if (mediaStreamRef.current && localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStreamRef.current;
        }
        setIsScreenSharing(false);
      }
    } catch {
      setIsScreenSharing(false);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: hostName,
        text: inputMessage.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
    setInputMessage('');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col text-white overflow-hidden animate-in fade-in duration-200">
      {/* Top Conference Header */}
      <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/85 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold tracking-tight text-white">{meetingTitle}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Live WebRTC Encrypted</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Host: {hostName}</span>
              <span>•</span>
              <span className="font-mono text-emerald-400">{formatTime(callTimeSeconds)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('grid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'grid' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('participants')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'participants' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Participants ({participants.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer relative ${
              activeTab === 'chat' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold ml-2 transition-all cursor-pointer"
            title="Leave / End Call"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Video Grid / Stream Area */}
        <div className="flex-1 p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto">
          {activeTab === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full max-h-[calc(100vh-12rem)]">
              {/* Local User Video Box */}
              <div className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl group">
                {isConnecting ? (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                    <span className="text-xs font-medium">Connecting camera & microphone...</span>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                  />
                )}

                {isVideoOff && (
                  <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-3">
                    <div className="w-20 h-20 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-2xl font-bold">
                      {(hostName || 'H').charAt(0)}
                    </div>
                    <span className="text-xs font-semibold text-slate-300">Camera is off</span>
                  </div>
                )}

                <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-white">{hostName} (You)</span>
                  {isMuted && <MicOff className="w-3 h-3 text-rose-400" />}
                </div>
              </div>

              {/* Participant Simulated Stream / Placeholder Box */}
              {participants.slice(0, 3).map((p, idx) => (
                <div key={idx} className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl">
                  <img
                    src={`https://images.unsplash.com/photo-${1500000000000 + idx * 123456}?w=600&auto=format&fit=crop&q=80`}
                    alt={p}
                    className="w-full h-full object-cover opacity-80"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-white">{p}</span>
                    <Volume2 className="w-3 h-3 text-emerald-400 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="max-w-2xl mx-auto w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Meeting Participants ({participants.length + 1})</span>
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                      {(hostName || 'H').charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{hostName} (Host)</p>
                      <p className="text-[10px] text-emerald-400">Connected • Encrypted Stream</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                    Active Speaker
                  </span>
                </div>

                {participants.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold">
                        {(p || 'P').charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{p}</p>
                        <p className="text-[10px] text-slate-400">Team Participant</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-semibold">
                      Connected
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="max-w-2xl mx-auto w-full h-full flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-slate-800 font-bold text-xs flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>In-Call Live Chat</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((m) => (
                  <div key={m.id} className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-400">{m.sender}</span>
                      <span className="text-[10px] text-slate-500">{m.time}</span>
                    </div>
                    <p className="text-xs text-slate-200">{m.text}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Send a message to everyone..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl z-20">
          <button
            type="button"
            onClick={toggleMic}
            className={`p-3 rounded-2xl transition-all cursor-pointer ${
              isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={toggleVideo}
            className={`p-3 rounded-2xl transition-all cursor-pointer ${
              isVideoOff ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title={isVideoOff ? 'Turn on Camera' : 'Turn off Camera'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={toggleScreenShare}
            className={`p-3 rounded-2xl transition-all cursor-pointer ${
              isScreenSharing ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            <Monitor className="w-5 h-5" />
          </button>

          <div className="w-[1px] h-8 bg-slate-800 mx-1" />

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};
