'use client';

import { useEffect, useRef } from 'react';

/**
 * Fondo 3D del hero (WebGL / three.js): campo de partículas con profundidad
 * (fog), brillo aditivo y parallax con el ratón. Ligero (DPR limitado, pausa si
 * la pestaña o el hero no están visibles) y respeta «reducir movimiento».
 */
export function HeroParticles({ className = '' }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

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
        return;
      }
      if (!renderer) return;

      const width = mount.clientWidth || 1;
      const height = mount.clientHeight || 1;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x0a0a0a, 0.05);
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 120);
      camera.position.z = 6;

      // Sprite redondo con brillo (una sola textura para todos los puntos).
      const spriteCanvas = document.createElement('canvas');
      spriteCanvas.width = 64;
      spriteCanvas.height = 64;
      const sctx = spriteCanvas.getContext('2d');
      if (sctx) {
        const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.4, 'rgba(255,255,255,0.55)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        sctx.fillStyle = grad;
        sctx.fillRect(0, 0, 64, 64);
      }
      const sprite = new THREE.CanvasTexture(spriteCanvas);
      sprite.colorSpace = THREE.SRGBColorSpace;

      const COUNT = 1600;
      const positions = new Float32Array(COUNT * 3);
      const colors = new Float32Array(COUNT * 3);
      const white = new THREE.Color('#ffffff');
      const lime = new THREE.Color('#d1fc2a');
      for (let i = 0; i < COUNT; i += 1) {
        positions[i * 3] = (Math.random() - 0.5) * 16;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 11;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 11 - 2;
        const color = Math.random() < 0.22 ? lime : white;
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }
      const basePositions = positions.slice();

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const material = new THREE.PointsMaterial({
        size: 0.15,
        map: sprite,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        sizeAttenuation: true,
        opacity: 0.9,
      });
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
      const onPointer = (event: PointerEvent) => {
        pointer.tx = event.clientX / window.innerWidth - 0.5;
        pointer.ty = event.clientY / window.innerHeight - 0.5;
      };
      if (!reduced) window.addEventListener('pointermove', onPointer, { passive: true });

      let visible = true;
      const observer = new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0.01 }
      );
      observer.observe(mount);

      const clock = new THREE.Clock();
      let raf = 0;
      const animate = () => {
        raf = requestAnimationFrame(animate);
        if (document.hidden || !visible) return;
        const t = clock.getElapsedTime();
        pointer.x += (pointer.tx - pointer.x) * 0.05;
        pointer.y += (pointer.ty - pointer.y) * 0.05;
        points.rotation.y = t * 0.04 + pointer.x * 0.3;
        points.rotation.x = pointer.y * 0.18;

        const attr = geometry.getAttribute('position') as import('three').BufferAttribute;
        const array = attr.array as Float32Array;
        for (let i = 0; i < COUNT; i += 1) {
          array[i * 3 + 1] =
            (basePositions[i * 3 + 1] ?? 0) + Math.sin(t * 0.6 + i * 0.7) * 0.12;
        }
        attr.needsUpdate = true;
        renderer!.render(scene, camera);
      };

      if (reduced) {
        renderer.render(scene, camera);
      } else {
        animate();
      }

      const resize = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        if (!w || !h) return;
        renderer!.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);

      cleanup = () => {
        cancelAnimationFrame(raf);
        observer.disconnect();
        resizeObserver.disconnect();
        window.removeEventListener('pointermove', onPointer);
        geometry.dispose();
        material.dispose();
        sprite.dispose();
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

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}
