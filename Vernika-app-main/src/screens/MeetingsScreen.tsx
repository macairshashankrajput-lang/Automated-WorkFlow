import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  MonitorOff, 
  PhoneOff, 
  MessageSquare, 
  Users, 
  Plus, 
  Search, 
  Copy, 
  Play, 
  Clock, 
  Sparkles, 
  Send, 
  Radio, 
  Volume2, 
  VolumeX, 
  UserPlus, 
  Maximize2, 
  Minimize2, 
  ShieldCheck, 
  CheckCircle2, 
  X,
  Settings,
  MoreVertical,
  Hand,
  Disc,
  Share2,
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { MeetingSession, MeetingParticipant, MeetingChatMessage } from '../types';
import { Modal } from '../components/common/Modal';
import { auth, db } from '../lib/firebase';
import { addDoc, collection, onSnapshot, query, where } from 'firebase/firestore';

// Web Audio API soft sound synthesizer
const playMeetingChime = (type: 'join' | 'leave' | 'hand' | 'rec') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'join') {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'leave') {
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'hand') {
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1040, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {
    // Autoplay policy fallback
  }
};

export const MeetingsScreen: React.FC = () => {
  const { 
    meetings, 
    addMeeting, 
    updateMeetingStatus, 
    joinMeetingCall, 
    leaveMeetingCall, 
    updateMeetingParticipantState, 
    sendMeetingChatMessage, 
    employees,
    clients
  } = useApp();
  const { role, user } = useAuth();

  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [dept, setDept] = useState('Engineering & Technology');
  const [scheduledTime, setScheduledTime] = useState('02:00 PM - 02:45 PM');
  const [duration, setDuration] = useState(45);
  const [meetingType, setMeetingType] = useState<MeetingSession['meetingType']>('Team Sync');
  const [participantsText, setParticipantsText] = useState('');

  // Video Room Live Hardware State
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [inMeetingInput, setInMeetingInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'scheduled'>('all');
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaReadyTick, setMediaReadyTick] = useState(0);

  // Media Stream Ref
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const offeredPeersRef = useRef<Set<string>>(new Set());
  const inMeetingChatEndRef = useRef<HTMLDivElement | null>(null);

  const normalizedMeetings = useMemo(() => (Array.isArray(meetings) ? meetings : []).filter(Boolean).map((meeting) => ({
    ...meeting,
    participants: Array.isArray(meeting.participants) ? meeting.participants : [],
    activeParticipants: Array.isArray(meeting.activeParticipants) ? meeting.activeParticipants : [],
    liveMessages: Array.isArray(meeting.liveMessages) ? meeting.liveMessages : []
  })), [meetings]);
  const activeCallModal = normalizedMeetings.find((m) => m.id === activeMeetingId) || null;

  // Real WebRTC User Media Stream on entering room
  useEffect(() => {
    let active = true;

    if (activeMeetingId && user) {
      setCallDuration(0);
      playMeetingChime('join');

      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      // Register participant in Firestore
      const myParticipant: MeetingParticipant = {
        id: user.id || `user-${Date.now()}`,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        isMuted: !isMicOn,
        isVideoOff: !isCameraOn,
        isScreenSharing: false,
        isHandRaised: false,
        joinedAt: new Date().toISOString(),
      };
      joinMeetingCall(activeMeetingId, myParticipant);

      const startCamera = async () => {
        try {
          if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser does not expose camera and microphone access.');
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true,
          });
          if (active) {
            mediaStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            setMediaError(null);
            setMediaReadyTick((tick) => tick + 1);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Camera or microphone permission was denied.';
          setMediaError(message);
          console.warn('Meeting media capture failed:', message);
        }
      };

      startCamera();

      return () => {
        active = false;
        clearInterval(interval);
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
      };
    }
  }, [activeMeetingId]);

  useEffect(() => {
    if (!activeMeetingId || !user?.id || mediaReadyTick === 0) return;
    const localId = user.id;
    const remoteIds = (activeCallModal?.activeParticipants || [])
      .map((participant: any) => typeof participant === 'string' ? '' : participant.id)
      .filter((id): id is string => Boolean(id && id !== localId));
    const signalQuery = query(collection(db, 'meetingSignals'), where('meetingId', '==', activeMeetingId), where('toId', '==', localId));
    const handledSignalIds = new Set<string>();
    const rtcConfig: RTCConfiguration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    let disposed = false;

    const sendSignal = async (toId: string, payload: Record<string, unknown>) => {
      await addDoc(collection(db, 'meetingSignals'), { meetingId: activeMeetingId, fromId: localId, toId, createdAt: new Date().toISOString(), ...payload });
    };
    const ensurePeer = (peerId: string) => {
      let peer = peerConnectionsRef.current.get(peerId);
      if (peer) return peer;
      peer = new RTCPeerConnection(rtcConfig);
      mediaStreamRef.current?.getTracks().forEach((track) => peer?.addTrack(track, mediaStreamRef.current as MediaStream));
      peer.onicecandidate = (event) => {
        if (event.candidate) void sendSignal(peerId, { type: 'candidate', candidate: event.candidate.toJSON() });
      };
      peer.ontrack = (event) => {
        const stream = event.streams[0];
        if (stream) setRemoteStreams((previous) => ({ ...previous, [peerId]: stream }));
      };
      peer.onconnectionstatechange = () => {
        if (peer?.connectionState === 'failed' || peer?.connectionState === 'closed' || peer?.connectionState === 'disconnected') {
          setRemoteStreams((previous) => { const next = { ...previous }; delete next[peerId]; return next; });
        }
      };
      peerConnectionsRef.current.set(peerId, peer);
      return peer;
    };

    const unsubscribe = onSnapshot(signalQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'removed' || handledSignalIds.has(change.doc.id)) return;
        handledSignalIds.add(change.doc.id);
        const signal = change.doc.data() as any;
        if (!signal.fromId || signal.fromId === localId) return;
        const peer = ensurePeer(signal.fromId);
        void (async () => {
          try {
            if (signal.type === 'offer' && signal.sdp) {
              await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
              const answer = await peer.createAnswer();
              await peer.setLocalDescription(answer);
              await sendSignal(signal.fromId, { type: 'answer', sdp: answer });
            } else if (signal.type === 'answer' && signal.sdp) {
              await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            } else if (signal.type === 'candidate' && signal.candidate) {
              await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
          } catch (error) {
            console.warn('Meeting signaling message ignored:', error);
          }
        })();
      });
    }, (error) => setMediaError(`Meeting signaling unavailable: ${error.message}`));

    remoteIds.forEach((peerId) => {
      const peer = ensurePeer(peerId);
      if (localId < peerId && !offeredPeersRef.current.has(peerId)) {
        offeredPeersRef.current.add(peerId);
        void (async () => {
          try {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            await sendSignal(peerId, { type: 'offer', sdp: offer });
          } catch (error) {
            console.warn('Meeting offer creation failed:', error);
          }
        })();
      }
    });

    return () => {
      disposed = true;
      unsubscribe();
      remoteIds.forEach((peerId) => {
        const peer = peerConnectionsRef.current.get(peerId);
        peer?.close();
        peerConnectionsRef.current.delete(peerId);
      });
      if (disposed) setRemoteStreams({});
    };
  }, [activeMeetingId, user?.id, mediaReadyTick, (activeCallModal?.activeParticipants || []).map((participant: any) => typeof participant === 'string' ? participant : participant.id).join(',')]);

  useEffect(() => {
    inMeetingChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeCallModal?.liveMessages]);

  const toggleCamera = () => {
    const nextState = !isCameraOn;
    if (mediaStreamRef.current) {
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      videoTracks.forEach((t) => (t.enabled = nextState));
    }
    setIsCameraOn(nextState);
    if (activeMeetingId && user) {
      updateMeetingParticipantState(activeMeetingId, user.id, { isVideoOff: !nextState });
    }
  };

  const toggleMic = () => {
    const nextState = !isMicOn;
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach((t) => (t.enabled = nextState));
    }
    setIsMicOn(nextState);
    if (activeMeetingId && user) {
      updateMeetingParticipantState(activeMeetingId, user.id, { isMuted: !nextState });
    }
  };

  const toggleHand = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    if (nextState) playMeetingChime('hand');
    if (activeMeetingId && user) {
      updateMeetingParticipantState(activeMeetingId, user.id, { isHandRaised: nextState });
    }
  };

  const toggleRecording = () => {
    const next = !isRecording;
    setIsRecording(next);
    playMeetingChime('rec');
    if (activeMeetingId && user) {
      sendMeetingChatMessage(activeMeetingId, {
        meetingId: activeMeetingId,
        senderId: 'sys',
        senderName: 'System Bulletin',
        text: next ? `⏺️ Meeting recording was initiated by ${user.name}.` : `⏹️ Meeting recording was stopped.`,
      });
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
          }
          setIsScreenSharing(true);
          if (activeMeetingId && user) {
            updateMeetingParticipantState(activeMeetingId, user.id, { isScreenSharing: true });
          }
          screenStream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
            if (activeMeetingId && user) {
              updateMeetingParticipantState(activeMeetingId, user.id, { isScreenSharing: false });
            }
            if (mediaStreamRef.current && localVideoRef.current) {
              localVideoRef.current.srcObject = mediaStreamRef.current;
            }
          };
        }
      } catch (err) {
        console.warn('Screen share cancelled or not allowed:', err);
      }
    } else {
      if (mediaStreamRef.current && localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStreamRef.current;
      }
      setIsScreenSharing(false);
      if (activeMeetingId && user) {
        updateMeetingParticipantState(activeMeetingId, user.id, { isScreenSharing: false });
      }
    }
  };

  const handleSendInMeetingChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inMeetingInput.trim() || !activeMeetingId || !user) return;

    sendMeetingChatMessage(activeMeetingId, {
      meetingId: activeMeetingId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      text: inMeetingInput.trim(),
    });
    setInMeetingInput('');
  };

  const handleInvitePerson = (name: string) => {
    if (!activeCallModal || !activeMeetingId) return;
    if (!activeCallModal.participants.includes(name)) {
      sendMeetingChatMessage(activeMeetingId, {
        meetingId: activeMeetingId,
        senderId: 'sys',
        senderName: 'System Bulletin',
        text: `📬 ${name} has been invited to join this video conference.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }
    setIsInviteOpen(false);
  };

  const handleLeaveCall = () => {
    playMeetingChime('leave');
    if (activeMeetingId && user) {
      leaveMeetingCall(activeMeetingId, user.id);
    }
    setActiveMeetingId(null);
  };

  const filteredMeetings = normalizedMeetings.filter((m) => {
    if (!m) return false;
    const s = (search || '').toLowerCase();
    const t = (m.title || '').toLowerCase();
    const h = (m.hostName || '').toLowerCase();
    const d = (m.department || '').toLowerCase();
    const matchesSearch = !s || t.includes(s) || h.includes(s) || d.includes(s);
    
    if (activeTab === 'live') return matchesSearch && m.status === 'Live';
    if (activeTab === 'scheduled') return matchesSearch && m.status === 'Scheduled';
    return matchesSearch;
  });

  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !user) return;
    const participantsList = participantsText.split(',').map((p) => p.trim()).filter(Boolean);
    if (!participantsList.includes(user.name)) participantsList.push(user.name);

    await addMeeting({
      title,
      hostName: user.name,
      hostEmail: user.email,
      department: dept,
      scheduledTime,
      durationMinutes: Number(duration),
      status: 'Scheduled',
      meetingType,
      participants: participantsList,
      meetingLink: `https://meet.vernika.io/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    });
    setIsAddOpen(false);
    setTitle('');
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xs transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Virtual Meeting Rooms & Video Calls
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Real-Time Mesh Live</span>
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Direct peer-to-peer video and audio with Firestore signaling, live screen sharing, synchronized group chat, and authenticated staff invitations.
          </p>
          {mediaError && <p role="alert" className="mt-2 text-[11px] font-semibold text-amber-600 dark:text-amber-400">{mediaError} Allow camera and microphone access, then re-enter the room.</p>}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Session</span>
          </button>
        </div>
      </div>

      {/* Quick Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meetings by subject, host, or department..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Sessions ({meetings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'live'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Now ({meetings.filter(m => m.status === 'Live').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scheduled')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'scheduled'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Scheduled ({meetings.filter(m => m.status === 'Scheduled').length})
          </button>
        </div>
      </div>

      {/* Meetings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMeetings.map((mtg) => {
          const isLive = mtg.status === 'Live';
          const activeCount = mtg.activeParticipants?.length || 0;
          return (
            <div
              key={mtg.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-slate-700 rounded-3xl p-5 shadow-xs dark:shadow-xl transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isLive && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>LIVE ({activeCount} in call)</span>
                      </span>
                    )}
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      isLive ? 'hidden' :
                      mtg.status === 'Ended' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' :
                      'bg-emerald-50 dark:bg-blue-500/20 text-emerald-700 dark:text-blue-300 border border-emerald-200 dark:border-blue-500/30'
                    }`}>
                      {mtg.status}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{mtg.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Host: <span className="text-slate-800 dark:text-white font-semibold">{mtg.hostName}</span> ({mtg.department})</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-mono">{mtg.scheduledTime} ({mtg.durationMinutes} mins)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>{mtg.participants.length} Invited • {mtg.meetingType}</span>
                  </div>
                </div>

                {/* Participants chips */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {mtg.participants.slice(0, 4).map((p, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-[10px] text-slate-700 dark:text-slate-300">
                      {typeof p === 'string' ? p : p.name}
                    </span>
                  ))}
                  {mtg.participants.length > 4 && (
                    <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-[10px] text-slate-500">
                      +{mtg.participants.length - 4}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (mtg.meetingLink) {
                      navigator.clipboard?.writeText(mtg.meetingLink);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Copy className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveMeetingId(mtg.id);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all ${
                    isLive ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isLive ? 'Join Live Room' : 'Start Video Call'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Fullscreen Video Conference Room */}
      {activeCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-6xl h-[90vh] shadow-2xl flex flex-col overflow-hidden text-xs">
            
            {/* Top Bar inside Video Call */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/90">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white tracking-tight">{activeCallModal.title}</h2>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      {formatTimer(callDuration)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">{activeCallModal.meetingType} • Hosted by {activeCallModal.hostName}</p>
                </div>
              </div>

              {/* Status and Action Badges */}
              <div className="flex items-center gap-2">
                {isRecording && (
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>REC ({formatTimer(callDuration)})</span>
                  </span>
                )}
                {isHandRaised && (
                  <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                    <Hand className="w-3 h-3 text-amber-400" />
                    <span>Hand Raised</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invite Staff</span>
                </button>
              </div>
            </div>

            {/* Video Mesh Center Stage */}
            <div className="flex-1 flex overflow-hidden p-4 gap-4 bg-slate-950 relative">
              
              {/* Main Participant Video Grid */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto custom-scrollbar">
                
                {/* Local Video Card (You) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden flex items-center justify-center group min-h-[220px]">
                  {isCameraOn ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">
                        {user?.name?.slice(0, 2).toUpperCase() || 'ME'}
                      </div>
                      <p className="text-xs font-bold text-white">{user?.name} (You)</p>
                      <p className="text-[10px] text-slate-500">Camera is muted</p>
                    </div>
                  )}

                  {/* Top Status Indicators */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-950/70 backdrop-blur-xs px-2.5 py-1 rounded-xl text-[10px] text-white">
                    <span className="font-semibold">{user?.name || 'You'} (You)</span>
                    {!isMicOn && <MicOff className="w-3 h-3 text-rose-400 ml-1" />}
                    {isHandRaised && <Hand className="w-3 h-3 text-amber-400 ml-1" />}
                  </div>

                  {/* Speaking audio wave indicator */}
                  {isMicOn && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-0.5 bg-slate-950/70 px-2 py-1 rounded-lg">
                      <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" />
                      <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce delay-75" />
                      <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce delay-150" />
                    </div>
                  )}
                </div>

                {/* Remote Participants Video Tiles */}
                {(activeCallModal.activeParticipants || [])
                  .map((p: any, idx: number) => {
                    const participant: MeetingParticipant = typeof p === 'string'
                      ? { id: `p-${idx}`, name: p, role: 'Attendee', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }
                      : p;
                    return participant;
                  })
                  .filter((p) => p.id !== user?.id && p.name !== user?.name)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden flex items-center justify-center min-h-[220px]"
                    >
                      <div className="text-center space-y-2 p-4">
                        <div className="relative inline-block">
                          {remoteStreams[p.id] && !p.isVideoOff ? <video autoPlay playsInline ref={(element) => { if (element && element.srcObject !== remoteStreams[p.id]) element.srcObject = remoteStreams[p.id]; }} className="w-full h-40 rounded-xl object-cover ring-2 ring-emerald-500/50" /> : <img
                            src={p.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={p.name}
                            className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500/50 mx-auto"
                          />}
                          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
                        </div>
                        <p className="text-xs font-bold text-white">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.role || 'Participant'} • Live Audio Active</p>
                      </div>

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-950/70 backdrop-blur-xs px-2.5 py-1 rounded-xl text-[10px] text-white">
                        <span className="font-semibold">{p.name}</span>
                        {p.isMuted && <MicOff className="w-3 h-3 text-rose-400 ml-1" />}
                        {p.isHandRaised && <Hand className="w-3 h-3 text-amber-400 ml-1" />}
                      </div>

                      {/* Remote Audio waveform */}
                      {!p.isMuted && remoteStreams[p.id] && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-0.5 bg-slate-950/70 px-2 py-1 rounded-lg">
                          <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" />
                          <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce delay-100" />
                          <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce delay-200" />
                        </div>
                      )}
                    </div>
                  ))}

                {(activeCallModal.activeParticipants || []).filter((p: any) => (typeof p === 'string' ? p !== user?.name : p.id !== user?.id)).length === 0 && (
                  <div className="md:col-span-2 min-h-[220px] rounded-2xl border border-dashed border-slate-700 flex items-center justify-center text-center p-6">
                    <div><Users className="w-8 h-8 mx-auto text-slate-600 mb-2" /><p className="text-sm font-semibold text-slate-300">Waiting for invited participants</p><p className="text-xs text-slate-500 mt-1">Only authenticated users who join this room will appear here.</p></div>
                  </div>
                )}
              </div>

              {/* In-Call Live Chat Drawer */}
              {isChatOpen && (
                <div className="w-80 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>In-Call Chat</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsChatOpen(false)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                    {(activeCallModal.liveMessages || []).map((msg, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-emerald-400">{msg.senderName}</span>
                          <span className="text-slate-500">{msg.time}</span>
                        </div>
                        <p className="text-xs text-slate-200 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                          {msg.text}
                        </p>
                      </div>
                    ))}
                    <div ref={inMeetingChatEndRef} />
                  </div>

                  <form onSubmit={handleSendInMeetingChat} className="p-2 border-t border-slate-800 flex gap-1.5">
                    <input
                      type="text"
                      value={inMeetingInput}
                      onChange={(e) => setInMeetingInput(e.target.value)}
                      placeholder="Type to meeting..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}

              {/* Participants Drawer */}
              {isParticipantsOpen && (
                <div className="w-72 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      <span>Participants</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsParticipantsOpen(false)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    <div className="p-2 bg-slate-950 rounded-xl flex items-center justify-between">
                      <span className="text-white font-bold">{user?.name} (Host)</span>
                      <span className="text-[10px] text-emerald-400 font-mono">You</span>
                    </div>
                    {activeCallModal.participants.map((p, idx) => (
                      <div key={idx} className="p-2 bg-slate-950/60 rounded-xl flex items-center justify-between">
                        <span className="text-slate-300">{typeof p === 'string' ? p : p.name}</span>
                        <span className="text-[10px] text-slate-500">Connected</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Call Control Bar */}
            <div className="h-18 px-6 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between shrink-0">
              
              {/* Left Info */}
              <div className="flex items-center gap-2 text-slate-400 text-[11px] hidden sm:flex">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>AES-256 Cloud Encrypted Meeting</span>
              </div>

              {/* Center Controls */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Mute Mic */}
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`p-3 rounded-2xl font-bold transition-all cursor-pointer ${
                    isMicOn
                      ? 'bg-slate-800 hover:bg-slate-700 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                  title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                {/* Camera Toggle */}
                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`p-3 rounded-2xl font-bold transition-all cursor-pointer ${
                    isCameraOn
                      ? 'bg-slate-800 hover:bg-slate-700 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                  title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>

                {/* Screen Share */}
                <button
                  type="button"
                  onClick={toggleScreenShare}
                  className={`p-3 rounded-2xl font-bold transition-all cursor-pointer ${
                    isScreenSharing
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                  title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
                >
                  {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                </button>

                {/* Raise Hand */}
                <button
                  type="button"
                  onClick={toggleHand}
                  className={`p-3 rounded-2xl font-bold transition-all cursor-pointer ${
                    isHandRaised
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                  title="Raise Hand"
                >
                  <Hand className="w-4 h-4" />
                </button>

                {/* Record Button */}
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-3 rounded-2xl font-bold transition-all cursor-pointer ${
                    isRecording
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                  title={isRecording ? 'Stop Recording' : 'Start Recording'}
                >
                  <Disc className="w-4 h-4" />
                </button>

                {/* Open Chat */}
                <button
                  type="button"
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className={`p-3 rounded-2xl font-bold transition-all cursor-pointer ${
                    isChatOpen
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                  title="In-Call Chat"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>

                {/* Open Participants */}
                <button
                  type="button"
                  onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
                  className={`p-3 rounded-2xl font-bold transition-all cursor-pointer ${
                    isParticipantsOpen
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                  title="Participants"
                >
                  <Users className="w-4 h-4" />
                </button>

                {/* End / Leave Call */}
                <button
                  type="button"
                  onClick={handleLeaveCall}
                  className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/30"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Leave Room</span>
                </button>
              </div>

              {/* Right Link Copy */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (activeCallModal.meetingLink) {
                      navigator.clipboard?.writeText(activeCallModal.meetingLink);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Copied Link' : 'Share'}</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Schedule New Virtual Video Room"
      >
        <form onSubmit={handleSaveMeeting} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Meeting Title / Agenda
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Strategic Roadmapping & Budget Session"
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="Engineering & Technology">Engineering & Technology</option>
                <option value="Executive Board">Executive Board</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Sales & CRM">Sales & CRM</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Meeting Classification
              </label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value as any)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="Team Sync">Team Sync</option>
                <option value="Client Review">Client Review</option>
                <option value="All Hands">All Hands</option>
                <option value="1-on-1">1-on-1 Session</option>
                <option value="Technical Review">Technical Review</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Time Slot
              </label>
              <input
                type="text"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="e.g. 02:00 PM - 02:45 PM"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Invite Attendees (Comma Separated)
            </label>
            <textarea
              rows={2}
              value={participantsText}
              onChange={(e) => setParticipantsText(e.target.value)}
              placeholder="Enter attendee names or emails"
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              Create Meeting Room
            </button>
          </div>
        </form>
      </Modal>

      {/* Invite People In-Call Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite Staff or Clients to Room"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            Click any colleague or client account to send an instant video call broadcast notification to their screen:
          </p>

          <div className="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar">
            <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Employees</div>
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={emp.avatar}
                    alt={emp.name}
                    className="w-7 h-7 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{emp.name}</p>
                    <p className="text-[10px] text-slate-500">{emp.position}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleInvitePerson(emp.name)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  Invite
                </button>
              </div>
            ))}

            <div className="text-[10px] font-bold uppercase text-slate-400 mt-3 mb-1">Clients</div>
            {clients.map((cli) => (
              <div
                key={cli.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={cli.avatar}
                    alt={cli.name}
                    className="w-7 h-7 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{cli.name}</p>
                    <p className="text-[10px] text-slate-500">{cli.company}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleInvitePerson(cli.name)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  Invite
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => setIsInviteOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
