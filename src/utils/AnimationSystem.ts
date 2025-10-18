// AnimationSystem.ts - Sistema central de animaciones con Lenis
// Reemplaza GSAP con un sistema propio + Lenis

interface AnimationConfig {
    element: HTMLElement | HTMLElement[];
    from?: Partial<CSSStyleDeclaration & { [key: string]: any }>;
    to: Partial<CSSStyleDeclaration & { [key: string]: any }>;
    duration?: number;
    easing?: string;
    delay?: number;
    onStart?: () => void;
    onComplete?: () => void;
    onUpdate?: (progress: number) => void;
}

interface ScrollAnimationConfig extends AnimationConfig {
    trigger: string | HTMLElement;
    start?: number; // 0-1 (porcentaje del viewport)
    end?: number;   // 0-1 (porcentaje del viewport)
    scrub?: boolean;
}

class AnimationSystem {
    private activeAnimations = new Map<string, Animation>();
    private scrollAnimations = new Map<string, ScrollAnimationConfig>();
    private observers = new Map<string, IntersectionObserver>();

    // Función de easing personalizada
    static easings = {
        linear: (t: number) => t,
        easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeOut: (t: number) => t * (2 - t),
        easeIn: (t: number) => t * t,
        elastic: (t: number) => {
            if (t === 0 || t === 1) return t;
            const p = 0.3;
            const s = p / 4;
            return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
        }
    };

    // Interpolar valores
    private lerp(start: number, end: number, progress: number): number {
        return start + (end - start) * progress;
    }

    // Convertir valores CSS
    private parseValue(value: string | number): { value: number; unit: string } {
        if (typeof value === 'number') return { value, unit: '' };
        const match = value.toString().match(/^(-?\d*\.?\d+)(.*)$/);
        return {
            value: parseFloat(match?.[1] || '0'),
            unit: match?.[2] || ''
        };
    }

    // Animar propiedades CSS
    animate(config: AnimationConfig): Promise<void> {
        return new Promise((resolve) => {
            const {
                element,
                from = {},
                to,
                duration = 1000,
                easing = 'easeInOut',
                delay = 0,
                onStart,
                onComplete,
                onUpdate
            } = config;

            const elements = Array.isArray(element) ? element : [element];
            const easingFn = AnimationSystem.easings[easing as keyof typeof AnimationSystem.easings] || AnimationSystem.easings.easeInOut;

            // Preparar valores iniciales y finales
            const animations = elements.map(el => {
                const fromValues: any = {};
                const toValues: any = {};
                const computedStyle = getComputedStyle(el);

                Object.keys(to).forEach(prop => {
                    const fromVal = from[prop] || computedStyle.getPropertyValue(prop) || '0';
                    const toVal = to[prop];

                    fromValues[prop] = this.parseValue(fromVal);
                    toValues[prop] = this.parseValue(toVal);
                });

                return { element: el, fromValues, toValues };
            });

            // Configurar valores iniciales
            animations.forEach(({ element: el, fromValues }) => {
                Object.keys(fromValues).forEach(prop => {
                    const { value, unit } = fromValues[prop];
                    (el.style as any)[prop] = `${value}${unit}`;
                });
            });

            const startTime = performance.now() + delay;
            let animationId: number;

            const update = (currentTime: number) => {
                const elapsed = currentTime - startTime;

                if (elapsed < 0) {
                    animationId = requestAnimationFrame(update);
                    return;
                }

                if (elapsed === 0 && onStart) onStart();

                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easingFn(progress);

                // Actualizar elementos
                animations.forEach(({ element: el, fromValues, toValues }) => {
                    Object.keys(toValues).forEach(prop => {
                        const from = fromValues[prop];
                        const to = toValues[prop];
                        const currentValue = this.lerp(from.value, to.value, easedProgress);
                        (el.style as any)[prop] = `${currentValue}${to.unit || from.unit}`;
                    });
                });

                if (onUpdate) onUpdate(easedProgress);

                if (progress < 1) {
                    animationId = requestAnimationFrame(update);
                } else {
                    if (onComplete) onComplete();
                    resolve();
                }
            };

            animationId = requestAnimationFrame(update);
        });
    }

