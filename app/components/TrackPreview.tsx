interface Track {
  track_id: string;
  track_name: string;
  track_url: string;
  track_duration_seconds: number;
}

interface TrackPreviewProps {
  track: Track;
  onRemove?: (trackId: string) => void;
}

const formatDuration = (value: number): string => {
  const totalSeconds = Math.max(0, Math.round(value));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = `${totalSeconds % 60}`.padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const TrackPreview = ({ track, onRemove }: TrackPreviewProps) => {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 px-5 py-4 shadow-md shadow-slate-100">
      <div className="max-w-[75%]">
        <p className="text-base font-semibold text-slate-900">
          {track.track_name}
        </p>
        <p className="text-sm text-slate-600">
          Duration: {formatDuration(track.track_duration_seconds)}
        </p>
        <a
          href={track.track_url}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-indigo-600 underline hover:text-indigo-500"
        >
          Open R2 object
        </a>
      </div>
      {onRemove ? (
        <button
          type="button"
          className="rounded-xl border border-red-200 px-3 py-1 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          onClick={() => onRemove(track.track_id)}
        >
          Remove
        </button>
      ) : null}
    </div>
  );
};

export default TrackPreview;
