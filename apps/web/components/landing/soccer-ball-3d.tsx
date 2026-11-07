'use client';

import { useEffect, useRef, useState } from 'react';
import { SoccerBall } from './soccer-ball';

/**
 * Textura del balón (equirectangular) a alta resolución: pentágonos negros con
 * sombreado interno (para que parezcan domos) sobre una base con degradado suave.
 */
function drawBallTexture(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, '#ffffff');
  base.addColorStop(0.5, '#f4f5f2');
  base.addColorStop(1, '#e3e6ea');
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
    const shade = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.15, cx, cy, r);
    shade.addColorStop(0, '#2b2b32');
    shade.addColorStop(1, '#0c0c10');
    ctx.fillStyle = shade;
    ctx.fill();
  };

  const cols = 10;
  const rows = 7;
  const stepX = width / cols;
  const stepY = height / rows;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cx = (col + (row % 2 ? 0.5 : 0)) * stepX + stepX / 2;
      const cy = row * stepY + stepY / 2;
      pentagon(cx, cy, stepX * 0.28, ((row * 17 + col * 23) % 72) - 36);
    }
  }
}

/**
 * Balón de fútbol **3D real y realista** (WebGL / three.js): esfera de alta
 * teselación con textura PBR generada a 2K, environment map para reflejos,
 * tone mapping ACES, iluminación con rim de marca y **sombra real** proyectada
 * sobre un plano. Carga diferida, responsive y con fallback SVG sin WebGL.
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
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
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
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      camera.position.set(0, 0.15, 3.2);

      // Environment map (PBR) procedural para reflejos realistas sin assets.
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envCanvas = document.createElement('canvas');
      envCanvas.width = 1024;
      envCanvas.height = 512;
      const ectx = envCanvas.getContext('2d');
      if (ectx) {
        const sky = ectx.createLinearGradient(0, 0, 0, 512);
        sky.addColorStop(0, '#ffffff');
        sky.addColorStop(0.45, '#dfe3e8');
        sky.addColorStop(0.55, '#b7bcc2');
        sky.addColorStop(1, '#565b62');
        ectx.fillStyle = sky;
        ectx.fillRect(0, 0, 1024, 512);
        const envKey = ectx.createRadialGradient(300, 140, 12, 300, 140, 280);
        envKey.addColorStop(0, 'rgba(255,255,255,1)');
        envKey.addColorStop(1, 'rgba(255,255,255,0)');
        ectx.fillStyle = envKey;
        ectx.fillRect(0, 0, 1024, 512);
        const envGlow = ectx.createRadialGradient(820, 360, 12, 820, 360, 240);
        envGlow.addColorStop(0, 'rgba(209,252,42,0.85)');
        envGlow.addColorStop(1, 'rgba(209,252,42,0)');
        ectx.fillStyle = envGlow;
        ectx.fillRect(0, 0, 1024, 512);
      }
      const envTex = new THREE.CanvasTexture(envCanvas);
      envTex.mapping = THREE.EquirectangularReflectionMapping;
      envTex.colorSpace = THREE.SRGBColorSpace;
      const envRT = pmrem.fromEquirectangular(envTex);
      scene.environment = envRT.texture;
      envTex.dispose();

      scene.add(new THREE.AmbientLight(0xffffff, 0.3));
      const key = new THREE.DirectionalLight(0xffffff, 2.6);
      key.position.set(-3, 4, 3);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.near = 0.5;
      key.shadow.camera.far = 15;
      key.shadow.camera.left = -3;
      key.shadow.camera.right = 3;
      key.shadow.camera.top = 3;
      key.shadow.camera.bottom = -3;
      key.shadow.bias = -0.0004;
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xd1fc2a, 1.3);
      rim.position.set(2.5, -1, -2.5);
      scene.add(rim);

      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (ctx) drawBallTexture(ctx, canvas.width, canvas.height);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

      const geometry = new THREE.SphereGeometry(1, 128, 128);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.5,
        metalness: 0.0,
        envMapIntensity: 1.0,
      });
      const ball = new THREE.Mesh(geometry, material);
      ball.rotation.set(0.35, 0, -0.15);
      ball.castShadow = true;
      ball.receiveShadow = true;
      scene.add(ball);

      // Plano que solo muestra la sombra proyectada (contact shadow).
      const groundGeom = new THREE.PlaneGeometry(8, 8);
      const groundMat = new THREE.ShadowMaterial({ opacity: 0.38 });
      const ground = new THREE.Mesh(groundGeom, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -1.08;
      ground.receiveShadow = true;
      scene.add(ground);

      const clock = new THREE.Clock();
      let raf = 0;
      const animate = () => {
        raf = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        ball.rotation.y = t * 0.5;
        ball.rotation.x = 0.35 + Math.sin(t * 0.6) * 0.07;
        ball.position.y = 0.02 + Math.sin(t * 1.1) * 0.05;
        renderer!.render(scene, camera);
      };
      animate();

      const resize = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        if (!w || !h) return;
        renderer!.setSize(w, h);
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
        groundGeom.dispose();
        groundMat.dispose();
        envRT.dispose();
        pmrem.dispose();
        renderer!.dispose();
        if (renderer!.domElement.parentNode === mount) {
          mount.removeChild(renderer!.domElement);
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
