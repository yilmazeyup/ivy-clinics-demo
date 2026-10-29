// One drop of serum stays on screen while the scene changes around it: the ivory room goes dark, a light rakes across
// the glass, and the headline slides in from both sides, all without a cut (after Oryzo AI, Site of the Month April
// 2026). The drop is ray-marched in a small WebGL shader; the headline is plain HTML over it.
import { $, smoothstep, onFrame, onScreen, pinProgress, REDUCED } from '../core.js';

const VERT = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uDark;
uniform float uLight;
uniform float uScale;
uniform vec2 uPos;

const vec3 IVORY = vec3(0.965, 0.945, 0.918);
const vec3 ESPRESSO = vec3(0.106, 0.094, 0.082);
const vec3 HONEY = vec3(0.96, 0.74, 0.46);

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// A drop: a round belly with a soft tip, breathing a little.
float sdf(vec3 p) {
  p /= uScale;
  float wob = sin(p.y * 4.0 + uTime * 1.3) * 0.015 + sin(p.x * 5.0 - uTime) * 0.01;
  float belly = length(p - vec3(0.0, -0.12, 0.0)) - 0.62 + wob;
  float tip = length(p - vec3(0.0, 0.62, 0.0)) - 0.1;
  return smin(belly, tip, 0.5) * uScale;
}

vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(sdf(p + e.xyy) - sdf(p - e.xyy), sdf(p + e.yxy) - sdf(p - e.yxy), sdf(p + e.yyx) - sdf(p - e.yyx)));
}

// The room behind the drop: ivory turning dark, with a band of light that rakes across it.
vec3 room(vec2 uv) {
  vec3 base = mix(IVORY, ESPRESSO, uDark);
  float band = exp(-pow((uv.x - uLight * 0.9) * 1.8 - uv.y * 0.6, 2.0));
  base += vec3(1.0, 0.88, 0.72) * band * mix(0.05, 0.22, uDark);
  return base;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec2 q = uv - uPos;
  vec3 col = room(uv);

  // A soft shadow and a little gathered light under the drop.
  vec2 s = (q - vec2(-uLight * 0.25, -0.62 * uScale)) / vec2(0.6, 0.12) / uScale;
  col *= 1.0 - 0.35 * exp(-dot(s, s)) * (1.0 - uDark * 0.4);
  vec2 c = (q - vec2(-uLight * 0.35, -0.55 * uScale)) / vec2(0.22, 0.06) / uScale;
  col += HONEY * 0.35 * exp(-dot(c, c)) * smoothstep(0.1, 0.8, uDark);

  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(q, -2.6));
  float t = 0.0;
  bool hit = false;
  for (int i = 0; i < 72; i++) {
    float d = sdf(ro + rd * t);
    if (d < 0.001) { hit = true; break; }
    t += d;
    if (t > 6.0) break;
  }
  if (hit) {
    vec3 p = ro + rd * t;
    vec3 n = normalAt(p);
    float fres = pow(1.0 - max(dot(-rd, n), 0.0), 3.0);
    vec3 refr = refract(rd, n, 0.75);
    vec3 behind = room(uv + refr.xy * 0.35);
    vec3 body = behind * HONEY * 1.05 + HONEY * 0.08;
    vec3 L = normalize(vec3(uLight, 0.7, 0.6));
    float spec = pow(max(dot(reflect(rd, n), L), 0.0), 80.0);
    float sheen = pow(max(dot(reflect(rd, n), L), 0.0), 8.0);
    vec3 glass = mix(body, room(uv + n.xy * 0.4) + 0.12, fres * 0.7);
    glass += vec3(1.0, 0.97, 0.9) * (spec * 1.4 + sheen * 0.12);
    // A warm rim where the light comes from.
    glass += HONEY * pow(max(dot(n, L), 0.0), 2.0) * 0.12 * (0.4 + uDark);
    col = glass;
  }
  gl_FragColor = vec4(col, 1.0);
}`;

export function startDrop() {
  const stage = $('#drop-stage');
  const canvas = $('#drop-gl');
  if (!stage || !canvas) return;
  const left = $('.drop-left', stage);
  const right = $('.drop-right', stage);
  const eyebrow = $('.drop-eyebrow', stage);
  const note = $('.drop-note', stage);
  const pin = $('.drop-pin', stage);

  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  let draw = null;
  if (gl) {
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    try {
      const prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const U = Object.fromEntries(['uRes', 'uTime', 'uDark', 'uLight', 'uScale', 'uPos'].map((n) => [n, gl.getUniformLocation(prog, n)]));
      const resize = () => {
        // The drop is soft; fewer pixels on phones keep it smooth.
        const dpr = Math.min(devicePixelRatio, innerWidth < 900 ? 0.9 : 1.25);
        canvas.width = Math.round(canvas.clientWidth * dpr);
        canvas.height = Math.round(canvas.clientHeight * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(U.uRes, canvas.width, canvas.height);
      };
      resize();
      addEventListener('resize', resize);
      draw = (time, s) => {
        gl.uniform1f(U.uTime, time / 1000);
        gl.uniform1f(U.uDark, s.dark);
        gl.uniform1f(U.uLight, s.light);
        gl.uniform1f(U.uScale, s.scale);
        gl.uniform2f(U.uPos, 0, s.y);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      };
    } catch {
      draw = null;
    }
  }

  onFrame((time, y) => {
    if (!onScreen(stage, y)) return;
    const p = REDUCED ? 0.7 : pinProgress(stage, y);
    const dark = smoothstep(0.12, 0.45, p);
    const s = {
      dark,
      light: -1.2 + 2.4 * smoothstep(0.08, 0.85, p),
      scale: (innerWidth < 900 ? 0.5 : 0.62) * (0.55 + 0.45 * smoothstep(0, 0.2, p)) * (1 - 0.25 * smoothstep(0.8, 1, p)),
      y: 0.02 + 0.12 * smoothstep(0.8, 1, p),
    };
    if (draw) draw(time, s);
    else pin.style.background = `color-mix(in srgb, var(--espresso) ${dark * 100}%, var(--ivory))`;
    const t = smoothstep(0.32, 0.62, p);
    const wide = innerWidth > 900;
    left.style.opacity = right.style.opacity = String(t);
    left.style.transform = wide ? `translate(${-(1 - t) * 30}vw, -50%)` : `translate(-50%, -50%) translateX(${-(1 - t) * 40}vw)`;
    right.style.transform = wide ? `translate(${(1 - t) * 30}vw, -50%)` : `translate(-50%, -50%) translateX(${(1 - t) * 40}vw)`;
    eyebrow.style.opacity = String(smoothstep(0.3, 0.5, p));
    note.style.opacity = String(smoothstep(0.62, 0.8, p));
  });
}
