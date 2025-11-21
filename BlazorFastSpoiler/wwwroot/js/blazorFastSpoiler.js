// BlazorFastSpoiler JavaScript Module
// Handles canvas-based particle effects for spoiler text

class ParticleManager {
    constructor(config, width, height) {
        this.config = config;
        this.width = width;
        this.height = height;
        this.particles = [];
        this.spawningEnabled = true;
        this.particleSizes = [
            { width: 1, height: 1 },
            { width: 1, height: 2 },
            { width: 2, height: 1 },
            { width: 2, height: 2 },
        ];
        this.initializeParticles();
    }

    updateDimensions(width, height) {
        this.width = width;
        this.height = height;
    }

    initializeParticles() {
        const area = this.width * this.height;
        const targetCount = Math.ceil((area / 100) * this.config.density);
        const initialCount = Math.ceil(targetCount * 0.5);
        
        for (let i = 0; i < initialCount; i++) {
            const particle = this.createParticle();
            particle.life = Math.random() * particle.maxLife;
            this.particles.push(particle);
        }
    }

    createParticle() {
        const sizeTemplate = this.particleSizes[Math.floor(Math.random() * this.particleSizes.length)];
        const scaledSize = this.config.scale;
        const particleWidth = sizeTemplate.width * scaledSize;
        const particleHeight = sizeTemplate.height * scaledSize;

        const padding = 2;
        const maxX = this.width - particleWidth - padding;
        const maxY = this.height - particleHeight - padding;
        const x = padding + Math.random() * Math.max(0, maxX - padding);
        const y = padding + Math.random() * Math.max(0, maxY - padding);

        const speed = Math.random() * (this.config.maxVelocity - this.config.minVelocity) + this.config.minVelocity;
        const angle = Math.random() * Math.PI * 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        const lifetimeVariation = 0.5;
        const minLifetime = this.config.particleLifetime * (1 - lifetimeVariation);
        const maxLifetime = this.config.particleLifetime * (1 + lifetimeVariation);
        const lifetime = Math.random() * (maxLifetime - minLifetime) + minLifetime;

        const maxAlpha = Math.random() < 0.5 ? 1.0 : 0.3 + Math.random() * 0.3;

        return {
            x, y, vx, vy,
            width: particleWidth,
            height: particleHeight,
            life: lifetime,
            maxLife: lifetime,
            alpha: 0,
            maxAlpha,
        };
    }

    update() {
        const area = this.width * this.height;
        const targetCount = Math.ceil((area / 100) * this.config.density);

        // Update existing particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life--;
            p.alpha = Math.min(p.maxAlpha, (p.life / p.maxLife) * p.maxAlpha);

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            p.x += p.vx;
            p.y += p.vy;

            // Bounce off edges
            if (p.x <= 0 || p.x + p.width >= this.width) p.vx *= -1;
            if (p.y <= 0 || p.y + p.height >= this.height) p.vy *= -1;

            p.x = Math.max(0, Math.min(this.width - p.width, p.x));
            p.y = Math.max(0, Math.min(this.height - p.height, p.y));
        }

        // Spawn new particles if enabled
        if (this.spawningEnabled && this.particles.length < targetCount) {
            const spawnCount = Math.min(2, targetCount - this.particles.length);
            for (let i = 0; i < spawnCount; i++) {
                this.particles.push(this.createParticle());
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.config.textColor;
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillRect(p.x, p.y, p.width, p.height);
        }
        ctx.globalAlpha = 1.0;
    }

    hasParticles() {
        return this.particles.length > 0;
    }

    stopSpawning() {
        this.spawningEnabled = false;
    }
}

class SpoilerManager {
    constructor(element, dotNetRef, config) {
        this.element = element;
        this.dotNetRef = dotNetRef;
        this.config = config;
        this.canvases = [];
        this.contexts = [];
        this.particleManagers = [];
        this.animationFrameId = null;
        this.textColor = '#000000';
        this.dpr = window.devicePixelRatio || 1;
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / Math.max(1, this.config.fps);
        this.revealed = false;
        this.revealing = false;
        this.resizeObserver = null;
        this.scrollHandler = null;
        this.resizeHandler = null;
        this.updateDebounceTimer = null;
        this.setupDebounceTimer = null;
        this.lastKnownWidth = 0;
        this.lastKnownHeight = 0;
        this.positionMonitorId = null;
        this.isMonitoringPosition = false;
    }

