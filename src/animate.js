export function animate(duration, stepFunc, onFinish) {
  return animateValue.call(this, 0, 100, duration, function() {
    // Remove first arg
    const args = [].slice.call(arguments, 1);
    return stepFunc.apply(this, args);
  }, onFinish);
}

export function animateValue(from, to, duration, stepFunc, onFinish) {
  const start = Date.now();
  let timeElapsed = 0;
  let progress = 0;
  let now; 
  let stepValue;

  const animationControl = {
    cancelled: false,
    finished: false
  };

  const animateStep = () => {
    if (animationControl.cancelled) {
      return;
    }

    now = Date.now();
    timeElapsed = now - start;

    progress = Math.min(timeElapsed / duration, 1);
    stepValue = from + (to - from) * progress;

    stepFunc.call(this, stepValue, progress, timeElapsed);
    
    if (progress < 1) {
      requestAnimationFrame(animateStep);
    } else {
      if (onFinish) {
        onFinish.call();
        animationControl.finished = true;
      }
    }
  };
  requestAnimationFrame(animateStep);

  return animationControl;
}
