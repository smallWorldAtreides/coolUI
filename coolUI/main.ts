import './style.scss';

document.addEventListener('DOMContentLoaded', () => {
  const interBubble = document.querySelector<HTMLDivElement>('.interactive')!;
  const bubbles = Array.from(document.querySelectorAll<HTMLDivElement>('.g1, .g2, .g3, .g4, .g5'));
  const fileInput = document.getElementById('audioUpload') as HTMLInputElement | null;

  let curX = 0, curY = 0;
  let tgX = 0, tgY = 0;
  let wobbleAngle = 0;

  // --- Audio setup ---
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  let audio = new Audio();
  let source: MediaElementAudioSourceNode | null = null;
  let audioLoaded = false;

  function ensureAudioSource() {
    if (!source && audio.src) {
      source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      audioLoaded = true;
    }
  }

  function resumeAudioContextOnce() {
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    if (audioLoaded) audio.play().catch(() => {});
    window.removeEventListener('pointerdown', resumeAudioContextOnce);
    window.removeEventListener('click', resumeAudioContextOnce);
  }
  window.addEventListener('pointerdown', resumeAudioContextOnce);
  window.addEventListener('click', resumeAudioContextOnce);

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      audio.src = url;
      audio.loop = true;
      ensureAudioSource();
      audio.play().catch(() => {});
    });
  }

  function getFreqBands() {
    analyser.getByteFrequencyData(dataArray);
    const bass = average(dataArray.slice(12,45));
    const mids = average(dataArray.slice(50, 70));
    const highs = average(dataArray.slice(80, Math.min(120, dataArray.length)));
    return { bass, mids, highs };
  }

  function average(arr: Uint8Array | number[]) {
    if (!arr || arr.length === 0) return 0;
    let s = 0;
    for (let i = 0; i < arr.length; i++) s += arr[i];
    return s / arr.length;
  }

  function clamp01(v: number) {
    return Math.max(0, Math.min(1, v));
  }

  function move() {
    const { bass, mids, highs } = getFreqBands();
    const nbass = clamp01(bass / 255);
    const nmids = clamp01(mids / 255);
    const nhighs = clamp01(highs / 255);

    // Interaktive Bubble flüssig bewegen
    curX += (tgX - curX) / 15;
    curY += (tgY - curY) / 15;

    wobbleAngle += 0.12;
    const wobbleX = 1 + Math.sin(wobbleAngle * 0.9) * 0.12 + nbass * 2;
    const wobbleY = 1 + Math.cos(wobbleAngle * 0.7) * 0.08 + nbass * 1.8;

    interBubble.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px) scale(${wobbleX.toFixed(3)}, ${wobbleY.toFixed(3)})`;

    // Alle anderen Bubbles
    bubbles.forEach((b, i) => {
      const rect = b.getBoundingClientRect();
      const interRect = interBubble.getBoundingClientRect();

      // --- Frequenzband pro Bubble ---
      let bandValue = 0;
      if (b === 0) bandValue = nbass;
      else if (b === 1) bandValue = nmids;
      else if (b === 2) bandValue = nhighs;
      else bandValue = (nbass + nmids + nhighs) / 3;

      const basePulse = 0.8 + bandValue * 2 + Math.sin(wobbleAngle * 0.7 + i) * 0.2; // kleiner starten, stärker reagieren

      let pullX = 0;
      let pullY = 0;
      let finalScale = basePulse*1.7;

      b.style.transform = `translate(${pullX.toFixed(2)}px, ${pullY.toFixed(2)}px) scale(${finalScale.toFixed(3)})`;
    });

    requestAnimationFrame(move);
  }

  window.addEventListener('mousemove', (e) => {
    tgX = e.clientX;
    tgY = e.clientY;
  });

  move();
});
