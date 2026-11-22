// Sensors: shaking the phone startles Amaka. (Orientation and proximity come later.)
export function initSensors({ face, settings }) {
  if (!('DeviceMotionEvent' in window)) return false;
  let lastShake = 0;
  window.addEventListener('devicemotion', (e) => {
    if (!settings.motionReact) return;
    const a = e.accelerationIncludingGravity;
    if (!a) return;
    const strength = Math.abs(Math.hypot(a.x || 0, a.y || 0, a.z || 0) - 9.8);
    const now = Date.now();
    if (strength > 14 && now - lastShake > 2500) {
      lastShake = now;
      if (face.state === 'sleeping') face.setState('idle');
      else face.flash('concerned', 1800);
    }
  });
  return true;
}
