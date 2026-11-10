import { Volume2, VolumeX } from 'lucide-react';
import { useEngineAudio } from '../hooks/useEngineAudio';

/** Liga e desliga o som do motor (nunca começa sozinho) e ajusta o volume. */
export function SoundToggle() {
  const { supported, enabled, volume, toggle, setVolume } = useEngineAudio();
  if (!supported) return null;

  return (
    <div className="pointer-events-auto flex items-center gap-3">
      {enabled && (
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          aria-label="Volume do motor"
          className="h-6 w-20 cursor-pointer accent-[var(--brand-accent)] lg:w-24"
        />
      )}
      <button
        type="button"
        onClick={() => void toggle()}
        aria-pressed={enabled}
        className="tag flex min-h-[36px] items-center gap-2 bg-ink/10 px-3 text-ink transition-colors duration-300 hover:bg-ink hover:text-void"
      >
        {enabled ? <Volume2 size={14} aria-hidden="true" /> : <VolumeX size={14} aria-hidden="true" />}
        {enabled ? 'Sound' : 'Mute'}
        <span className="sr-only">{enabled ? ' — desligar o som do motor' : ' — ligar o som do motor'}</span>
      </button>
    </div>
  );
}
