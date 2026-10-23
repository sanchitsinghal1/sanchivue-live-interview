import { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  PhoneOff,
  Users,
} from 'lucide-react';
import { getInitials, colorFromString } from '../../utils/formatters.js';
import { ROLE_LABELS } from '../../constants/index.js';

// VideoCallGrid — manages local getUserMedia, renders a tile per participant,
// AND wires real WebRTC peer connections so each remote participant's audio +
// video stream is rendered live in their tile. Signaling rides on the collab
// socket's `webrtc:offer`, `webrtc:answer`, `webrtc:ice-candidate` events.
//
// To avoid "glare" (both sides offering at once), we use a deterministic
// initiator rule: the participant with the lexicographically smaller id offers
// to the one with the larger id. The non-initiator only answers.
//
// Props:
//   participants — presence list, each `{ id, userId, name, email, role }`
//   currentUser  — the local user object (`{ id, name, email, role }`)
//   onHangup     — called when the user clicks the leave button
//   on           — register a socket event handler (returns an off function)
//   emit         — emit a socket event
//   roomCode     — collab room code (forwarded alongside each webrtc signal)
export default function VideoCallGrid({
  participants = [],
  currentUser,
  onHangup,
  on,
  emit,
  roomCode,
}) {
  const videoRef = useRef(null); // local <video> element
  const streamRef = useRef(null); // local MediaStream
  const peerConnsRef = useRef({}); // userId -> RTCPeerConnection
  const remoteVideoRefs = useRef({}); // userId -> <video> element
  const iceBufferRef = useRef({}); // userId -> [candidates awaiting remote description]
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [connectedPeerIds, setConnectedPeerIds] = useState(new Set());

  // --- Local media: request camera + mic once on mount -------------------
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        setPermissionError(
          err?.name === 'NotAllowedError'
            ? 'Camera/mic access denied. You can still chat and code.'
            : 'Could not access camera/mic.',
        );
      }
    })();
    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      // Tear down every peer connection on unmount.
      Object.values(peerConnsRef.current).forEach((pc) => pc.close());
      peerConnsRef.current = {};
    };
  }, []);

  // --- Helpers: build / fetch peer connections ----------------------------
  const STUN_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  const ensurePeer = (peerUserId) => {
    if (!peerUserId || peerUserId === currentUser?.id) return null;
    if (peerConnsRef.current[peerUserId]) return peerConnsRef.current[peerUserId];
    if (!streamRef.current) return null;

    const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
    peerConnsRef.current[peerUserId] = pc;
    iceBufferRef.current[peerUserId] = [];

    // Add local tracks so the remote side receives our audio/video.
    streamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, streamRef.current);
    });

    // When a remote track arrives, bind it to the matching <video> tile.
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      const el = remoteVideoRefs.current[peerUserId];
      if (el) {
        el.srcObject = remoteStream;
        el.play().catch(() => {});
      }
      setConnectedPeerIds((prev) => {
        if (prev.has(peerUserId)) return prev;
        const next = new Set(prev);
        next.add(peerUserId);
        return next;
      });
    };

    // Trickled ICE candidate → relay to peer via the collab socket.
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        emit?.('webrtc:ice-candidate', {
          roomCode,
          targetUserId: peerUserId,
          fromUserId: currentUser?.id,
          candidate: event.candidate,
        });
      }
    };

    // Whenever renegotiation is needed (e.g. a track was added), the
    // initiator side creates + sends a fresh offer.
    pc.onnegotiationneeded = async () => {
      // Deterministic initiator: smaller userId offers. Prevents glare.
      const shouldInitiate = (currentUser?.id || '') < peerUserId;
      if (!shouldInitiate) return;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        emit?.('webrtc:offer', {
          roomCode,
          targetUserId: peerUserId,
          fromUserId: currentUser?.id,
          sdp: pc.localDescription,
        });
      } catch {
        // Negotation may race on teardown — silently ignore.
      }
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === 'failed' ||
        pc.connectionState === 'closed'
      ) {
        setConnectedPeerIds((prev) => {
          if (!prev.has(peerUserId)) return prev;
          const next = new Set(prev);
          next.delete(peerUserId);
          return next;
        });
      }
    };

    return pc;
  };

  // --- React to participants entering / leaving ---------------------------
  useEffect(() => {
    if (!currentUser) return;
    const others = participants.filter((p) => p.id !== currentUser.id);
    const seenIds = new Set(others.map((p) => p.id));
    // Build connections for newcomers.
    others.forEach((p) => ensurePeer(p.id));
    // Close connections for participants who left.
    Object.keys(peerConnsRef.current).forEach((peerId) => {
      if (!seenIds.has(peerId)) {
        peerConnsRef.current[peerId]?.close();
        delete peerConnsRef.current[peerId];
        delete iceBufferRef.current[peerId];
        setConnectedPeerIds((prev) => {
          if (!prev.has(peerId)) return prev;
          const next = new Set(prev);
          next.delete(peerId);
          return next;
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants, currentUser?.id, streamRef.current]);

  // --- Socket signaling listeners -----------------------------------------
  useEffect(() => {
    if (!on || !currentUser) return undefined;

    const onOffer = async (payload) => {
      if (!payload || payload.targetUserId !== currentUser.id) return;
      const peerUserId = payload.fromUserId;
      if (!peerUserId) return;
      const pc = ensurePeer(peerUserId);
      if (!pc) return;
      try {
        await pc.setRemoteDescription(payload.sdp);
        // Flush any buffered ICE candidates now that we have a remote description.
        const buffered = iceBufferRef.current[peerUserId] || [];
        for (const c of buffered) {
          await pc.addIceCandidate(c).catch(() => {});
        }
        iceBufferRef.current[peerUserId] = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        emit?.('webrtc:answer', {
          roomCode,
          targetUserId: peerUserId,
          fromUserId: currentUser.id,
          sdp: pc.localDescription,
        });
      } catch {
        // Offer may arrive mid-teardown — ignore.
      }
    };

    const onAnswer = async (payload) => {
      if (!payload || payload.targetUserId !== currentUser.id) return;
      const peerUserId = payload.fromUserId;
      const pc = peerConnsRef.current[peerUserId];
      if (!pc) return;
      try {
        await pc.setRemoteDescription(payload.sdp);
        const buffered = iceBufferRef.current[peerUserId] || [];
        for (const c of buffered) {
          await pc.addIceCandidate(c).catch(() => {});
        }
        iceBufferRef.current[peerUserId] = [];
      } catch {
        // Ignore stale answers during teardown.
      }
    };

    const onIce = async (payload) => {
      if (!payload || payload.targetUserId !== currentUser.id) return;
      const peerUserId = payload.fromUserId;
      const pc = peerConnsRef.current[peerUserId];
      if (!pc || !payload.candidate) return;
      try {
        // If we don't yet have a remote description, buffer for later.
        if (!pc.remoteDescription || !pc.remoteDescription.type) {
          iceBufferRef.current[peerUserId] = iceBufferRef.current[peerUserId] || [];
          iceBufferRef.current[peerUserId].push(payload.candidate);
        } else {
          await pc.addIceCandidate(payload.candidate);
        }
      } catch {
        // Ignore invalid candidates — they're harmless.
      }
    };

    const offOffer = on('webrtc:offer', onOffer);
    const offAnswer = on('webrtc:answer', onAnswer);
    const offIce = on('webrtc:ice-candidate', onIce);
    return () => {
      offOffer?.();
      offAnswer?.();
      offIce?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, emit, currentUser?.id, roomCode]);

  // --- Local controls: mic / camera / screen share -----------------------
  const toggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
  };

  const toggleCam = () => {
    const next = !camOn;
    setCamOn(next);
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
  };

  const toggleShare = async () => {
    if (sharing) {
      // Stop the screen track so the underlying camera track is re-added.
      streamRef.current?.getVideoTracks().forEach((t) => {
        if (t.label?.toLowerCase().includes('screen')) t.stop();
      });
      // Re-acquire the camera so the local preview + peer senders are restored.
      try {
        const cam = await navigator.mediaDevices.getUserMedia({ video: true });
        const camTrack = cam.getVideoTracks()[0];
        if (camTrack && streamRef.current) {
          streamRef.current.addTrack(camTrack);
          if (videoRef.current) videoRef.current.srcObject = streamRef.current;
          // Replace the track on every peer connection so remotes follow.
          Object.values(peerConnsRef.current).forEach((pc) => {
            const sender = pc
              .getSenders()
              .find((s) => s.track && s.track.kind === 'video');
            if (sender) sender.replaceTrack(camTrack).catch(() => {});
          });
        }
      } catch {
        // Camera re-acquisition can fail if permissions changed; ignore.
      }
      setSharing(false);
      return;
    }
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = display.getVideoTracks()[0];
      if (!screenTrack || !streamRef.current) return;
      // Replace the video track on the local stream + every peer sender.
      const oldTrack = streamRef.current.getVideoTracks()[0];
      if (oldTrack) {
        streamRef.current.removeTrack(oldTrack);
        oldTrack.stop();
      }
      streamRef.current.addTrack(screenTrack);
      if (videoRef.current) videoRef.current.srcObject = streamRef.current;
      Object.values(peerConnsRef.current).forEach((pc) => {
        const sender = pc
          .getSenders()
          .find((s) => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack).catch(() => {});
      });
      screenTrack.onended = () => {
        setSharing(false);
      };
      setSharing(true);
    } catch {
      setSharing(false);
    }
  };

  // Render a tile per participant (excluding self — self shows the local camera).
  const others = participants.filter((p) => p.id !== currentUser?.id);

  return (
    <div className="flex h-full flex-col gap-2 bg-slate-950 p-2">
      <div className="grid flex-1 grid-cols-2 gap-2 overflow-y-auto">
        {/* Local tile (camera preview) */}
        <div className="relative min-h-[120px] overflow-hidden rounded-md border border-slate-800 bg-slate-900">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          {!camOn && (
            <div className="absolute inset-0 grid place-items-center bg-slate-900">
              <div
                className={`grid h-12 w-12 place-items-center rounded-full text-sm font-bold text-white ${colorFromString(
                  currentUser?.email || 'me',
                )}`}
              >
                {getInitials(currentUser?.name || 'Me')}
              </div>
            </div>
          )}
          <div className="absolute bottom-1 left-1 rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] text-slate-200">
            You {currentUser && ROLE_LABELS[currentUser.role] ? `· ${ROLE_LABELS[currentUser.role]}` : ''}
          </div>
          {!micOn && (
            <div className="absolute bottom-1 right-1 rounded bg-rose-500/80 p-0.5">
              <MicOff className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
        {/* Remote tiles — each gets its own <video> bound to the peer stream */}
        {others.map((p) => {
          const isConnected = connectedPeerIds.has(p.id);
          return (
            <div
              key={p.id || p.userId}
              className="relative min-h-[120px] overflow-hidden rounded-md border border-slate-800 bg-slate-900"
            >
              <video
                ref={(el) => {
                  if (el) remoteVideoRefs.current[p.id] = el;
                }}
                autoPlay
                playsInline
                className={`h-full w-full object-cover ${isConnected ? '' : 'hidden'}`}
              />
              {!isConnected && (
                <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-slate-800 to-slate-900">
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-full text-sm font-bold text-white ${colorFromString(
                      p.email || p.name || p.id,
                    )}`}
                  >
                    {getInitials(p.name || '?')}
                  </div>
                </div>
              )}
              <div className="absolute bottom-1 left-1 rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] text-slate-200">
                {p.name} {p.role ? `· ${ROLE_LABELS[p.role] || p.role}` : ''}
              </div>
              <div className="absolute right-1 top-1 flex items-center gap-1">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-brand-emerald' : 'bg-amber-500'}`}
                  title={isConnected ? 'Peer connected' : 'Connecting…'}
                />
              </div>
            </div>
          );
        })}
        {others.length === 0 && (
          <div className="grid min-h-[120px] place-items-center rounded-md border border-dashed border-slate-800 text-xs text-slate-500">
            <Users className="h-5 w-5" />
            <span>Waiting for others…</span>
          </div>
        )}
      </div>

      {permissionError && (
        <p className="rounded bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300">
          {permissionError}
        </p>
      )}

      <div className="flex items-center justify-center gap-2 border-t border-slate-800 pt-2">
        <button
          type="button"
          onClick={toggleMic}
          className={`grid h-8 w-8 place-items-center rounded-full ${
            micOn ? 'bg-slate-800 text-slate-200' : 'bg-brand-emerald text-white'
          }`}
          aria-label={micOn ? 'Mute mic' : 'Unmute mic'}
          title={micOn ? 'Mute' : 'Unmute'}
        >
          {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={toggleCam}
          className={`grid h-8 w-8 place-items-center rounded-full ${
            camOn ? 'bg-slate-800 text-slate-200' : 'bg-brand-emerald text-white'
          }`}
          aria-label={camOn ? 'Disable camera' : 'Enable camera'}
          title={camOn ? 'Camera off' : 'Camera on'}
        >
          {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={toggleShare}
          className={`grid h-8 w-8 place-items-center rounded-full ${
            sharing ? 'bg-brand-indigo text-white' : 'bg-slate-800 text-slate-200'
          }`}
          aria-label="Toggle screen share"
          title="Share screen"
        >
          <ScreenShare className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onHangup}
          className="grid h-8 w-8 place-items-center rounded-full bg-rose-500 text-white hover:bg-rose-600"
          aria-label="Leave call"
          title="Leave"
        >
          <PhoneOff className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
