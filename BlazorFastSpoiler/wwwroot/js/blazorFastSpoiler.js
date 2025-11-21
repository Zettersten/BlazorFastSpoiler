// BlazorFastSpoiler JavaScript Module - Optimized for performance
// Only handles canvas operations, all logic is in C#

const canvasMap = new Map();
const contextMap = new Map();

export function createCanvas(id, x, y, width, height) {
    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.position = 'absolute';
    canvas.style.left = `${x}px`;
    canvas.style.top = `${y}px`;
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1';
    
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d', { alpha: true });
    if (ctx) {
        ctx.scale(dpr, dpr);
        canvasMap.set(id, canvas);
        contextMap.set(id, ctx);
    }
}

export function drawParticles(id, particles, textColor) {
    const ctx = contextMap.get(id);
    const canvas = canvasMap.get(id);
    
    if (!ctx || !canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    
    // Draw particles
    ctx.fillStyle = textColor;
    for (const particle of particles) {
        ctx.globalAlpha = particle.alpha;
        ctx.fillRect(particle.x, particle.y, particle.width, particle.height);
    }
    ctx.globalAlpha = 1.0;
}

export function getTextColor(element) {
    try {
        const computedStyle = window.getComputedStyle(element);
        return computedStyle.color || '#000000';
    } catch {
        return '#000000';
    }
}

export function getBoundingBoxes(element) {
    const boxes = {};
    const children = Array.from(element.childNodes);
    const scrollX = window.scrollX ?? window.pageXOffset;
    const scrollY = window.scrollY ?? window.pageYOffset;
    let index = 0;

    for (const node of children) {
        if (node.nodeType === Node.TEXT_NODE) {
            const range = document.createRange();
            range.selectNodeContents(node);
            const rects = range.getClientRects();

            for (const rect of rects) {
                if (rect.width > 0 && rect.height > 0) {
                    boxes[`box_${index}`] = {
                        x: rect.left + scrollX,
                        y: rect.top + scrollY,
                        width: rect.width,
                        height: rect.height
                    };
                    index++;
                }
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const rects = node.getClientRects();

            for (const rect of rects) {
                if (rect.width > 0 && rect.height > 0) {
                    boxes[`box_${index}`] = {
                        x: rect.left + scrollX,
                        y: rect.top + scrollY,
                        width: rect.width,
                        height: rect.height
                    };
                    index++;
                }
            }
        }
    }

    return boxes;
}

export function updateCanvasPosition(id, x, y) {
    const canvas = canvasMap.get(id);
    if (canvas) {
        canvas.style.left = `${x}px`;
        canvas.style.top = `${y}px`;
    }
}

export function dispose() {
    for (const canvas of canvasMap.values()) {
        if (canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
    }
    canvasMap.clear();
    contextMap.clear();
}
