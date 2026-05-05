// Miscellaneous functions that didn't quite fit anywhere else.

export const splitExtension = function(path) {
  const index = path.lastIndexOf(".");
  return [path.substring(0, index), path.substring(index + 1)]
}

export const interpolate = function(a, b, t) {
  return a + (b - a) * t;
}
