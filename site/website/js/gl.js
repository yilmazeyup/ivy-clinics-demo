// The opening photo as a living surface, in plain WebGL 1 so it runs on every phone (the photo stays if it can't):
// - it first appears as a halftone of dots that sharpen into the photo (after Lama Lama, Site of the Month July 2026);
// - its light follows the real time of day in Nijmegen, the same for every visitor at the same moment (after Bruno
//   Simon's portfolio, Site of the Month January 2026);
// - the pointer leaves soft ripples in it that fade, like a finger drawn over a serum.

const VERT = `
attribute vec2 p;
varying vec2 vUv;
void main() { vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uImg;
uniform float uTime;
uniform float uReveal;
uniform vec3 uTint;
uniform float uSun;
uniform float uSunStrength;
uniform vec3 uTrail[12];

// object-fit: cover, with the focus a little above the middle like the CSS.
vec2 cover(vec2 uv) {
  float rs = uRes.x / uRes.y, ri = uImg.x / uImg.y;
  vec2 scale = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
  return (uv - vec2(0.5, 0.4)) * scale + vec2(0.5, 0.4);
}

vec3 photo(vec2 uv) {
  return texture2D(uTex, cover(vec2(uv.x, 1.0 - uv.y))).rgb;
}

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  vec2 offset = vec2(sin(uv.y * 3.0 + uTime * 0.35), cos(uv.x * 2.5 + uTime * 0.28)) * 0.0028;
  float energy = 0.0;
  for (int i = 0; i < 12; i++) {
    vec3 t = uTrail[i];
    if (t.z <= 0.001) continue;
    vec2 d = uv - t.xy;
    d.x *= aspect;
    float dist = length(d);
    float ring = sin(dist * 46.0 - uTime * 5.0) * exp(-dist * dist * 38.0);
    offset += normalize(d + 1e-5) * ring * 0.012 * t.z;
    energy += exp(-dist * dist * 30.0) * t.z;
  }
  vec2 suv = uv + offset;
  float shift = 0.0025 * clamp(energy, 0.0, 1.5);
  vec3 col = vec3(photo(suv + vec2(shift, 0.0)).r, photo(suv).g, photo(suv - vec2(shift, 0.0)).b);

  // Halftone: a grid of dots whose size follows the brightness, shrinking to nothing as the photo sharpens.
  if (uReveal < 0.999) {
    float cell = mix(22.0, 3.0, uReveal) / uRes.y;
    vec2 g = vec2(cell / aspect, cell);
    vec2 c = (floor(uv / g) + 0.5) * g;
    vec3 cc = photo(c);
    float lum = dot(cc, vec3(0.299, 0.587, 0.114));
    vec2 q = (uv - c) / g;
    float r = length(q);
    float radius = mix(0.12, 0.62, 1.0 - lum) + uReveal * 0.4;
    float dotMask = 1.0 - smoothstep(radius - 0.06, radius + 0.06, r);
    vec3 paper = vec3(0.965, 0.945, 0.918);
    vec3 ink = cc * 0.85;
    vec3 tone = mix(paper, ink, dotMask);
    col = mix(tone, col, smoothstep(0.35, 1.0, uReveal));
  }

  // Daylight: a tint for the hour, and a soft window light that crosses from left (morning) to right (evening).
  col *= uTint;
  float window = exp(-pow((uv.x - uSun) * 1.6, 2.0)) * smoothstep(0.0, 1.0, uv.y);
  col += vec3(1.0, 0.86, 0.68) * window * uSunStrength;
  col += vec3(0.06, 0.045, 0.03) * clamp(energy, 0.0, 1.0);
  gl_FragColor = vec4(col, 1.0);
}`;

