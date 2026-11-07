'use client';

import { useEffect, useRef, useState } from 'react';
import { SoccerBall } from './soccer-ball';

/** Dibuja la textura del balón (pentágonos negros sobre blanco) en un canvas. */
function drawBallTexture(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Base con leve degradado para que la esfera tenga algo de tono propio.
  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, '#ffffff');
  base.addColorStop(1, '#e9ecef');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const pentagon = (cx: number, cy: number, r: number, rotDeg: number) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const angle = ((-90 + i * 72 + rotDeg) * Math.PI) / 180;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#15151a';
    ctx.fill();
  };

  const cols = 8;
  const rows = 6;
  const stepX = width / cols;
  const stepY = height / rows;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cx = (col + (row % 2 ? 0.5 : 0)) * stepX + stepX / 2;
      const cy = row * stepY + stepY / 2;
      pentagon(cx, cy, stepX * 0.3, ((row * 17 + col * 23) % 72) - 36);
    }
  }
}

/**
 * Balón de fútbol **3D real** con WebGL (three.js): esfera con textura de balón
 * generada proceduralmente, iluminación direccional + rim light de marca y giro
 * continuo. Se carga de forma diferida (solo en el navegador) y, si el
 * dispositivo no puede crear el contexto WebGL, cae al SVG estilizado.
 */
export function SoccerBall3D({ className = '' }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import('three');
      const mount = mountRef.current;
      if (disposed || !mount) return;

      let renderer: import('three').WebGLRenderer | null = null;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        setFallback(true);
        return;
      }
      if (!renderer) return;

      const width = mount.clientWidth || 320;
      const height = mount.clientHeight || 320;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      camera.position.set(0, 0, 3.2);

      scene.add(new THREE.AmbientLight(0xffffff, 0.7));
      const key = new THREE.DirectionalLight(0xffffff, 2.4);
      key.position.set(-2.5, 3, 2.5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xd1fc2a, 1.1);
      rim.position.set(2.5, -1, -2);
      scene.add(rim);

      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) drawBallTexture(ctx, canvas.width, canvas.height);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

      const geometry = new THREE.SphereGeometry(1, 96, 96);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.62,
        metalness: 0.05,
      });
      const ball = new THREE.Mesh(geometry, material);
      ball.rotation.set(0.35, 0, -0.15);
      scene.add(ball);

      const clock = new THREE.Clock();
      let raf = 0;
      const animate = () => {
        raf = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        ball.rotation.y = t * 0.55;
        ball.rotation.x = 0.35 + Math.sin(t * 0.6) * 0.08;
        ball.position.y = Math.sin(t * 1.1) * 0.06;
        renderer.render(scene, camera);
      };
      animate();

      const resize = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(mount);

      cleanup = () => {
        cancelAnimationFrame(raf);
        observer.disconnect();
        geometry.dispose();
        material.dispose();
        texture.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  if (fallback) {
    return <SoccerBall className={className} />;
  }

  return <div ref={mountRef} className={className} role="img" aria-label="3D football" />;
}
