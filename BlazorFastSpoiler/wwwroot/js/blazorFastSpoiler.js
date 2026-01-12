// BlazorFastSpoiler - Pure JavaScript particle animation system
// Uses requestAnimationFrame for smooth 60fps animations with minimal C# interop

const instances = new WeakMap();
const PARTICLE_SIZES = [[1, 1], [1, 2], [2, 1], [2, 2]];

class Particle {
    constructor(x, y, vx, vy, width, height, life, maxLife, maxAlpha) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = width;
        this.height = height;
        this.life = life;
        this.maxLife = maxLife;
        this.alpha = 0;
        this.maxAlpha = maxAlpha;
    }
}

class ParticleCanvas {
    constructor(container, box, config) {
        this.container = container;
        this.box = box;
        this.config = config;
        this.particles = [];
        this.spawning = true;
        this.revealing = false;
        
        this.createCanvas();
        this.initParticles();
    }
    
    createCanvas() {
        const { x, y, width, height } = this.box;
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas = document.createElement('canvas');
        this.canvas.width = Math.ceil(width * dpr);
        this.canvas.height = Math.ceil(height * dpr);
        this.canvas.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: ${width}px;
            height: ${height}px;
            pointer-events: none;
            z-index: 1;
        `;
        
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        this.ctx.scale(dpr, dpr);
        this.container.appendChild(this.canvas);
    }
    
    initParticles() {
        const { width, height } = this.box;
        const area = width * height;
        const targetCount = Math.ceil((area / 100) * this.config.density);
        
        for (let i = 0; i < targetCount; i++) {
            const p = this.createParticle();
            // Start particles in middle of their lifecycle (fully visible)
            const fadeIn = p.maxLife * 0.2;
            const fadeOut = p.maxLife * 0.2;
            p.life = fadeIn + Math.random() * (p.maxLife - fadeIn - fadeOut);
            p.alpha = p.maxAlpha;
            this.particles.push(p);
        }
    }
    
    createParticle() {
        const { width, height } = this.box;
        const [sw, sh] = PARTICLE_SIZES[Math.floor(Math.random() * PARTICLE_SIZES.length)];
        const scale = this.config.scale;
        const pWidth = sw * scale;
        const pHeight = sh * scale;
        
        const padding = 2;
        const x = padding + Math.random() * Math.max(0, width - pWidth - padding * 2);
        const y = padding + Math.random() * Math.max(0, height - pHeight - padding * 2);
        
        const speed = this.config.minVelocity + Math.random() * (this.config.maxVelocity - this.config.minVelocity);
        const angle = Math.random() * Math.PI * 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        const lifeVariation = 0.5;
        const baseLife = this.config.particleLifetime;
        const life = baseLife * (1 - lifeVariation) + Math.random() * baseLife * lifeVariation * 2;
        const maxAlpha = Math.random() < 0.5 ? 1.0 : 0.3 + Math.random() * 0.3;
        
        return new Particle(x, y, vx, vy, pWidth, pHeight, life, life, maxAlpha);
    }
    
    update() {
        const { width, height } = this.box;
        
        // Update existing particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Accelerate outward during reveal
            if (this.revealing) {
                const cx = width / 2;
                const cy = height / 2;
                const dx = p.x - cx;
                const dy = p.y - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 0.1) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.max(this.config.minVelocity, Math.sqrt(p.vx * p.vx + p.vy * p.vy)) * 3;
                    p.vx = Math.cos(angle) * speed;
                    p.vy = Math.sin(angle) * speed;
                } else {
                    const speed = Math.max(Math.sqrt(p.vx * p.vx + p.vy * p.vy), this.config.minVelocity) * 3;
                    p.vx = (dx / dist) * speed;
                    p.vy = (dy / dist) * speed;
                }
            }
            
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            
            // Calculate alpha based on lifecycle
            const fadeIn = p.maxLife * 0.2;
            const fadeOut = p.maxLife * 0.2;
            
            if (p.life > p.maxLife - fadeIn) {
                p.alpha = ((p.maxLife - p.life) / fadeIn) * p.maxAlpha;
            } else if (p.life < fadeOut || this.revealing) {
                const fadeDur = this.revealing ? p.maxLife * 0.3 : fadeOut;
                const progress = this.revealing 
                    ? Math.min(1, (p.maxLife - p.life) / fadeDur)
                    : p.life / fadeOut;
                p.alpha = (1 - progress) * p.maxAlpha;
            } else {
                p.alpha = p.maxAlpha;
            }
            
            // Remove dead or out-of-bounds particles
            const margin = Math.max(width, height) * 0.5;
            if (p.life <= 0 || p.x < -margin || p.x > width + margin || p.y < -margin || p.y > height + margin) {
                // Swap-remove to avoid O(n) splice cost.
                const last = this.particles.length - 1;
                if (i !== last) {
                    this.particles[i] = this.particles[last];
                }
                this.particles.pop();
            }
        }
        
        // Spawn new particles to maintain density
        if (this.spawning && !this.revealing) {
            const area = width * height;
            const targetCount = Math.ceil((area / 100) * this.config.density);
            
            while (this.particles.length < targetCount) {
                const p = this.createParticle();
                p.life = p.maxLife * (0.2 + Math.random() * 0.6);
                p.alpha = p.maxAlpha;
                this.particles.push(p);
            }
        }
    }
    
    draw() {
        const { width, height } = this.box;
        this.ctx.clearRect(0, 0, width, height);
        
        if (this.particles.length === 0) return;
        
        this.ctx.fillStyle = this.config.textColor;
        
        for (const p of this.particles) {
            if (p.alpha > 0) {
                this.ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
                this.ctx.fillRect(
                    Math.round(p.x),
                    Math.round(p.y),
                    Math.max(1, Math.ceil(p.width)),
                    Math.max(1, Math.ceil(p.height))
                );
            }
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    updatePosition(x, y) {
        this.box.x = x;
        this.box.y = y;
        this.canvas.style.left = `${x}px`;
        this.canvas.style.top = `${y}px`;
    }
    
    hasParticles() {
        return this.particles.length > 0;
    }
    
    startReveal() {
        this.revealing = true;
        this.spawning = false;
    }
    
    destroy() {
        if (this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

class SpoilerInstance {
    constructor(element, config, dotNetRef) {
        this.element = element;
        this.config = config;
        this.dotNetRef = dotNetRef;
        this.canvases = [];
        this.animationId = null;
        this.revealed = false;
        this.revealing = false;
        this.resizeObserver = null;
        this.resizeDebounceTimer = null;
        this.range = document.createRange();
        
        this.init();
    }
    
    init() {
        // Get text color from computed style (walking up DOM if transparent)
        this.config.textColor = this.getTextColor();
        
        // Create canvases for each text/element node
        this.createCanvases();
        
        // Setup resize observer
        this.setupResizeObserver();
        
        // Start animation loop
        this.startAnimation();
    }
    
    getTextColor() {
        let el = this.element.parentElement || this.element;
        
        while (el && el !== document.body) {
            const style = getComputedStyle(el);
            const color = style.color;
            
            if (color && color !== 'transparent' && 
                color !== 'rgba(0, 0, 0, 0)' && 
                !color.endsWith(', 0)')) {
                return color;
            }
            el = el.parentElement;
        }
        
        return getComputedStyle(document.body).color || '#000000';
    }
    
    createCanvases() {
        // Clear existing canvases
        this.canvases.forEach(c => c.destroy());
        this.canvases = [];
        
        const containerRect = this.element.getBoundingClientRect();
        
        for (const node of this.element.childNodes) {
            // Skip existing canvas elements
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'CANVAS') continue;
            
            let rects;
            if (node.nodeType === Node.TEXT_NODE) {
                this.range.selectNodeContents(node);
                rects = this.range.getClientRects();
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                rects = node.getClientRects();
            } else {
                continue;
            }
            
            for (const rect of rects) {
                if (rect.width > 0 && rect.height > 0) {
                    const box = {
                        x: rect.left - containerRect.left,
                        y: rect.top - containerRect.top,
                        width: rect.width,
                        height: rect.height
                    };
                    
                    const canvas = new ParticleCanvas(this.element, box, this.config);
                    this.canvases.push(canvas);
                }
            }
        }
    }
    
    setupResizeObserver() {
        let lastWidth = this.element.offsetWidth;
        let lastHeight = this.element.offsetHeight;
        
        this.resizeObserver = new ResizeObserver(entries => {
            if (this.revealed || this.revealing) return;
            
            const entry = entries[0];
            const { width, height } = entry.contentRect;
            
            if (Math.abs(width - lastWidth) > 1 || Math.abs(height - lastHeight) > 1) {
                lastWidth = width;
                lastHeight = height;
                
                // Debounce recreation
                clearTimeout(this.resizeDebounceTimer);
                this.resizeDebounceTimer = setTimeout(() => {
                    if (!this.revealed && !this.revealing) {
                        this.createCanvases();
                    }
                }, 100);
            }
        });
        
        this.resizeObserver.observe(this.element);
        
        // Handle scroll for position updates
        this.scrollHandler = () => {
            if (this.revealed || this.canvases.length === 0) return;
            this.updateCanvasPositions();
        };
        
        window.addEventListener('scroll', this.scrollHandler, { passive: true });
    }
    
    updateCanvasPositions() {
        const containerRect = this.element.getBoundingClientRect();
        let canvasIndex = 0;
        
        for (const node of this.element.childNodes) {
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'CANVAS') continue;
            
            let rects;
            if (node.nodeType === Node.TEXT_NODE) {
                this.range.selectNodeContents(node);
                rects = this.range.getClientRects();
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                rects = node.getClientRects();
            } else {
                continue;
            }
            
            for (const rect of rects) {
                if (rect.width > 0 && rect.height > 0 && canvasIndex < this.canvases.length) {
                    const x = rect.left - containerRect.left;
                    const y = rect.top - containerRect.top;
                    this.canvases[canvasIndex].updatePosition(x, y);
                    canvasIndex++;
                }
            }
        }
    }
    
    startAnimation() {
        if (this.animationId !== null) return;
        
        const animate = () => {
            if (this.revealed) {
                this.animationId = null;
                return;
            }
            
            // Update and draw all canvases
            let hasParticles = false;
            for (const canvas of this.canvases) {
                canvas.update();
                canvas.draw();
                if (canvas.hasParticles()) hasParticles = true;
            }
            
            // Check if reveal animation is complete
            if (this.revealing && !hasParticles) {
                this.completeReveal();
                return;
            }
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);
    }
    
    reveal() {
        if (this.revealed || this.revealing) return;
        
        this.revealing = true;
        
        // Start reveal animation on all canvases
        for (const canvas of this.canvases) {
            canvas.startReveal();
        }
    }
    
    async completeReveal() {
        this.animationId = null;
        
        // Clean up canvases
        this.canvases.forEach(c => c.destroy());
        this.canvases = [];
        
        // Notify Blazor that reveal animation is starting
        if (this.dotNetRef) {
            try {
                await this.dotNetRef.invokeMethodAsync('OnRevealStart');
            } catch (e) {
                // Component may have been disposed
            }
        }
        
        // Wait for text fade-in duration
        await new Promise(resolve => setTimeout(resolve, this.config.revealDuration));
        
        this.revealed = true;
        
        // Notify Blazor that reveal is complete
        if (this.dotNetRef) {
            try {
                await this.dotNetRef.invokeMethodAsync('OnRevealComplete');
            } catch (e) {
                // Component may have been disposed
            }
        }
    }
    
    dispose() {
        this.revealed = true; // Stop animation
        
        if (this.resizeDebounceTimer) {
            clearTimeout(this.resizeDebounceTimer);
            this.resizeDebounceTimer = null;
        }
        
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        
        if (this.scrollHandler) {
            window.removeEventListener('scroll', this.scrollHandler);
            this.scrollHandler = null;
        }
        
        this.canvases.forEach(c => c.destroy());
        this.canvases = [];
    }
}

// Public API functions called from Blazor

export function initialize(element, config, dotNetRef) {
    if (!element || instances.has(element)) return;
    
    const instance = new SpoilerInstance(element, {
        scale: config.scale ?? 1,
        minVelocity: config.minVelocity ?? 0.01,
        maxVelocity: config.maxVelocity ?? 0.05,
        particleLifetime: config.particleLifetime ?? 120,
        density: config.density ?? 8,
        revealDuration: config.revealDuration ?? 300,
        textColor: '#000000'
    }, dotNetRef);
    
    instances.set(element, instance);
}

export function reveal(element) {
    const instance = instances.get(element);
    if (instance) {
        instance.reveal();
    }
}

export function dispose(element) {
    const instance = instances.get(element);
    if (instance) {
        instance.dispose();
        instances.delete(element);
    }
}