    async initialize() {
        const computedStyle = window.getComputedStyle(this.element);
        this.textColor = computedStyle.color;

        const boundingBoxes = this.getTextBoundingBoxes();
        if (boundingBoxes.length === 0) return;

        const containerRect = this.element.getBoundingClientRect();
        this.lastKnownWidth = containerRect.width;
        this.lastKnownHeight = containerRect.height;

        const particleConfig = {
            scale: this.config.scale,
            minVelocity: this.config.minVelocity,
            maxVelocity: this.config.maxVelocity,
            particleLifetime: this.config.particleLifetime,
            density: this.config.density,
            textColor: this.textColor,
        };

        for (const box of boundingBoxes) {
            const canvas = document.createElement('canvas');
            canvas.width = box.width * this.dpr;
            canvas.height = box.height * this.dpr;
            canvas.style.width = `${box.width}px`;
            canvas.style.height = `${box.height}px`;
            canvas.style.position = 'absolute';
            canvas.style.left = `${box.x}px`;
            canvas.style.top = `${box.y}px`;
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '1';

            document.body.appendChild(canvas);

            const ctx = canvas.getContext('2d', { alpha: true });
            if (!ctx) {
                canvas.remove();
                continue;
            }

            ctx.scale(this.dpr, this.dpr);

            this.canvases.push(canvas);
            this.contexts.push(ctx);

            const manager = new ParticleManager(particleConfig, box.width, box.height);
            this.particleManagers.push(manager);
        }

        this.resizeObserver = new ResizeObserver((entries) => {
            if (this.revealed) return;

            for (const entry of entries) {
                const newWidth = entry.contentRect.width;
                const newHeight = entry.contentRect.height;

                if (newWidth !== this.lastKnownWidth || newHeight !== this.lastKnownHeight) {
                    this.lastKnownWidth = newWidth;
                    this.lastKnownHeight = newHeight;
                    this.handleSizeChange();
                }
            }
        });
        this.resizeObserver.observe(this.element);

        this.scrollHandler = () => {
            if (!this.revealed) {
                this.debouncedUpdateCanvasPositions();
            }
        };

        this.resizeHandler = () => {
            if (!this.revealed) {
                this.handleSizeChange();
            }
        };

        window.addEventListener('scroll', this.scrollHandler, { passive: true });
        window.addEventListener('resize', this.resizeHandler, { passive: true });

        if (this.config.monitorPosition) {
            this.startPositionMonitoring();
        }

        this.animate();
    }

    handleSizeChange() {
        if (this.setupDebounceTimer !== null) {
            clearTimeout(this.setupDebounceTimer);
        }
        this.setupDebounceTimer = setTimeout(() => {
            this.setupSpoiler();
            this.setupDebounceTimer = null;
        }, 50);
    }

    setupSpoiler() {
        this.cleanup();

        const computedStyle = window.getComputedStyle(this.element);
        this.textColor = computedStyle.color;

        const boundingBoxes = this.getTextBoundingBoxes();
        if (boundingBoxes.length === 0) return;

        const containerRect = this.element.getBoundingClientRect();
        this.lastKnownWidth = containerRect.width;
        this.lastKnownHeight = containerRect.height;

        const particleConfig = {
            scale: this.config.scale,
            minVelocity: this.config.minVelocity,
            maxVelocity: this.config.maxVelocity,
            particleLifetime: this.config.particleLifetime,
            density: this.config.density,
            textColor: this.textColor,
        };

        for (const box of boundingBoxes) {
            const canvas = document.createElement('canvas');
            canvas.width = box.width * this.dpr;
            canvas.height = box.height * this.dpr;
            canvas.style.width = `${box.width}px`;
            canvas.style.height = `${box.height}px`;
            canvas.style.position = 'absolute';
            canvas.style.left = `${box.x}px`;
            canvas.style.top = `${box.y}px`;
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '1';

            document.body.appendChild(canvas);

            const ctx = canvas.getContext('2d', { alpha: true });
            if (!ctx) {
                canvas.remove();
                continue;
            }

            ctx.scale(this.dpr, this.dpr);

            this.canvases.push(canvas);
            this.contexts.push(ctx);

            const manager = new ParticleManager(particleConfig, box.width, box.height);
            this.particleManagers.push(manager);
        }

        this.animate();
    }

