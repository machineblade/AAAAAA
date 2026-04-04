const PI = Math.PI;
const TAU = PI * 2;
const HALF_PI = PI / 2;
const sin = Math.sin;
const cos = Math.cos;

export const linear = t => {
  return t;
}

// Ease
export const easeInOut = (t, rate) => {
  t *= 2;
  if (t < 1)
    return 0.5 * t ** rate;
  return 1 - 0.5 * (2 - t) ** rate;
}

export const easeIn = (t, rate) => {
  return t ** rate;
}

export const easeOut = (t, rate) => {
  return t ** (1 / rate);
}

// Elastic
export const elasticInOut = (t, period) => {
  if (t === 0 || t === 1)
    return t
  const s = period / 4;
  t = t * 2 - 1;
  if (t < 0)
    return -0.5 * 2 ** (10 * t) * sin((t - s) * TAU / period);
  return 2 ** (-10 * t) * sin((t - s) * TAU / period) * 0.5 + 1;
}

export const elasticIn = (t, period) => {
  if (t === 0 || t === 1)
    return t;
  t -= 1;
  return -(2 ** (10 * t)) * sin((t - period / 4) * TAU / period);
}

export const elasticOut = (t, period) => {
  if (t === 0 || t === 1)
    return t;
  return 2 ** (-10 * t) * sin((t - period / 4) * TAU / period) + 1;
}

// Bounce
export const bounceInOut = t => {
  if (t < 0.5)
    return (1 - bounceOut(1 - t * 2)) * 0.5;
  return bounceOut(t * 2 - 1) * 0.5 + 0.5;
}

export const bounceIn = t => {
  return 1 - bounceOut(1 - t);
}

export const bounceOut = t => {
  if (t < 1 / 2.75)
    return 7.5625 * t * t;
  else if (t < 2 / 2.75) {
    t -= 1.5 / 2.75;
    return 7.5625 * t * t + 0.75;
  } else if (t < 2.5 / 2.75) {
    t -= 2.25 / 2.75;
    return 7.5625 * t * t + 0.9375;
  }
  t -= 2.625 / 2.75;
  return 7.5625 * t * t + 0.984375;
}

// Expo
export const expoInOut = t => {
  if (t === 0 || t === 1)
    return t;
  if (t < 0.5)
    return 0.5 * 2 ** (10 * (t * 2 - 1));
  return 0.5 * -(2 ** (-10 * (t * 2 - 1)) + 2);
}

export const expoIn = t => {
  return t === 0 ? 0 : 2 ** (10 * (t - 1));
}

export const expoOut = t => {
  return t === 1 ? 1 : -(2 ** (-10 * t)) + 1;
}

// Sine
export const sineInOut = t => {
  return -0.5 * (cos(t * PI) - 1);
}

export const sineIn = t => {
  return -Math.cos(t * HALF_PI) + 1;
}

export const sineOut = t => {
  return sin(t * HALF_PI);
}

// Back
export const backInOut = t => {
  const overshoot = 1.70158 * 1.525;
  t *= 2;
  if (t < 1)
    return (t * t * ((overshoot + 1) * t - overshoot)) / 2;
  t -= 2;
  return (t * t * ((overshoot + 1) * t + overshoot)) / 2 + 1;
}

export const backIn = t => {
  const overshoot = 1.70158;
  return t * t * ((overshoot + 1) * t - overshoot);
}

export const backOut = t => {
  const overshoot = 1.70158;
  t -= 1;
  return t * t * ((overshoot + 1) * t + overshoot) + 1;
}