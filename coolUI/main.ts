import './style.scss';

document.addEventListener('DOMContentLoaded', () => {
  const interBubble = document.querySelector<HTMLDivElement>('.interactive')!;
  const fileInput = document.getElementById('audioUpload') as HTMLInputElement | null;
  
  // Audio control elements
  const playPauseBtn = document.getElementById('playPauseBtn') as HTMLButtonElement;
  const muteBtn = document.getElementById('muteBtn') as HTMLButtonElement;
  const volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
  const progressBar = document.querySelector('.progress') as HTMLDivElement;
  const progressContainer = document.querySelector('.progress-container') as HTMLDivElement;
  // Add this after your existing code in the DOMContentLoaded event listener
const audioBubble = document.createElement('div');
audioBubble.className = 'audio-bubble';
document.querySelector('.gradients-container')?.appendChild(audioBubble);

// Add this CSS for the audio bubble
const style = document.createElement('style');
style.textContent = `
  .audio-bubble {
    position: absolute;
    width: 60%;
    height: 60%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(
      circle at center,
      rgba(255, 100, 255, 0.38) 0%,
      rgba(200, 50, 200, 0.03) 70%
    );
    border-radius: 50%;
    mix-blend-mode: screen;
    pointer-events: none;
    will-change: transform, opacity;
  }
`;
document.head.appendChild(style);
  
  let curX = 0, curY = 0, startTime = 0;
  let tgX = 0, tgY = 0;
  let wobbleAngle = 0;

  // --- Audio setup ---
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  let audio = new Audio();
  audio.volume = parseFloat(volumeSlider.value);
  let source: MediaElementAudioSourceNode | null = null;
  let audioLoaded = false;
  let isPlaying = false;
  let currentTrackIndex = 0;
  const tracks: string[] = []; // Will store loaded track URLs
  
  // Update progress bar
  function updateProgress() {
    if (!audioLoaded) return;
    
    const { duration, currentTime } = audio;
    const progressPercent = (currentTime / duration) * 100;
    progressBar.style.width = `${progressPercent}%`;
  }
  
  // Set progress when clicking on progress bar
  function setProgress(e: MouseEvent) {
    if (!audioLoaded) return;
    
    const width = (e.currentTarget as HTMLDivElement).clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
  }
  
  // Play/pause toggle
  function togglePlay() {
    if (!audioLoaded) return;
    
    if (audio.paused) {
      audio.play();
      isPlaying = true;
      playPauseBtn.classList.add('playing');
      playPauseBtn.setAttribute('title', 'Pause');
    } else {
      audio.pause();
      isPlaying = false;
      playPauseBtn.classList.remove('playing');
      playPauseBtn.setAttribute('title', 'Play');
    }
  }
  
  // Update volume
  function setVolume() {
    const volume = parseFloat(volumeSlider.value);
    audio.volume = volume;
    
    // Update mute button state
    if (volume === 0) {
      muteBtn.classList.add('muted');
      muteBtn.setAttribute('title', 'Unmute');
    } else {
      muteBtn.classList.remove('muted');
      muteBtn.setAttribute('title', 'Mute');
    }
  }
  
  // Toggle mute
  function toggleMute() {
    if (audio.volume > 0) {
      audio.volume = 0;
      volumeSlider.value = '0';
      muteBtn.classList.add('muted');
      muteBtn.setAttribute('title', 'Unmute');
    } else {
      audio.volume = parseFloat(volumeSlider.value) || 0.7;
      muteBtn.classList.remove('muted');
      muteBtn.setAttribute('title', 'Mute');
    }
  }
  
  // Load and play track
  function loadTrack(trackIndex: number) {
    if (tracks.length === 0) return;
    
    currentTrackIndex = (trackIndex + tracks.length) % tracks.length;
    const trackUrl = tracks[currentTrackIndex];
    
    audio.src = trackUrl;
    
    // If audio was playing, continue playing the new track
    if (isPlaying) {
      audio.play().catch(e => console.error('Playback failed:', e));
    }
  }
  
  // Event listeners for controls
  playPauseBtn.addEventListener('click', togglePlay);
  muteBtn.addEventListener('click', toggleMute);
  volumeSlider.addEventListener('input', setVolume);
  progressContainer.addEventListener('click', setProgress);
  
  // Update progress bar
  audio.addEventListener('timeupdate', updateProgress);
  
  // When audio ends, stop and reset
  audio.addEventListener('ended', () => {
    isPlaying = false;
    playPauseBtn.classList.remove('playing');
  });
  
  // Update play/pause button state when audio is paused/played by the browser
  audio.addEventListener('play', () => {
    isPlaying = true;
    playPauseBtn.classList.add('playing');
    playPauseBtn.setAttribute('title', 'Pause');
  });
  
  audio.addEventListener('pause', () => {
    isPlaying = false;
    playPauseBtn.classList.remove('playing');
    playPauseBtn.setAttribute('title', 'Play');
  });

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
      // Clear previous tracks
      tracks.length = 0;
      
      const files = fileInput.files;
      if (!files || files.length === 0) return;
      
      // Add all selected files to tracks array
      for (let i = 0; i < files.length; i++) {
        tracks.push(URL.createObjectURL(files[i]));
      }
      
      // Load and play the first track
      loadTrack(0);
      
      // Auto-play if not on mobile (where autoplay is often blocked)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (!isMobile) {
        audio.play().catch(e => console.log('Autoplay prevented:', e));
      }
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
    const bass = average(dataArray.slice(50,51));
    const mids = average(dataArray.slice(300, 500));
    const highs = average(dataArray.slice(18, 200));
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

  window.addEventListener('mousemove', (e) => {
    tgX = e.clientX;
    tgY = e.clientY;
  });


function createSmallBubbles(count: number) {
  const container = document.querySelector('.gradient-bg');
  if (!container) return [];

  const bubbles = [];
  for (let i = 0; i < count; i++) {
    const bubble = document.createElement('div');
    bubble.className = 'small-bubble';
    
    // Random position and size
    const size = 2 + Math.random() * 3;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.2 + Math.random() * 0.3;
    
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${x}%`;
    bubble.style.top = `${y}%`;
    bubble.style.opacity = (0.3 + Math.random() * 0.7).toString();
    
    container.appendChild(bubble);
    
    bubbles.push({
      element: bubble,
      x,
      y,
      speed,
      angle,
      size
    });
  }
  return bubbles;
}

function move() {
  if (!audioLoaded) {
    requestAnimationFrame(move);
    return;
  }

  const { bass, mids, highs } = getFreqBands();
    const nbass = clamp01(bass / 255) * 3;  // Normalize to 0-1 range
    const nmids = clamp01(mids / 255) * 0.02;
    const nhighs = clamp01(highs / 255) * 0.5; // Reduced high frequency sensitivity

    const bassScale = 1 + (nbass * 2); // Scale from 1x to 3x based on bass
    const midMovement = nmids * 200; // Movement range based on mids
    const highPulse = 0.4 + (nhighs * 0.7); 

    const time = performance.now() * 0.001;
    const moveX = Math.sin(time) * midMovement;
    const moveY = Math.cos(time * 0.7) * (midMovement * 0.7);

    audioBubble.style.transform = `
      translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))
      scale(${bassScale})
    `;
    audioBubble.style.opacity = highPulse.toString();    
      // Move interactive bubble
      curX += (tgX - curX) / 15;
      curY += (tgY - curY) / 15;
      wobbleAngle += 0.12;
      const wobbleX = 1 + Math.sin(wobbleAngle * 0.9) * 0.12 + nbass * 4;
      const wobbleY = 1 + Math.cos(wobbleAngle * 0.7) * 0.08 + nbass * 3;
      interBubble.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px) scale(${wobbleX.toFixed(3)}, ${wobbleY.toFixed(3)})`;

  // Move small bubbles
  smallBubbles.forEach(bubble => {
    const speedMultiplier = 1 + nbass * 3;
    bubble.x += Math.cos(bubble.angle) * bubble.speed * speedMultiplier;
    bubble.y += Math.sin(bubble.angle) * bubble.speed * speedMultiplier;

    // Bounce off edges
    if (bubble.x < 0 || bubble.x > 100) {
      bubble.angle = Math.PI - bubble.angle;
      bubble.x = Math.max(0, Math.min(100, bubble.x));
    }
    if (bubble.y < 0 || bubble.y > 100) {
      bubble.angle = -bubble.angle;
      bubble.y = Math.max(0, Math.min(100, bubble.y));
    }

    // Random direction changes
    if (Math.random() < 0.01) {
      bubble.angle += (Math.random() - 0.5) * 0.5;
    }

    // Update position
    bubble.element.style.left = `${bubble.x}%`;
    bubble.element.style.top = `${bubble.y}%`;
  });

  requestAnimationFrame(move);
}

// Initialize small bubbles
const smallBubbles = createSmallBubbles(50);

// Handle window resize
window.addEventListener('resize', () => {
  smallBubbles.forEach(bubble => {
    bubble.x = Math.min(100, Math.max(0, bubble.x));
    bubble.y = Math.min(100, Math.max(0, bubble.y));
  });
});



  move();
});
