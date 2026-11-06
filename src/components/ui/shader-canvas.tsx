"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ShaderCanvasStatus =
  | "starting"
  | "running"
  | "unsupported"
  | "error";

export interface ShaderCanvasProps {
  /**
   * GLSL ES 1.0 fragment shader with a `void main()`. Do not declare the uniforms — they are prepended:
   * `u_time` (seconds), `u_resolution` (pixels), `u_pointer` (0–1, y up) and one `vec3` per entry in `colors`.
   */
  fragment?: string;
  /** Uniform name → CSS colour. Tokens are resolved and re-read when the theme or accent changes. */
  colors?: Record<string, string>;
  /** Render resolution as a fraction of the device pixels. Lower is cheaper; soft shaders lose nothing at 0.5. */
  resolution?: number;
  /** Seconds into the animation to draw when motion is reduced, so the still frame is a good one. */
  stillTime?: number;
  /** Show compile errors over the canvas. Useful while writing a shader; errors always reach `onError`. */
  showErrors?: boolean;
  /** Called with the compile or link log when the shader fails. */
  onError?: (message: string) => void;
  /** Called when rendering starts, or when it falls back. */
  onStatusChange?: (status: ShaderCanvasStatus) => void;
  /** Describe the image for assistive tech. Without it the canvas is decorative and hidden. */
  label?: string;
  /** Content drawn on top of the shader. */
  children?: React.ReactNode;
  /** Merged last, so it wins. Give the component a size here. */
  className?: string;
}