/** The light of the hour in Nijmegen: a tint, where the window light falls, how strong, and a name for it. */
export function daylight(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  const h = Number(parts.hour) + Number(parts.minute) / 60;
  // Key moments of a day; the light blends between them.
  const keys = [
    { h: 0, tint: [0.62, 0.68, 0.86], sun: 0.5, s: 0.0, name: 'nachtlicht' },
    { h: 6, tint: [0.86, 0.8, 0.84], sun: 0.08, s: 0.05, name: 'ochtendgloren' },
    { h: 8.5, tint: [1.02, 0.97, 0.93], sun: 0.2, s: 0.1, name: 'ochtendlicht' },
    { h: 12.5, tint: [1.04, 1.02, 0.99], sun: 0.5, s: 0.08, name: 'middaglicht' },
    { h: 17, tint: [1.06, 0.96, 0.86], sun: 0.78, s: 0.13, name: 'gouden uur' },
    { h: 20, tint: [0.9, 0.78, 0.82], sun: 0.95, s: 0.06, name: 'schemering' },
    { h: 22.5, tint: [0.64, 0.68, 0.86], sun: 0.5, s: 0.0, name: 'nachtlicht' },
    { h: 24, tint: [0.62, 0.68, 0.86], sun: 0.5, s: 0.0, name: 'nachtlicht' },
  ];
  let i = 0;
  while (i < keys.length - 2 && h >= keys[i + 1].h) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const t = (h - a.h) / (b.h - a.h);
  const mix = (x, y) => x + (y - x) * t;
  return {
    hour: h,
    time: `${parts.hour}:${parts.minute}`,
    tint: a.tint.map((v, k) => mix(v, b.tint[k])),
    sun: mix(a.sun, b.sun),
    strength: mix(a.s, b.s),
    name: t < 0.5 ? a.name : b.name,
  };
}

export async function startHeroGL(canvas, img, pointer, onFrame) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) return null;
  await img.decode();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const shader = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

  const u = (n) => gl.getUniformLocation(prog, n);
  const U = {
    res: u('uRes'),
    img: u('uImg'),
    time: u('uTime'),
    reveal: u('uReveal'),
    tint: u('uTint'),
    sun: u('uSun'),
    sunStrength: u('uSunStrength'),
    trail: u('uTrail'),
  };
  gl.uniform2f(U.img, img.naturalWidth, img.naturalHeight);

  const resize = () => {
    const dpr = Math.min(devicePixelRatio, 1.5);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.res, canvas.width, canvas.height);
  };
  resize();
  addEventListener('resize', resize);

  let light = daylight();
  setInterval(() => (light = daylight()), 30_000);

  const trail = Array.from({ length: 12 }, () => [0, 0, 0]);
  let head = 0;
  let last = { x: -1, y: -1 };
  const flat = new Float32Array(36);
  const t0 = performance.now();
  const state = { revealStart: 0 };

  onFrame((now) => {
    const r = canvas.getBoundingClientRect();
    if (r.bottom < 0 || r.width === 0) return;
    const x = (pointer.x - r.left) / r.width;
    const y = 1 - (pointer.y - r.top) / r.height;
    const moved = Math.hypot((x - last.x) * r.width, (y - last.y) * r.height);
    if (!reduced && moved > 18 && x >= 0 && x <= 1 && y >= 0 && y <= 1) {
      trail[head] = [x, y, Math.min(1, moved / 60)];
      head = (head + 1) % trail.length;
      last = { x, y };
    }
    trail.forEach((t, i) => {
      t[2] *= 0.965;
      flat.set(t, i * 3);
    });
    const reveal = state.revealStart ? Math.min(1, (now - state.revealStart) / (reduced ? 1 : 2200)) : 0;
    gl.uniform1f(U.reveal, 1 - Math.pow(1 - reveal, 3));
    gl.uniform3fv(U.trail, flat);
    gl.uniform3fv(U.tint, light.tint);
    gl.uniform1f(U.sun, light.sun);
    gl.uniform1f(U.sunStrength, light.strength);
    gl.uniform1f(U.time, (now - t0) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  });
  canvas.classList.add('ready');
  return {
    /** Lets the dots sharpen into the photo. */
    reveal() {
      state.revealStart = performance.now();
    },
  };
}