    // Configurar animación basada en scroll
    scrollTrigger(id: string, config: ScrollAnimationConfig) {
        this.scrollAnimations.set(id, config);

        const triggerElement = typeof config.trigger === 'string'
            ? document.querySelector(config.trigger) as HTMLElement
            : config.trigger;

        if (!triggerElement) {
            console.warn(`ScrollTrigger: No se encontró el trigger ${config.trigger}`);
            return;
        }

        // Usar Intersection Observer para detectar cuando el elemento entra en viewport
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.executeScrollAnimation(id, config);
                }
            });
        }, {
            threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
            rootMargin: '0px'
        });

        observer.observe(triggerElement);
        this.observers.set(id, observer);
    }

    private executeScrollAnimation(id: string, config: ScrollAnimationConfig) {
        if (config.scrub) {
            // Para animaciones scrub, conectar con el scroll
            this.setupScrubAnimation(id, config);
        } else {
            // Para animaciones trigger, ejecutar una vez
            this.animate(config);
        }
    }

    private setupScrubAnimation(id: string, config: ScrollAnimationConfig) {
        const triggerElement = typeof config.trigger === 'string'
            ? document.querySelector(config.trigger) as HTMLElement
            : config.trigger;

        const updateOnScroll = () => {
            const rect = triggerElement.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            // Calcular progreso basado en posición en viewport
            const elementTop = rect.top;
            const elementHeight = rect.height;

            // Progreso: 0 cuando el elemento está abajo del viewport, 1 cuando está arriba
            const progress = Math.max(0, Math.min(1,
                (viewportHeight - elementTop) / (viewportHeight + elementHeight)
            ));

            // Aplicar animación basada en progreso
            this.applyScrollProgress(config, progress);
        };

        // Conectar con Lenis si está disponible
        if (window.lenis) {
            window.lenis.on('scroll', updateOnScroll);
        } else {
            window.addEventListener('scroll', updateOnScroll);
        }

        // Ejecutar una vez para estado inicial
        updateOnScroll();
    }

    private applyScrollProgress(config: ScrollAnimationConfig, progress: number) {
        const elements = Array.isArray(config.element) ? config.element : [config.element];
        const easingFn = AnimationSystem.easings[config.easing as keyof typeof AnimationSystem.easings] || AnimationSystem.easings.linear;
        const easedProgress = easingFn(progress);

        elements.forEach(el => {
            Object.keys(config.to).forEach(prop => {
                const fromVal = config.from?.[prop] || '0';
                const toVal = config.to[prop];

                const from = this.parseValue(fromVal);
                const to = this.parseValue(toVal);
                const currentValue = this.lerp(from.value, to.value, easedProgress);

                (el.style as any)[prop] = `${currentValue}${to.unit || from.unit}`;
            });
        });

        if (config.onUpdate) config.onUpdate(easedProgress);
    }

    // Limpiar animaciones
    cleanup(id?: string) {
        if (id) {
            const observer = this.observers.get(id);
            if (observer) {
                observer.disconnect();
                this.observers.delete(id);
            }
            this.scrollAnimations.delete(id);
        } else {
            this.observers.forEach(observer => observer.disconnect());
            this.observers.clear();
            this.scrollAnimations.clear();
        }
    }
}

// Instancia global
export const animationSystem = new AnimationSystem();

// Funciones de conveniencia para uso fácil
export const animate = (config: AnimationConfig) => animationSystem.animate(config);
export const scrollTrigger = (id: string, config: ScrollAnimationConfig) => animationSystem.scrollTrigger(id, config);

// Declarar tipo global
declare global {
    interface Window {
        lenis?: any;
        animationSystem: AnimationSystem;
    }
}

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.animationSystem = animationSystem;
}