const DEFAULT_FRAGMENT = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= u_resolution.x / u_resolution.y;

  vec2 m = (u_pointer * 2.0 - 1.0) * vec2(u_resolution.x / u_resolution.y, 1.0);
  float distToMouse = length(p - m);
  float mouseWave = sin(distToMouse * 7.5 - u_time * 2.6) * exp(-distToMouse * 2.2) * 0.12;

  float t = u_time * 0.32;

  // Layered undulating wave harmonics flowing across the full viewport height
  float w1 = sin(p.x * 2.2 + t * 1.6 + sin(p.y * 2.6 - t * 0.9)) * 0.5 + 0.5;
  float w2 = cos(p.x * 2.9 - t * 1.9 + cos(p.y * 3.3 + t * 1.2)) * 0.5 + 0.5;
  float w3 = sin((p.x * 1.6 + p.y * 1.3) + t * 2.1) * 0.5 + 0.5;

  float wave = (w1 * 0.5 + w2 * 0.35 + w3 * 0.15) + mouseWave;
  float glow = 0.32 / (0.32 + distToMouse * distToMouse * 2.2);

  // Smooth wave band across the full canvas without top blackout cutoff
  float band = smoothstep(0.14, 0.90, wave * 0.72 + glow * 0.35);

  vec3 colour = mix(u_surface, u_accent, band * 0.85);
  colour = mix(colour, u_highlight, smoothstep(0.68, 1.0, wave) * 0.42);
  colour = mix(colour, u_ink, smoothstep(0.88, 1.0, band) * 0.22);

  gl_FragColor = vec4(colour, 1.0);
}
`;

const DEFAULT_COLORS: Record<string, string> = {
  u_surface: "var(--color-bg-canvas, #F4F9EC)",
  u_accent: "var(--color-cerulean, #1A759F)",
  u_highlight: "var(--color-lime-cream, #D9ED92)",
  u_ink: "var(--color-baltic-blue, #184E77)",
};

const VERTEX = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
}

/** Resolve any CSS colour — a hex code, token, oklab, color-mix — to 0–1 RGB values. */
function toRgb(
  value: string,
  host: HTMLElement,
  probe: CanvasRenderingContext2D | null
): [number, number, number] {
  if (!value) return [0.5, 0.5, 0.5];

  // Direct hex parsing for maximum performance & zero DOM query
  if (value.startsWith("#")) {
    const hex = value.slice(1);
    if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16) / 255,
        parseInt(hex.slice(2, 4), 16) / 255,
        parseInt(hex.slice(4, 6), 16) / 255,
      ];
    }
  }

  // Resolve CSS variable or named token on host element
  host.style.color = value;
  const computed = getComputedStyle(host).color;
  host.style.color = "";

  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return [
      Number(match[1]) / 255,
      Number(match[2]) / 255,
      Number(match[3]) / 255,
    ];
  }

  if (!probe) return [0.5, 0.5, 0.5];
  try {
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = computed;
    probe.fillRect(0, 0, 1, 1);
    const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
    return [(r ?? 128) / 255, (g ?? 128) / 255, (b ?? 128) / 255];
  } catch {
    return [0.5, 0.5, 0.5];
  }
}

/**
 * A WebGL fragment shader background adapted for Smart Trip Planner theme tokens.
 * Gracefully stops off screen, pauses on tab switch, and falls back to CSS gradients.
 */
export function ShaderCanvas({
  fragment = DEFAULT_FRAGMENT,
  colors = DEFAULT_COLORS,
  resolution = 1,
  stillTime = 4,
  showErrors = false,
  onError,
  onStatusChange,
  label,
  children,
  className,
}: ShaderCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [status, setStatus] = React.useState<ShaderCanvasStatus>("starting");
  const [error, setError] = React.useState<string | null>(null);
  const callbacks = React.useRef({ onError, onStatusChange });

  React.useEffect(() => {
    callbacks.current = { onError, onStatusChange };
  });

  React.useEffect(() => {
    callbacks.current.onStatusChange?.(status);
  }, [status]);

  const colourKey = JSON.stringify(colors);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      antialias: false,
      premultipliedAlpha: false,
    });
    if (!gl) {
      queueMicrotask(() => setStatus("unsupported"));
      return;
    }

    const palette = JSON.parse(colourKey) as Record<string, string>;
    const names = Object.keys(palette);
    const header = [
      "precision mediump float;",
      "uniform float u_time;",
      "uniform vec2 u_resolution;",
      "uniform vec2 u_pointer;",
      ...names.map((name) => `uniform vec3 ${name};`),
    ].join("\n");

    const fail = (message: string) => {
      setError(message);
      setStatus("error");
      callbacks.current.onError?.(message);
    };

    const headerLines = names.length + 4;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = (gl.getShaderInfoLog(shader) ?? "")
          .replace(/[^\x20-\x7e\n]/g, "")
          .trim();
        const shifted =
          type === gl.FRAGMENT_SHADER
            ? log.replace(
                /(\d+):(\d+)/g,
                (_match, file, line) =>
                  `${file}:${Math.max(1, Number(line) - headerLines)}`
              )
            : log;
        fail(shifted || "The shader did not compile.");
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertex = compile(gl.VERTEX_SHADER, VERTEX);
    const pixel =
      vertex && compile(gl.FRAGMENT_SHADER, `${header}\n${fragment}`);
    if (!vertex || !pixel) return;
    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertex);
    gl.attachShader(program, pixel);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      fail(gl.getProgramInfoLog(program)?.trim() || "The shader did not link.");
      return;
    }
    gl.useProgram(program);
    setError(null);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const uTime = uniform("u_time");
    const uResolution = uniform("u_resolution");
    const uPointer = uniform("u_pointer");
    const colourUniforms = names.map((name) => [name, uniform(name)] as const);

    const probeCanvas = document.createElement("canvas");
    probeCanvas.width = 1;
    probeCanvas.height = 1;
    const probe = probeCanvas.getContext("2d", { willReadFrequently: true });
    const applyColours = () => {
      for (const [name, location] of colourUniforms) {
        if (location)
          gl.uniform3fv(location, toRgb(palette[name]!, canvas, probe));
      }
    };

    const pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
    let frame = 0;
    let visible = true;
    let elapsed = 0;
    let last = 0;
    let lost = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(2, window.devicePixelRatio || 1) * resolution;
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const render = (time: number) => {
      if (lost) return;
      gl.uniform1f(uTime, time);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform2f(uPointer, pointer.x, pointer.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      if (last) elapsed += Math.min(0.1, (now - last) / 1000);
      last = now;
      pointer.x += (pointer.targetX - pointer.x) * 0.06;
      pointer.y += (pointer.targetY - pointer.y) * 0.06;
      render(elapsed);
      frame = requestAnimationFrame(loop);
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      last = 0;
    };
    const start = () => {
      stop();
      if (reducedMotion) render(stillTime);
      else if (visible && !document.hidden) frame = requestAnimationFrame(loop);
    };

    resize();
    applyColours();
    render(reducedMotion ? stillTime : 0);
    queueMicrotask(() => {
      if (!lost) setStatus("running");
    });
    start();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      render(reducedMotion ? stillTime : elapsed);
    });
    resizeObserver.observe(canvas);

    const intersection =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = Boolean(entry?.isIntersecting);
            if (visible) start();
            else stop();
          });
    intersection?.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.targetX = Math.min(
        1,
        Math.max(0, (event.clientX - rect.left) / rect.width)
      );
      pointer.targetY = Math.min(
        1,
        Math.max(0, 1 - (event.clientY - rect.top) / rect.height)
      );
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const themeObserver = new MutationObserver(() => {
      applyColours();
      render(reducedMotion ? stillTime : elapsed);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });

    const onLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      stop();
      setStatus("unsupported");
    };
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      stop();
      resizeObserver.disconnect();
      intersection?.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(pixel);
      gl.deleteBuffer(buffer);
    };
  }, [fragment, colourKey, resolution, stillTime, reducedMotion]);

  const drawing = status === "running";

  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      {/* Fallback CSS gradient behind canvas */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-[radial-gradient(120%_90%_at_20%_110%,var(--color-lime-cream)_0%,color-mix(in_oklab,var(--color-cerulean)_25%,var(--color-bg-canvas))_50%,var(--color-bg-canvas)_100%)] opacity-40 dark:opacity-20"
      />
      <canvas
        ref={canvasRef}
        role={label ? "img" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        className={cn(
          "absolute inset-0 z-[1] block size-full transition-opacity duration-700",
          !drawing && "invisible opacity-0"
        )}
      />
      {showErrors && error && (
        <pre
          role="alert"
          tabIndex={0}
          className="absolute inset-x-3 top-3 z-20 max-h-[60%] overflow-auto whitespace-pre-wrap rounded-xl border border-red-500 bg-white/90 p-3 font-mono text-[11px] leading-relaxed text-red-600 shadow-md"
        >
          {error}
        </pre>
      )}
      {children && <div className="relative z-10 w-full h-full">{children}</div>}
    </div>
  );
}

export default ShaderCanvas;

