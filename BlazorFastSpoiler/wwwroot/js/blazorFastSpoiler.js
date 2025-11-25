// BlazorFastSpoiler JavaScript Module - Optimized for performance
// Only handles canvas operations, all logic is in C#

const canvasMap = new Map();
const contextMap = new Map();
const elementRefMap = new Map(); // Map canvas IDs to element references for position updates
const elementCanvasIdsMap = new Map(); // Map elementRef to set of canvas IDs for cleanup

export function createCanvas(id, x, y, width, height, elementRef) {
    if (!elementRef || width <= 0 || height <= 0) return;
    
    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    
    // Ensure minimum canvas size
    const canvasWidth = Math.max(1, width * dpr);
    const canvasHeight = Math.max(1, height * dpr);
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.position = 'absolute';
    canvas.style.left = `${x}px`; // x and y are already relative to container
    canvas.style.top = `${y}px`;
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1';
    canvas.setAttribute('data-canvas-id', id);
    
    // Append to container element, not body
    elementRef.appendChild(canvas);
    
    const ctx = canvas.getContext('2d', { alpha: true });
    if (ctx) {
        ctx.scale(dpr, dpr);
        canvasMap.set(id, canvas);
        contextMap.set(id, ctx);
        if (elementRef) {
            elementRefMap.set(id, elementRef);
            // Track which canvases belong to this element
            if (!elementCanvasIdsMap.has(elementRef)) {
                elementCanvasIdsMap.set(elementRef, new Set());
            }
            elementCanvasIdsMap.get(elementRef).add(id);
        }
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
        if (particle.alpha > 0) {
            ctx.globalAlpha = particle.alpha;
            ctx.fillRect(
                Math.round(particle.x), 
                Math.round(particle.y), 
                Math.ceil(particle.width), 
                Math.ceil(particle.height)
            );
        }
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
    const slotNodes = Array.from(element.childNodes);
    const containerRect = element.getBoundingClientRect();
    const scrollX = window.scrollX ?? window.pageXOffset;
    const scrollY = window.scrollY ?? window.pageYOffset;
    let index = 0;

    const range = document.createRange();

    for (const node of slotNodes) {
        // Skip canvas elements
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'CANVAS') {
            continue;
        }
        
        if (node.nodeType === Node.TEXT_NODE) {
            range.selectNodeContents(node);
            const rects = range.getClientRects();

            for (let i = 0; i < rects.length; i++) {
                const rect = rects[i];
                if (rect.width > 0 && rect.height > 0) {
                    // Calculate position relative to container
                    const relativeX = rect.left - containerRect.left;
                    const relativeY = rect.top - containerRect.top;
                    
                    boxes[`box_${index}`] = {
                        x: relativeX,
                        y: relativeY,
                        width: rect.width,
                        height: rect.height
                    };
                    index++;
                }
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const rects = node.getClientRects();

            for (let i = 0; i < rects.length; i++) {
                const rect = rects[i];
                if (rect.width > 0 && rect.height > 0) {
                    // Calculate position relative to container
                    const relativeX = rect.left - containerRect.left;
                    const relativeY = rect.top - containerRect.top;
                    
                    boxes[`box_${index}`] = {
                        x: relativeX,
                        y: relativeY,
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
    const elementRef = elementRefMap.get(id);
    if (canvas && elementRef) {
        // Position is already relative to container, so use directly
        canvas.style.left = `${x}px`;
        canvas.style.top = `${y}px`;
    }
}

export function setupScrollResizeHandlers(elementRef, dotNetRef) {
    if (!elementRef || !dotNetRef) return;

    let updateDebounceTimer = null;
    let lastKnownWidth = 0;
    let lastKnownHeight = 0;

    const updateCanvasPositions = () => {
        const containerRect = elementRef.getBoundingClientRect();
        let canvasIndex = 0;

        const range = document.createRange();
        const slotNodes = Array.from(elementRef.childNodes);

        for (const node of slotNodes) {
            // Skip canvas elements
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'CANVAS') {
                continue;
            }
            
            if (node.nodeType === Node.TEXT_NODE) {
                range.selectNodeContents(node);
                const rects = range.getClientRects();

                for (let i = 0; i < rects.length; i++) {
                    const rect = rects[i];
                    if (rect.width > 0 && rect.height > 0) {
                        const id = `box_${canvasIndex}`;
                        const canvas = canvasMap.get(id);
                        if (canvas) {
                            // Calculate relative position
                            const newLeft = rect.left - containerRect.left;
                            const newTop = rect.top - containerRect.top;
                            const currentLeft = parseFloat(canvas.style.left) || 0;
                            const currentTop = parseFloat(canvas.style.top) || 0;

                            if (Math.abs(newLeft - currentLeft) > 0.5 || Math.abs(newTop - currentTop) > 0.5) {
                                canvas.style.left = `${newLeft}px`;
                                canvas.style.top = `${newTop}px`;
                            }
                        }
                        canvasIndex++;
                    }
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const rects = node.getClientRects();

                for (let i = 0; i < rects.length; i++) {
                    const rect = rects[i];
                    if (rect.width > 0 && rect.height > 0) {
                        const id = `box_${canvasIndex}`;
                        const canvas = canvasMap.get(id);
                        if (canvas) {
                            // Calculate relative position
                            const newLeft = rect.left - containerRect.left;
                            const newTop = rect.top - containerRect.top;
                            const currentLeft = parseFloat(canvas.style.left) || 0;
                            const currentTop = parseFloat(canvas.style.top) || 0;

                            if (Math.abs(newLeft - currentLeft) > 0.5 || Math.abs(newTop - currentTop) > 0.5) {
                                canvas.style.left = `${newLeft}px`;
                                canvas.style.top = `${newTop}px`;
                            }
                        }
                        canvasIndex++;
                    }
                }
            }
        }
    };

    const debouncedUpdateCanvasPositions = () => {
        if (updateDebounceTimer !== null) {
            clearTimeout(updateDebounceTimer);
        }
        updateDebounceTimer = setTimeout(() => {
            updateCanvasPositions();
            updateDebounceTimer = null;
        }, 16); // ~60fps for smooth scrolling
    };

    const handleSizeChange = () => {
        const containerRect = elementRef.getBoundingClientRect();
        const newWidth = containerRect.width;
        const newHeight = containerRect.height;

        if (newWidth !== lastKnownWidth || newHeight !== lastKnownHeight) {
            lastKnownWidth = newWidth;
            lastKnownHeight = newHeight;
            // Notify C# to regenerate particles
            dotNetRef.invokeMethodAsync('HandleSizeChange');
        }
    };

    const scrollHandler = () => {
        debouncedUpdateCanvasPositions();
    };

    const resizeHandler = () => {
        handleSizeChange();
    };

    // ResizeObserver for container size changes
    const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            const newWidth = entry.contentRect.width;
            const newHeight = entry.contentRect.height;

            if (newWidth !== lastKnownWidth || newHeight !== lastKnownHeight) {
                lastKnownWidth = newWidth;
                lastKnownHeight = newHeight;
                handleSizeChange();
            }
        }
    });

    resizeObserver.observe(elementRef);
    window.addEventListener('scroll', scrollHandler, { passive: true });
    window.addEventListener('resize', resizeHandler, { passive: true });

    // Store cleanup function for later disposal
    const cleanup = () => {
        resizeObserver.disconnect();
        window.removeEventListener('scroll', scrollHandler);
        window.removeEventListener('resize', resizeHandler);
        if (updateDebounceTimer !== null) {
            clearTimeout(updateDebounceTimer);
        }
    };

    // Store cleanup in a map for later disposal
    if (!window._blazorFastSpoilerCleanups) {
        window._blazorFastSpoilerCleanups = new Map();
    }
    window._blazorFastSpoilerCleanups.set(elementRef, cleanup);
}

export function setupPositionMonitoring(elementRef, dotNetRef) {
    if (!elementRef || !dotNetRef) return;

    let updateDebounceTimer = null;
    let setupDebounceTimer = null;
    let lastKnownWidth = 0;
    let lastKnownHeight = 0;

    const updateCanvasPositions = () => {
        const containerRect = elementRef.getBoundingClientRect();
        let canvasIndex = 0;

        const range = document.createRange();
        const slotNodes = Array.from(elementRef.childNodes);

        for (const node of slotNodes) {
            // Skip canvas elements
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'CANVAS') {
                continue;
            }
            
            if (node.nodeType === Node.TEXT_NODE) {
                range.selectNodeContents(node);
                const rects = range.getClientRects();

                for (let i = 0; i < rects.length; i++) {
                    const rect = rects[i];
                    if (rect.width > 0 && rect.height > 0) {
                        const id = `box_${canvasIndex}`;
                        const canvas = canvasMap.get(id);
                        if (canvas) {
                            // Calculate relative position
                            const newLeft = rect.left - containerRect.left;
                            const newTop = rect.top - containerRect.top;
                            canvas.style.left = `${newLeft}px`;
                            canvas.style.top = `${newTop}px`;
                        }
                        canvasIndex++;
                    }
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const rects = node.getClientRects();

                for (let i = 0; i < rects.length; i++) {
                    const rect = rects[i];
                    if (rect.width > 0 && rect.height > 0) {
                        const id = `box_${canvasIndex}`;
                        const canvas = canvasMap.get(id);
                        if (canvas) {
                            // Calculate relative position
                            const newLeft = rect.left - containerRect.left;
                            const newTop = rect.top - containerRect.top;
                            canvas.style.left = `${newLeft}px`;
                            canvas.style.top = `${newTop}px`;
                        }
                        canvasIndex++;
                    }
                }
            }
        }
    };

    const debouncedUpdateCanvasPositions = () => {
        if (updateDebounceTimer !== null) {
            clearTimeout(updateDebounceTimer);
        }
        updateDebounceTimer = setTimeout(() => {
            updateCanvasPositions();
            updateDebounceTimer = null;
        }, 16); // ~60fps for smooth scrolling
    };

    const handleSizeChange = () => {
        if (setupDebounceTimer !== null) {
            clearTimeout(setupDebounceTimer);
        }
        setupDebounceTimer = setTimeout(() => {
            const containerRect = elementRef.getBoundingClientRect();
            const newWidth = containerRect.width;
            const newHeight = containerRect.height;

            if (newWidth !== lastKnownWidth || newHeight !== lastKnownHeight) {
                lastKnownWidth = newWidth;
                lastKnownHeight = newHeight;
                // Notify C# to regenerate particles
                dotNetRef.invokeMethodAsync('HandleSizeChange');
            }
            setupDebounceTimer = null;
        }, 50);
    };

    const scrollHandler = () => {
        debouncedUpdateCanvasPositions();
    };

    const resizeHandler = () => {
        handleSizeChange();
    };

    // ResizeObserver for container size changes
    const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            const newWidth = entry.contentRect.width;
            const newHeight = entry.contentRect.height;

            if (newWidth !== lastKnownWidth || newHeight !== lastKnownHeight) {
                lastKnownWidth = newWidth;
                lastKnownHeight = newHeight;
                handleSizeChange();
            }
        }
    });

    resizeObserver.observe(elementRef);
    window.addEventListener('scroll', scrollHandler, { passive: true });
    window.addEventListener('resize', resizeHandler, { passive: true });

    // Return cleanup function
    return () => {
        resizeObserver.disconnect();
        window.removeEventListener('scroll', scrollHandler);
        window.removeEventListener('resize', resizeHandler);
        if (updateDebounceTimer !== null) {
            clearTimeout(updateDebounceTimer);
        }
        if (setupDebounceTimer !== null) {
            clearTimeout(setupDebounceTimer);
        }
    };
}

export function dispose(elementRef) {
    if (!elementRef) return;

    // Clean up scroll/resize handlers if they exist
    if (window._blazorFastSpoilerCleanups) {
        const cleanup = window._blazorFastSpoilerCleanups.get(elementRef);
        if (cleanup) {
            cleanup();
            window._blazorFastSpoilerCleanups.delete(elementRef);
        }
    }

    // Remove only canvases for this component
    const canvasIds = elementCanvasIdsMap.get(elementRef);
    if (canvasIds) {
        for (const id of canvasIds) {
            const canvas = canvasMap.get(id);
            if (canvas && canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
            canvasMap.delete(id);
            contextMap.delete(id);
            elementRefMap.delete(id);
        }
        elementCanvasIdsMap.delete(elementRef);
    }
}
