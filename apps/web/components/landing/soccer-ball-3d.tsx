'use client';

import { useEffect, useRef, useState } from 'react';
import { SoccerBall } from './soccer-ball';

/**
 * Textura del balón (equirectangular) en disposición **esférica** correcta: 12
 * pentágonos negros (5+5 en anillos + 2 casquetes polares) como un balón real.
 * Cada pentágono se dibuja compensando la distorsión equirectangular (ancho
 * dividido por `cos(latitud)`) para que NO se estiren cerca de los hemisferios.
 */
function drawBallTexture(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, '#ffffff');
  base.addColorStop(0.5, '#f5f6f3');
  base.addColorStop(1, '#e4e7ea');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const ALPHA = 0.4; // radio angular del pentágono (rad)
  const alphaDeg = (ALPHA * 180) / Math.PI;

  const pentagon = (cx: number, cy: number, rx: number, ry: number) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const angle = ((-90 + i * 72) * Math.PI) / 180;
      const x = cx + rx * Math.cos(angle);
      const y = cy + ry * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const shade = ctx.createRadialGradient(cx - rx * 0.3, cy - ry * 0.3, ry * 0.15, cx, cy, ry);
    shade.addColorStop(0, '#2c2c33');
    shade.addColorStop(1, '#0c0c10');
    ctx.fillStyle = shade;
    ctx.fill();
  };

  // Casquetes polares: el pentágono del polo se mapea como un casquete circular
  // (banda de ancho completo) → sin estiramiento.
  const capPx = (alphaDeg / 180) * height;
  ctx.fillStyle = '#131318';
  ctx.fillRect(0, 0, width, capPx);
  ctx.fillRect(0, height - capPx, width, capPx);

  // Dos anillos de 5 pentágonos a ±26.565° (vértices de un icosaedro).
  const rings = [
    { lat: 26.565, lons: [0, 72, 144, 216, 288] },
    { lat: -26.565, lons: [36, 108, 180, 252, 324] },
  ];
  for (const ring of rings) {
    const phi = (ring.lat * Math.PI) / 180;
    const ry = (ALPHA / Math.PI) * height;
    const rx = (ALPHA / Math.cos(phi) / (2 * Math.PI)) * width;
    const cy = ((90 - ring.lat) / 180) * height;
    for (const lon of ring.lons) {
      for (const off of [-width, 0, width]) {
        pentagon((lon / 360) * width + off, cy, rx, ry);
      }
    }
  }
}

/** Environment de estudio/estadio (equirectangular) para reflejos PBR. */
function drawEnv(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#eef4ff');
  sky.addColorStop(0.4, '#c9d3df');
  sky.addColorStop(0.75, '#8b95a1');
  sky.addColorStop(1, '#5b6169');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const flood = (x: number, y: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 4, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  };
  flood(w * 0.2, h * 0.22, h * 0.5, 'rgba(255,255,255,1)');
  flood(w * 0.5, h * 0.16, h * 0.42, 'rgba(240,248,255,0.95)');
  flood(w * 0.8, h * 0.28, h * 0.5, 'rgba(255,255,255,0.9)');

  const pitch = ctx.createLinearGradient(0, h * 0.72, 0, h);
  pitch.addColorStop(0, 'rgba(74,124,60,0)');
  pitch.addColorStop(1, 'rgba(52,92,44,0.55)');
  ctx.fillStyle = pitch;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);

  flood(w * 0.7, h * 0.62, h * 0.3, 'rgba(209,252,42,0.5)');
}

/**
 * Balón de fútbol **3D real y realista** (WebGL / three.js): esfera 2K con PBR,
 * environment de estadio (reflejos), ACES tone mapping, sombra de contacto real,
 * **arrastrar para girar** y soporte de modelo **`.glb`** (`public/models/soccer-ball.glb`).
 */
