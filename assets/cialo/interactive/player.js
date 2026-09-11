/* Portfolio player for the supplied Ciało renderer. No exports, network calls or autoplay. */
(() => {
  'use strict';
  const canvas = document.getElementById('stage');
  const artwork = document.getElementById('artwork');
  const fallback = document.getElementById('fallback');
  const toggle = document.getElementById('toggle');
  const restart = document.getElementById('restart');
  const progress = document.getElementById('progress');
  const timer = document.getElementById('time');
  const status = document.getElementById('status');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 4.4;
  let effect;
  let loading;
  let frame = 0;
  let playing = false;
  let time = 0;
  let disposed = false;

  function updateTime() {
    progress.value = String(time);
    progress.setAttribute('aria-valuetext', `${time.toFixed(1)} of ${duration} seconds`);
    timer.textContent = `${time.toFixed(1)} / ${duration} s`;
  }

  function fit() {
    if (!effect?.loaded || disposed) return;
    const width = artwork.clientWidth;
    const height = artwork.clientHeight;
    if (!width || !height) return;
    const scale = Math.min(devicePixelRatio || 1, 1.5, 1920 / width, 1080 / height);
    effect.resize(Math.round(width * scale), Math.round(height * scale));
    effect.render(time);
  }

  function pause(message = 'Animation paused.') {
    cancelAnimationFrame(frame);
    frame = 0;
    playing = false;
    effect?.pause();
    toggle.textContent = time >= duration ? 'Play again' : time > 0 ? 'Resume animation' : 'Play animation';
    if (message) status.textContent = message;
  }

  async function prepare() {
    if (effect?.loaded) return true;
    if (loading) return loading;
    toggle.disabled = true;
    status.textContent = 'Preparing animation…';
    loading = (async () => {
      try {
        effect = new CialoHologram(canvas);
        await effect.load();
        if (disposed) return false;
        fit();
        fallback.hidden = true;
        canvas.hidden = false;
        progress.disabled = motion.matches;
        restart.disabled = motion.matches;
        return true;
      } catch {
        effect?.dispose();
        effect = undefined;
        fallback.hidden = false;
        canvas.hidden = true;
        status.textContent = 'The still logo is available. The interactive animation could not load.';
        return false;
      } finally {
        toggle.disabled = motion.matches || disposed;
        loading = undefined;
      }
    })();
    return loading;
  }

  async function play(fromStart = false) {
    if (motion.matches || disposed) return;
    if (!(await prepare()) || disposed) return;
    if (motion.matches) {
      setMotionPreference();
      return;
    }
    if (document.hidden) {
      time = duration;
      effect.render(time);
      updateTime();
      pause('Showing the finished logo after the page moved to the background.');
      return;
    }
    pause('');
    if (fromStart || time >= duration) time = 0;
    const initialTime = time;
    let origin;
    // Use one animation-frame clock, including in a lazily loaded iframe.
    playing = true;
    toggle.textContent = 'Pause animation';
    status.textContent = 'Animation playing.';
    const tick = now => {
      if (!playing || disposed) return;
      origin ??= now;
      time = Math.min(duration, Math.max(0, initialTime + (now - origin) / 1000));
      effect.render(time);
      updateTime();
      if (time < duration) frame = requestAnimationFrame(tick);
      else pause('Animation complete. The finished logo remains on screen.');
    };
    frame = requestAnimationFrame(tick);
  }

  function setMotionPreference() {
    if (motion.matches) {
      pause('Reduced motion is enabled. Showing the finished logo.');
      time = duration;
      effect?.render(time);
      updateTime();
      toggle.disabled = true;
      restart.disabled = true;
      progress.disabled = true;
    } else {
      toggle.disabled = Boolean(loading) || disposed;
      restart.disabled = !effect?.loaded;
      progress.disabled = !effect?.loaded;
      status.textContent = 'Press Play to begin. Animation stays paused until you choose to play.';
    }
  }

  toggle.addEventListener('click', () => playing ? pause() : play());
  restart.addEventListener('click', () => play(true));
  progress.addEventListener('input', () => {
    if (!effect?.loaded || motion.matches) return;
    pause('Animation paused. Use the slider to explore each frame.');
    time = Math.min(duration, Math.max(0, Number(progress.value)));
    effect.render(time);
    updateTime();
    toggle.textContent = time >= duration ? 'Play again' : 'Resume animation';
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && effect?.loaded) {
      time = duration;
      effect.render(time);
      updateTime();
      pause('Showing the finished logo after the page moved to the background.');
    }
  });
  motion.addEventListener('change', setMotionPreference);
  const observer = new ResizeObserver(fit);
  observer.observe(artwork);
  window.addEventListener('pagehide', event => {
    pause('');
    if (event.persisted) return;
    disposed = true;
    effect?.dispose();
    observer.disconnect();
    motion.removeEventListener('change', setMotionPreference);
  });
  updateTime();
  setMotionPreference();
})();
