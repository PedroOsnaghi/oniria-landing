// Extensiones de tipos globales para Astro + Three.js

interface WebGLManagerInterface {
    isInitialized: boolean;
    components: Map<string, () => Promise<void> | void>;
    eventBus: EventTarget;
    registerComponent(name: string, initFn: () => Promise<void> | void): void;
    initComponent(name: string): Promise<void>;
    initAll(): Promise<void>;
    on(event: string, callback: (e: Event) => void): void;
    emit(event: string, data?: any): void;
}

declare global {
    interface Window {
        WebGLManager: WebGLManagerInterface;
        gsap?: any;
        ScrollTrigger?: any;
    }
}

// Para archivos GLSL shader
declare module "*.glsl" {
    const content: string;
    export default content;
}

declare module "*.vert" {
    const content: string;
    export default content;
}

declare module "*.frag" {
    const content: string;
    export default content;
}

// Para Three.js en contexto de Astro
declare module "three" {
    interface Object3D {
        position: {
            x: number;
            y: number;
            z: number;
            set(x: number, y: number, z: number): void;
        };
        scale: {
            x: number;
            y: number;
            z: number;
            set(x: number, y: number, z: number): void;
        };
        rotation: {
            x: number;
            y: number;
            z: number;
            set(x: number, y: number, z: number): void;
        };
    }
}

export { };