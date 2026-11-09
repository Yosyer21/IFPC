'use client';

import { useEffect, useRef } from 'react';

/**
 * Campo de partículas 3D del hero (WebGL / three.js).
 *
 * - Dos capas (núcleo + halo) sobre la misma geometría: brillo tipo bloom sin
 *   postprocessing, para no perder la transparencia sobre la foto del hero.
 * - El polvo se agrupa alrededor del balón (abajo-derecha) y una máscara CSS
 *   (`.hero-particles-mask`) deja libre la zona de texto.
 * - Al hacer scroll la cámara atraviesa el campo y las partículas se apagan,
 *   de modo que la transición a la sección siguiente es limpia.
 * - El cursor empuja las partículas (repulsión suave) además del parallax.
 * - Respeta «reducir movimiento», se pausa fuera de viewport o con la pestaña
 *   oculta y libera todos los recursos al desmontarse.
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
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        });
      } catch {
        return;
      }
      if (!renderer) return;

      const width = mount.clientWidth || 1;
      const height = mount.clientHeight || 1;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.style.display = 'block';
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x0b0f14, 0.055);
      const camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 120);
      camera.position.z = 6;

      /** Sprite radial: núcleo nítido o halo ancho para el falso bloom. */
      const makeGlowTexture = (sharp: boolean) => {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
          if (sharp) {
            grad.addColorStop(0, 'rgba(255,255,255,1)');
            grad.addColorStop(0.35, 'rgba(255,255,255,0.7)');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
          } else {
            grad.addColorStop(0, 'rgba(255,255,255,0.5)');
            grad.addColorStop(0.45, 'rgba(255,255,255,0.14)');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
          }
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, size, size);
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
      };
      const coreSprite = makeGlowTexture(true);
      const haloSprite = makeGlowTexture(false);

      const COUNT = 1400;
      const positions = new Float32Array(COUNT * 3);
      const colors = new Float32Array(COUNT * 3);
      const white = new THREE.Color('#ffffff');
      const lime = new THREE.Color('#d1fc2a');

      for (let i = 0; i < COUNT; i += 1) {
        const index = i * 3;
        let x: number;
        let y: number;
        let z: number;

        if (Math.random() < 0.6) {
          // Cúmulo alrededor del balón decorativo (abajo-derecha).
          const radius = Math.pow(Math.random(), 0.62) * 4.4;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          x = 1.0 + radius * Math.sin(phi) * Math.cos(theta);
          y = -0.8 + radius * Math.cos(phi) * 0.7;
          z = -1.6 + radius * Math.sin(phi) * Math.sin(theta);
        } else {
          // Polvo ambiental, sesgado a la mitad derecha de la escena.
          x = Math.random() * 9 - 4.5;
          y = (Math.random() - 0.5) * 11;
          z = (Math.random() - 0.5) * 11 - 2;
        }

        positions[index] = x;
        positions[index + 1] = y;
        positions[index + 2] = z;

        const color = Math.random() < 0.26 ? lime : white;
        colors[index] = color.r;
        colors[index + 1] = color.g;
        colors[index + 2] = color.b;
      }
      const basePositions = positions.slice();

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const coreMaterial = new THREE.PointsMaterial({
        size: 0.085,
        map: coreSprite,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        sizeAttenuation: true,
        opacity: 0.85,
      });
      const haloMaterial = new THREE.PointsMaterial({
        size: 0.46,
        map: haloSprite,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        sizeAttenuation: true,
        opacity: 0.2,
      });

      const core = new THREE.Points(geometry, coreMaterial);
      const halo = new THREE.Points(geometry, haloMaterial);
      scene.add(halo);
      scene.add(core);

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
      const onPointer = (event: PointerEvent) => {
        pointer.tx = event.clientX / window.innerWidth - 0.5;
        pointer.ty = event.clientY / window.innerHeight - 0.5;
      };
      if (!reduced) window.addEventListener('pointermove', onPointer, { passive: true });

      let visible = true;
      const visibilityObserver = new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0.01 }
      );
      visibilityObserver.observe(mount);

      const clock = new THREE.Clock();
      let raf = 0;
      const cursor = new THREE.Vector3();
      const unprojected = new THREE.Vector3();
      const direction = new THREE.Vector3();

      const animate = () => {
        raf = requestAnimationFrame(animate);
        if (document.hidden || !visible) return;

        const t = clock.getElapsedTime();
        pointer.x += (pointer.tx - pointer.x) * 0.05;
        pointer.y += (pointer.ty - pointer.y) * 0.05;

        // Progreso dentro del hero: la cámara entra en el campo al hacer scroll.
        const rect = mount.getBoundingClientRect();
        const progress = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height, 1)));
        const fade = 1 - progress * 0.9;

        camera.position.z = 6 - progress * 4.2;
        core.rotation.y = t * 0.035 + pointer.x * 0.32 + progress * 0.35;
        core.rotation.x = pointer.y * 0.16;
        halo.rotation.copy(core.rotation);

        coreMaterial.opacity = 0.85 * fade;
        haloMaterial.opacity = 0.2 * fade;

        // Cursor en el plano z = 0 para la repulsión.
        unprojected.set(pointer.tx * 2, -pointer.ty * 2, 0.5).unproject(camera);
        direction.copy(unprojected).sub(camera.position).normalize();
        const planeDistance = -camera.position.z / (direction.z || -1);
        cursor.copy(camera.position).addScaledVector(direction, planeDistance);

        const attribute = geometry.getAttribute('position') as import('three').BufferAttribute;
        const array = attribute.array as Float32Array;
        const radius = 2.6;
        const radiusSq = radius * radius;

        for (let i = 0; i < COUNT; i += 1) {
          const index = i * 3;
          const baseX = basePositions[index] ?? 0;
          const baseY = basePositions[index + 1] ?? 0;
          const baseZ = basePositions[index + 2] ?? 0;

          let px = baseX + Math.sin(t * 0.5 + i * 0.9) * 0.16;
          let py = baseY + Math.sin(t * 0.65 + i * 0.7) * 0.14;
          const pz = baseZ + Math.sin(t * 0.4 + i * 1.3) * 0.12;

          const dx = px - cursor.x;
          const dy = py - cursor.y;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq < radiusSq) {
            const distance = Math.sqrt(distanceSq) || 0.0001;
            const force = (1 - distance / radius) ** 2;
            px += (dx / distance) * force * 1.15;
            py += (dy / distance) * force * 1.15;
          }

          array[index] = px;
          array[index + 1] = py;
          array[index + 2] = pz;
        }
        attribute.needsUpdate = true;

        renderer!.render(scene, camera);
      };

      if (reduced) {
        camera.position.z = 6;
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
        visibilityObserver.disconnect();
        resizeObserver.disconnect();
        window.removeEventListener('pointermove', onPointer);
        geometry.dispose();
        coreMaterial.dispose();
        haloMaterial.dispose();
        coreSprite.dispose();
        haloSprite.dispose();
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
