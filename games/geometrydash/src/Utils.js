export function interpolate(a, b, t) {
    return a + (b - a) * t;
}

export function packRGB(r, g, b) {
    return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}