// color.js
// PIXI-compatible hex color constants for use with sprite.tint, Graphics.fill, etc.

export const black       = 0x000000;
export const white       = 0xffffff;
export const red         = 0xff4444;
export const green       = 0x44ff44;
export const blue        = 0x4444ff;
export const yellow      = 0xffdd57;
export const orange      = 0xff8c00;
export const purple      = 0x9b59b6;
export const pink        = 0xff69b4;
export const cyan        = 0x00ffff;
export const gray        = 0x888888;
export const darkGray    = 0x2a2a2a;
export const lightGray   = 0xcccccc;
export const transparent = 0x000000; // use alpha = 0 for true transparency

/**
 * Convert an RGB object to a PIXI hex number.
 * @param {number} r - 0–255
 * @param {number} g - 0–255
 * @param {number} b - 0–255
 * @returns {number}
 */
export function rgb(r, g, b) {
  return (r << 16) | (g << 8) | b;
}

/**
 * Convert a CSS hex string to a PIXI hex number.
 * @param {string} hex - e.g. "#ff4444" or "ff4444"
 * @returns {number}
 */
export function fromHex(hex) {
  return parseInt(hex.replace("#", ""), 16);
}

/**
 * Linearly interpolate between two PIXI hex colors.
 * @param {number} a - start color
 * @param {number} b - end color
 * @param {number} t - 0–1
 * @returns {number}
 */
export function lerp(a, b, t) {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8)  & 0xff;
  const ab =  a        & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8)  & 0xff;
  const bb =  b        & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}
/**
 * Pack multiple color channels into a PIXI hex number.
 * All values are clamped to 0–255.
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {number}
 */
export function pack(r, g, b) {
  r = Math.max(0, Math.min(255, Math.round(r)));
  g = Math.max(0, Math.min(255, Math.round(g)));
  b = Math.max(0, Math.min(255, Math.round(b)));
  return (r << 16) | (g << 8) | b;
}