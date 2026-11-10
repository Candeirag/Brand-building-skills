import { useCallback, useEffect, useRef, useState } from 'react';
import { audioConfig, heroRun } from '../config/siteConfig';
import { liveRpm } from '../lib/dynoPhysics';
import { dyno, setFlag } from '../state/dynoStore';

/**
 * Som de motor sincronizado com o RPM.
 *
 * Por padrão é sintetizado com Web Audio (osciladores na frequência de
 * explosão + ruído filtrado), então não depende de arquivo nem de licença.
 * Com `audioConfig.src` definido, toca o loop indicado e muda o tom com o RPM.
 *
 * O áudio só começa depois de um clique (política dos navegadores) e nunca
 * sozinho.
 */
interface Engine {
  context: AudioContext;
  master: GainNode;
  update: (rpm: number, load: number, audible: number) => void;
  dispose: () => void;
}

function createSynth(context: AudioContext, master: GainNode): Pick<Engine, 'update' | 'dispose'> {
  const mix = context.createGain();
  const shaper = context.createWaveShaper();
  const curve = new Float32Array(512);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * 2.6);
  }
  shaper.curve = curve;
  const lowpass = context.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.Q.value = 0.9;

  const voices: [OscillatorType, number, number][] = [
    ['sawtooth', 1, 0.42],
    ['square', 0.5, 0.3],
    ['triangle', 0.25, 0.5],
    ['sawtooth', 2.01, 0.1],
  ];
  const oscillators = voices.map(([type, ratio, gain]) => {
    const osc = context.createOscillator();
    osc.type = type;
    const g = context.createGain();
    g.gain.value = gain;
    osc.connect(g).connect(mix);
    osc.start();
    return { osc, ratio };
  });

  // Ruído de admissão e escape: cresce com a carga.
  const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const noise = context.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;
  const band = context.createBiquadFilter();
  band.type = 'bandpass';
  band.Q.value = 0.8;
  const noiseGain = context.createGain();
  noiseGain.gain.value = 0;
  noise.connect(band).connect(noiseGain).connect(mix);
  noise.start();

  // Marcha lenta irregular: tremor lento que some com a rotação.
  const lumpDepth = context.createGain();
  const lump = context.createOscillator();
  lump.type = 'sine';
  lump.connect(lumpDepth).connect(mix.gain);
  lump.start();

  mix.connect(shaper).connect(lowpass).connect(master);

  return {
    update(rpm, load, audible) {
      const now = context.currentTime;
      const firing = (rpm / 60) * (audioConfig.cylinders / 2);
      for (const { osc, ratio } of oscillators) osc.frequency.setTargetAtTime(firing * ratio, now, 0.04);
      const norm = (rpm - heroRun.idleRpm) / (heroRun.redline - heroRun.idleRpm);
      lowpass.frequency.setTargetAtTime(260 + rpm * (0.35 + 0.75 * load), now, 0.06);
      band.frequency.setTargetAtTime(500 + rpm * 0.28, now, 0.06);
      noiseGain.gain.setTargetAtTime(0.03 + 0.26 * load * norm, now, 0.08);
      lump.frequency.setTargetAtTime(rpm / 120, now, 0.05);
      lumpDepth.gain.setTargetAtTime(0.22 * (1 - Math.min(1, norm * 2.5)), now, 0.1);
      mix.gain.setTargetAtTime((0.42 + 0.4 * load + 0.18 * norm) * audible, now, 0.08);
    },
    dispose() {
      oscillators.forEach(({ osc }) => osc.stop());
      noise.stop();
      lump.stop();
      mix.disconnect();
    },
  };
}

async function createSampler(
  context: AudioContext,
  master: GainNode,
  src: string,
): Promise<Pick<Engine, 'update' | 'dispose'>> {
  const response = await fetch(src);
  if (!response.ok) throw new Error(`áudio não encontrado: ${src}`);
  const buffer = await context.decodeAudioData(await response.arrayBuffer());
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const gain = context.createGain();
  gain.gain.value = 0;
  source.connect(gain).connect(master);
  source.start();
  return {
    update(rpm, load, audible) {
      const now = context.currentTime;
      source.playbackRate.setTargetAtTime(rpm / audioConfig.sampleRpm, now, 0.05);
      gain.gain.setTargetAtTime((0.5 + 0.5 * load) * audible, now, 0.08);
    },
    dispose() {
      source.stop();
      gain.disconnect();
    },
  };
}

export function useEngineAudio() {
  const engine = useRef<Engine | null>(null);
  const frame = useRef(0);
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolumeState] = useState(audioConfig.volume);
  const [supported] = useState(() => typeof window !== 'undefined' && 'AudioContext' in window);

  const stopLoop = () => cancelAnimationFrame(frame.current);

  const startLoop = useCallback(() => {
    stopLoop();
    const loop = (time: number) => {
      const current = engine.current;
      if (!current) return;
      const sample = dyno.sample;
      // O motor só se ouve enquanto o hero está na tela e a aba está visível.
      const heroVisible = window.scrollY < document.getElementById('inicio')!.offsetHeight - 40;
      const audible = heroVisible && !document.hidden ? 1 : 0;
      current.update(liveRpm(sample, time / 1000), sample.load, audible);
      frame.current = requestAnimationFrame(loop);
    };
    frame.current = requestAnimationFrame(loop);
  }, []);

  const toggle = useCallback(async () => {
    if (!supported) return;
    if (enabled) {
      setEnabled(false);
      setFlag('sound', false);
      stopLoop();
      await engine.current?.context.suspend();
      return;
    }
    if (!engine.current) {
      const context = new AudioContext();
      const master = context.createGain();
      master.gain.value = volume * 0.5;
      master.connect(context.destination);
      let voice: Pick<Engine, 'update' | 'dispose'>;
      try {
        voice = audioConfig.src
          ? await createSampler(context, master, audioConfig.src)
          : createSynth(context, master);
      } catch (error) {
        console.warn('[audio] loop indisponível, usando o motor sintetizado.', error);
        voice = createSynth(context, master);
      }
      engine.current = { context, master, ...voice };
    }
    await engine.current.context.resume();
    setEnabled(true);
    setFlag('sound', true);
    startLoop();
  }, [enabled, startLoop, supported, volume]);

  const setVolume = useCallback((value: number) => {
    setVolumeState(value);
    const current = engine.current;
    if (current) current.master.gain.setTargetAtTime(value * 0.5, current.context.currentTime, 0.05);
  }, []);

  useEffect(
    () => () => {
      stopLoop();
      engine.current?.dispose();
      void engine.current?.context.close();
      engine.current = null;
      setFlag('sound', false);
    },
    [],
  );

  return { supported, enabled, volume, toggle, setVolume };
}
