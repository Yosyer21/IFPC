// Tipos para cargadores de three.js importados con extensión `.js` (ESM real).
declare module 'three/examples/jsm/loaders/GLTFLoader.js' {
  import type { Loader, Object3D } from 'three';
  export class GLTFLoader extends Loader {
    load(
      url: string,
      onLoad: (gltf: { scene: Object3D }) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (error: unknown) => void
    ): void;
  }
}
