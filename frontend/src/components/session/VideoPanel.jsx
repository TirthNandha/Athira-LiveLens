import { useRef, useEffect } from "react";

function VideoTile({ stream, muted, label }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
          Waiting for {label}…
        </div>
      )}
      <span className="absolute bottom-1.5 left-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded">
        {label}
      </span>
    </div>
  );
}

export default function VideoPanel({
  localStream,
  remoteStream,
  peerReady,
  onCall,
}) {
  return (
    <div className="flex flex-col gap-2">
      <VideoTile stream={remoteStream} muted={false} label="Remote" />
      <VideoTile stream={localStream} muted={true} label="You" />
      {peerReady && !remoteStream && (
        <button
          onClick={onCall}
          className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          Connect Video
        </button>
      )}
    </div>
  );
}