export function SoccerBall3D({ className = '' }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import('three');
      let GLTFLoader: typeof import('three/examples/jsm/loaders/GLTFLoader.js').GLTFLoader | null = null;
      try {
        ({ GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js'));
      } catch {
        GLTFLoader = null;
      }

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
      renderer.toneMappingExposure = 1.12;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      camera.position.set(0, 0.45, 4.0);
      camera.lookAt(0, 0.05, 0);

      // Environment (PBR).
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envCanvas = document.createElement('canvas');
      envCanvas.width = 1024;
      envCanvas.height = 512;
      const ectx = envCanvas.getContext('2d');
      if (ectx) drawEnv(ectx, 1024, 512);
      const envTex = new THREE.CanvasTexture(envCanvas);
      envTex.mapping = THREE.EquirectangularReflectionMapping;
      envTex.colorSpace = THREE.SRGBColorSpace;
      const envRT = pmrem.fromEquirectangular(envTex);
      scene.environment = envRT.texture;
      envTex.dispose();

      scene.add(new THREE.AmbientLight(0xffffff, 0.28));
      const key = new THREE.DirectionalLight(0xffffff, 2.7);
      key.position.set(-3, 4.5, 3.5);
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      key.shadow.camera.near = 0.5;
      key.shadow.camera.far = 15;
      key.shadow.camera.left = -2.2;
      key.shadow.camera.right = 2.2;
      key.shadow.camera.top = 2.2;
      key.shadow.camera.bottom = -2.2;
      key.shadow.bias = -0.0004;
      key.shadow.radius = 4;
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xd1fc2a, 1.4);
      rim.position.set(2.5, -1, -2.5);
      scene.add(rim);
      const fill = new THREE.DirectionalLight(0xffffff, 0.7);
      fill.position.set(3, 2, 4);
      scene.add(fill);

      // Pivote (sube el balón en la escena para que no salga cortado).
      const pivot = new THREE.Group();
      pivot.position.set(0, 0.18, 0);
      scene.add(pivot);

      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (ctx) drawBallTexture(ctx, canvas.width, canvas.height);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

      const geometry = new THREE.SphereGeometry(1, 160, 160);
      const material = new THREE.MeshPhysicalMaterial({
        map: texture,
        roughness: 0.42,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.32,
        envMapIntensity: 1.35,
      });
      const ball = new THREE.Mesh(geometry, material);
      ball.castShadow = true;
      ball.receiveShadow = true;
      pivot.add(ball);

      // Sombra de contacto (plano que solo pinta la sombra).
      const groundGeom = new THREE.PlaneGeometry(10, 10);
      const groundMat = new THREE.ShadowMaterial({ opacity: 0.5 });
      const ground = new THREE.Mesh(groundGeom, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.92;
      ground.receiveShadow = true;
      scene.add(ground);

      // Modelo .glb opcional (si existe en public/models/soccer-ball.glb).
      if (GLTFLoader) {
        const hasGlb = await fetch('/models/soccer-ball.glb', { method: 'HEAD' })
          .then((r) => r.ok)
          .catch(() => false);
        if (hasGlb && !disposed) {
          try {
            new GLTFLoader().load(
              '/models/soccer-ball.glb',
              (gltf) => {
                if (disposed) return;
                const model = gltf.scene;
                const box = new THREE.Box3().setFromObject(model);
                const size = new THREE.Vector3();
                box.getSize(size);
                const maxDim = Math.max(size.x, size.y, size.z) || 1;
                const s = 2 / maxDim;
                model.scale.setScalar(s);
                const center = new THREE.Vector3();
                box.getCenter(center);
                model.position.sub(center.multiplyScalar(s));
                model.traverse((obj) => {
                  const mesh = obj as import('three').Mesh;
                  if (mesh.isMesh) {
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;
                  }
                });
                ball.visible = false;
                pivot.add(model);
              },
              undefined,
              () => {}
            );
          } catch {
            /* sin .glb: se queda la esfera procedural */
          }
        }
      }

      // Arrastrar para girar.
      const el = renderer.domElement;
      el.style.touchAction = 'none';
      el.style.cursor = 'grab';
      let dragging = false;
      let lastX = 0;
      let lastY = 0;
      let dragX = 0;
      let dragY = 0;
      const onDown = (e: PointerEvent) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        el.style.cursor = 'grabbing';
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        dragY += (e.clientX - lastX) * 0.01;
        dragX += (e.clientY - lastY) * 0.01;
        dragX = Math.max(-1.1, Math.min(1.1, dragX));
        lastX = e.clientX;
        lastY = e.clientY;
      };
      const onUp = () => {
        dragging = false;
        el.style.cursor = 'grab';
      };
      el.addEventListener('pointerdown', onDown);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);

      const clock = new THREE.Clock();
      let elapsed = 0;
      let autoY = 0;
      let raf = 0;
      const animate = () => {
        raf = requestAnimationFrame(animate);
        const dt = clock.getDelta();
        elapsed += dt;
        if (!dragging) autoY += dt * 0.5;
        pivot.rotation.y = autoY + dragY;
        pivot.rotation.x = 0.3 + dragX + Math.sin(elapsed * 0.6) * 0.03;
        pivot.position.y = 0.18 + (dragging ? 0 : Math.sin(elapsed * 1.1) * 0.04);
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
        el.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        scene.traverse((obj) => {
          const mesh = obj as import('three').Mesh;
          if (mesh.isMesh) {
            mesh.geometry?.dispose?.();
            const mat = mesh.material as import('three').MeshStandardMaterial | import('three').MeshStandardMaterial[];
            const list = Array.isArray(mat) ? mat : [mat];
            for (const item of list) {
              item.map?.dispose?.();
              item.dispose?.();
            }
          }
        });
        texture.dispose();
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
