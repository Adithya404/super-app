let audioContext: AudioContext | null = null;
let ringTimer: ReturnType<typeof setInterval> | null = null;
let activeOscillators: OscillatorNode[] = [];

function stopOscillators() {
  for (const osc of activeOscillators) {
    try {
      osc.stop();
      osc.disconnect();
    } catch {
      // already stopped
    }
  }
  activeOscillators = [];
}

export function stopIncomingCallRingtone() {
  if (ringTimer) {
    clearInterval(ringTimer);
    ringTimer = null;
  }
  stopOscillators();
  if (audioContext) {
    void audioContext.close();
    audioContext = null;
  }
}

function playRingBurst(ctx: AudioContext) {
  const gain = ctx.createGain();
  gain.gain.value = 0.08;
  gain.connect(ctx.destination);

  const freqs = [440, 480];
  for (const freq of freqs) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.9);
    activeOscillators.push(osc);
  }
}

export function startIncomingCallRingtone() {
  stopIncomingCallRingtone();

  audioContext = new AudioContext();
  void audioContext.resume();

  playRingBurst(audioContext);
  ringTimer = setInterval(() => {
    if (!audioContext) return;
    void audioContext.resume();
    playRingBurst(audioContext);
  }, 3000);
}

export async function playRemoteStream(stream: MediaStream, element: HTMLMediaElement) {
  element.srcObject = stream;
  element.muted = false;
  try {
    await element.play();
  } catch {
    // Autoplay may be blocked until user interaction; accept/start call counts as one.
  }
}