    getTextBoundingBoxes() {
        const boxes = [];
        const children = Array.from(this.element.childNodes);
        const scrollX = window.scrollX ?? window.pageXOffset;
        const scrollY = window.scrollY ?? window.pageYOffset;

        for (const node of children) {
            if (node.nodeType === Node.TEXT_NODE) {
                const range = document.createRange();
                range.selectNodeContents(node);
                const rects = range.getClientRects();

                for (const rect of rects) {
                    if (rect.width > 0 && rect.height > 0) {
                        boxes.push({
                            x: rect.left + scrollX,
                            y: rect.top + scrollY,
                            width: rect.width,
                            height: rect.height,
                        });
                    }
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const rects = node.getClientRects();

                for (const rect of rects) {
                    if (rect.width > 0 && rect.height > 0) {
                        boxes.push({
                            x: rect.left + scrollX,
                            y: rect.top + scrollY,
                            width: rect.width,
                            height: rect.height,
                        });
                    }
                }
            }
        }

        return boxes;
    }

    updateCanvasPositions() {
        const children = Array.from(this.element.childNodes);
        const scrollX = window.scrollX ?? window.pageXOffset;
        const scrollY = window.scrollY ?? window.pageYOffset;
        let canvasIndex = 0;

        for (const node of children) {
            if (node.nodeType === Node.TEXT_NODE) {
                const range = document.createRange();
                range.selectNodeContents(node);
                const rects = range.getClientRects();

                for (const rect of rects) {
                    if (rect.width > 0 && rect.height > 0 && canvasIndex < this.canvases.length) {
                        const canvas = this.canvases[canvasIndex];
                        canvas.style.left = `${rect.left + scrollX}px`;
                        canvas.style.top = `${rect.top + scrollY}px`;
                        canvasIndex++;
                    }
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const rects = node.getClientRects();

                for (const rect of rects) {
                    if (rect.width > 0 && rect.height > 0 && canvasIndex < this.canvases.length) {
                        const canvas = this.canvases[canvasIndex];
                        canvas.style.left = `${rect.left + scrollX}px`;
                        canvas.style.top = `${rect.top + scrollY}px`;
                        canvasIndex++;
                    }
                }
            }
        }
    }

    debouncedUpdateCanvasPositions() {
        if (this.updateDebounceTimer !== null) {
            clearTimeout(this.updateDebounceTimer);
        }
        this.updateDebounceTimer = setTimeout(() => {
            this.updateCanvasPositions();
            this.updateDebounceTimer = null;
        }, 16);
    }

    updateCanvasPositionsImmediate() {
        const children = Array.from(this.element.childNodes);
        const scrollX = window.scrollX ?? window.pageXOffset;
        const scrollY = window.scrollY ?? window.pageYOffset;
        let canvasIndex = 0;

        for (const node of children) {
            if (node.nodeType === Node.TEXT_NODE) {
                const range = document.createRange();
                range.selectNodeContents(node);
                const rects = range.getClientRects();

                for (const rect of rects) {
                    if (rect.width > 0 && rect.height > 0 && canvasIndex < this.canvases.length) {
                        const canvas = this.canvases[canvasIndex];
                        const newLeft = rect.left + scrollX;
                        const newTop = rect.top + scrollY;
                        const currentLeft = parseFloat(canvas.style.left);
                        const currentTop = parseFloat(canvas.style.top);

                        if (Math.abs(newLeft - currentLeft) > 0.5 || Math.abs(newTop - currentTop) > 0.5) {
                            canvas.style.left = `${newLeft}px`;
                            canvas.style.top = `${newTop}px`;
                        }

                        canvasIndex++;
                    }
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const rects = node.getClientRects();

                for (const rect of rects) {
                    if (rect.width > 0 && rect.height > 0 && canvasIndex < this.canvases.length) {
                        const canvas = this.canvases[canvasIndex];
                        const newLeft = rect.left + scrollX;
                        const newTop = rect.top + scrollY;
                        const currentLeft = parseFloat(canvas.style.left);
                        const currentTop = parseFloat(canvas.style.top);

                        if (Math.abs(newLeft - currentLeft) > 0.5 || Math.abs(newTop - currentTop) > 0.5) {
                            canvas.style.left = `${newLeft}px`;
                            canvas.style.top = `${newTop}px`;
                        }

                        canvasIndex++;
                    }
                }
            }
        }
    }

    startPositionMonitoring() {
        if (this.isMonitoringPosition) return;
        this.isMonitoringPosition = true;
        this.monitorPositionLoop();
    }

    stopPositionMonitoring() {
        this.isMonitoringPosition = false;
        if (this.positionMonitorId !== null) {
            cancelAnimationFrame(this.positionMonitorId);
            this.positionMonitorId = null;
        }
    }

    monitorPositionLoop = () => {
        if (!this.isMonitoringPosition || this.revealed) {
            this.positionMonitorId = null;
            return;
        }

        this.updateCanvasPositionsImmediate();
        this.positionMonitorId = requestAnimationFrame(this.monitorPositionLoop);
    };

    animate = (currentTime = 0) => {
        if (this.revealed) return;

        const elapsed = currentTime - this.lastFrameTime;
        if (elapsed < this.frameInterval) {
            this.animationFrameId = requestAnimationFrame(this.animate);
            return;
        }

        this.lastFrameTime = currentTime - (elapsed % this.frameInterval);

        const allParticlesDead = this.particleManagers.every(manager => !manager.hasParticles());

        if (this.revealing && allParticlesDead) {
            this.revealed = true;
            this.stopPositionMonitoring();
            this.cleanup();
            this.canvases.forEach(canvas => canvas.remove());
            if (this.dotNetRef) {
                this.dotNetRef.invokeMethodAsync('OnRevealed');
            }
            return;
        }

        for (let i = 0; i < this.particleManagers.length; i++) {
            const manager = this.particleManagers[i];
            const ctx = this.contexts[i];
            const canvas = this.canvases[i];

            ctx.clearRect(0, 0, canvas.width / this.dpr, canvas.height / this.dpr);
            manager.update();
            manager.draw(ctx);
        }

        this.animationFrameId = requestAnimationFrame(this.animate);
    };

    reveal() {
        if (this.revealed || this.revealing) return;

        this.revealing = true;

        setTimeout(() => {
            this.particleManagers.forEach(manager => {
                manager.stopSpawning();
            });
        }, this.config.spawnStopDelay);
    }

    cleanup() {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    dispose() {
        this.revealed = true;
        this.stopPositionMonitoring();
        this.cleanup();

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        if (this.updateDebounceTimer !== null) {
            clearTimeout(this.updateDebounceTimer);
        }
        if (this.setupDebounceTimer !== null) {
            clearTimeout(this.setupDebounceTimer);
        }

        if (this.scrollHandler) {
            window.removeEventListener('scroll', this.scrollHandler);
        }
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }

        this.canvases.forEach(canvas => {
            if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        });

        this.canvases = [];
        this.contexts = [];
        this.particleManagers = [];
    }
}

const spoilerInstances = new Map();

export function initialize(element, dotNetRef, config) {
    const manager = new SpoilerManager(element, dotNetRef, config);
    spoilerInstances.set(element, manager);
    return manager.initialize();
}

export function reveal(element) {
    const manager = spoilerInstances.get(element);
    if (manager) {
        manager.reveal();
    }
}

export function dispose(element) {
    const manager = spoilerInstances.get(element);
    if (manager) {
        manager.dispose();
        spoilerInstances.delete(element);
    }
}
