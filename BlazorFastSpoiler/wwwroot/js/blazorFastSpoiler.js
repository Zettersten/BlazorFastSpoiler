// BlazorFastSpoiler JavaScript Module - Optimized for performance
// Only handles canvas operations, all logic is in C#

const canvasMap = new Map();
const contextMap = new Map();
const elementRefMap = new Map(); // Map canvas IDs to element references for position updates
const elementCanvasIdsMap = new Map(); // Map elementRef to set of canvas IDs for cleanup

// Debug mode - set to true to enable verbose logging in browser console
const DEBUG = false;
const log = (...args) => DEBUG && console.log('[BlazorFastSpoiler]', ...args);
const warn = (...args) => DEBUG && console.warn('[BlazorFastSpoiler]', ...args);
const error = (...args) => console.error('[BlazorFastSpoiler]', ...args);

export function createCanvas(id, x, y, width, height, elementRef) {
    log('createCanvas called:', { id, x, y, width, height, elementRef });
    log('createCanvas: elementRef type:', typeof elementRef, 'constructor:', elementRef?.constructor?.name);
    
    if (!elementRef) {
        warn('createCanvas: elementRef is null/undefined');
        return;
    }
    
    // Check if elementRef is a valid DOM element
    if (!(elementRef instanceof Element)) {
        warn('createCanvas: elementRef is not a DOM Element!', { 
            type: typeof elementRef, 
            constructor: elementRef?.constructor?.name,
            keys: Object.keys(elementRef || {})
        });
        return;
    }
    
    if (width <= 0 || height <= 0) {
        warn('createCanvas: Invalid dimensions', { width, height });
        return;
    }
    
    // Ensure element is in DOM
    if (!elementRef.isConnected) {
        warn('createCanvas: Element not in DOM when creating canvas');
        return;
    }
    
    log('createCanvas: Element validated. TagName:', elementRef.tagName, 'className:', elementRef.className);
    
    log('createCanvas: Creating canvas element');
    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    log('createCanvas: Device pixel ratio:', dpr);
    
    // Ensure minimum canvas size
    const canvasWidth = Math.max(1, Math.ceil(width * dpr));
    const canvasHeight = Math.max(1, Math.ceil(height * dpr));
    
    log('createCanvas: Canvas internal size:', { canvasWidth, canvasHeight });
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.position = 'absolute';
    canvas.style.left = `${x}px`; // x and y are already relative to container
    canvas.style.top = `${y}px`;
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999'; // Very high z-index to ensure particles are above text
    canvas.style.mixBlendMode = 'normal'; // Ensure particles render correctly
    canvas.style.display = 'block'; // Ensure canvas is displayed
    canvas.setAttribute('data-canvas-id', id);
    
    // Append to container element, not body
    elementRef.appendChild(canvas);
    log('createCanvas: Canvas appended to container');
    
    const ctx = canvas.getContext('2d', { alpha: true });
    if (ctx) {
        ctx.scale(dpr, dpr);
        canvasMap.set(id, canvas);
        contextMap.set(id, ctx);
        log('createCanvas: Context created and stored. Total canvases:', canvasMap.size);
        if (elementRef) {
            elementRefMap.set(id, elementRef);
            // Track which canvases belong to this element
            if (!elementCanvasIdsMap.has(elementRef)) {
                elementCanvasIdsMap.set(elementRef, new Set());
            }
            elementCanvasIdsMap.get(elementRef).add(id);
        }
        
        // DEBUG: Draw initial test pattern to verify canvas is visible
        // This will be immediately overwritten by the first drawParticles call
        if (DEBUG) {
            const displayWidth = width;
            const displayHeight = height;
            log('createCanvas: Drawing initial test fill. Canvas display size:', { displayWidth, displayHeight });
            
            // Draw a noticeable pattern - gray background with white dots
            ctx.fillStyle = 'rgba(100, 100, 100, 0.9)'; // Gray background
            ctx.fillRect(0, 0, displayWidth, displayHeight);
            
            // Draw some particle-like shapes to simulate what particles should look like
            ctx.fillStyle = 'rgba(255, 255, 255, 1)'; // White particles
            for (let i = 0; i < 20; i++) {
                const px = Math.random() * displayWidth;
                const py = Math.random() * displayHeight;
                const psize = 1 + Math.random() * 2;
                ctx.fillRect(px, py, psize, psize);
            }
            
            log('createCanvas: Test pattern drawn. If you see gray box with white dots, canvas is working!');
            log('createCanvas: This pattern will be replaced by actual particles shortly.');
        }
    } else {
        error('createCanvas: Failed to get 2D context!');
    }
}

// Track draw calls for logging
let drawCallCount = 0;
let lastLogTime = 0;
let firstDrawDone = {};

export function drawParticles(id, particles, textColor) {
    drawCallCount++;
    const now = Date.now();
    const isFirstDraw = !firstDrawDone[id];
    
    // Log every 2 seconds or on first draw
    if (isFirstDraw || now - lastLogTime > 2000) {
        log('drawParticles: Stats - calls since last log:', drawCallCount, 'canvasMap size:', canvasMap.size, 'contextMap size:', contextMap.size);
        if (!isFirstDraw) {
            drawCallCount = 0;
            lastLogTime = now;
        }
    }
    
    const ctx = contextMap.get(id);
    const canvas = canvasMap.get(id);
    
    if (!ctx) {
        warn('drawParticles: No context for id:', id, 'Available IDs:', Array.from(contextMap.keys()));
        return;
    }
    
    if (!canvas) {
        warn('drawParticles: No canvas for id:', id);
        return;
    }
    
    // Ensure canvas is visible
    if (canvas.style.display === 'none') {
        canvas.style.display = 'block';
    }
    
    // Verify canvas is in DOM
    if (!canvas.isConnected) {
        error('drawParticles: Canvas not in DOM!', id);
        return;
    }
    
    const dpr = window.devicePixelRatio || 1;
    
    // Validate particles data
    if (!particles) {
        warn('drawParticles: particles is null/undefined');
        return;
    }
    
    if (!Array.isArray(particles)) {
        warn('drawParticles: particles is not an array, type:', typeof particles);
        // Try to handle if it's an object with length
        if (typeof particles === 'object' && particles.length !== undefined) {
            particles = Array.from(particles);
        } else {
            return;
        }
    }
    
    // On first draw, log detailed info
    if (isFirstDraw) {
        firstDrawDone[id] = true;
        log('drawParticles: FIRST DRAW for', id);
        log('drawParticles: Particles count:', particles.length);
        log('drawParticles: textColor:', textColor);
        log('drawParticles: Canvas:', {
            width: canvas.width,
            height: canvas.height,
            styleWidth: canvas.style.width,
            styleHeight: canvas.style.height,
            left: canvas.style.left,
            top: canvas.style.top,
            dpr,
            isConnected: canvas.isConnected,
            parentNode: canvas.parentNode?.tagName
        });
        
        if (particles.length > 0) {
            const p = particles[0];
            log('drawParticles: First particle raw:', p);
            log('drawParticles: First particle values:', {
                x: p?.x,
                y: p?.y,
                width: p?.width,
                height: p?.height,
                alpha: p?.alpha
            });
        }
        
        // Check color validity
        log('drawParticles: Testing fillStyle with color:', textColor);
    }
    
    // Clear canvas with transparent background
    const clearWidth = canvas.width / dpr;
    const clearHeight = canvas.height / dpr;
    ctx.clearRect(0, 0, clearWidth, clearHeight);
    
    // DEBUG: Draw corner indicators on every frame to prove canvas is rendering
    if (DEBUG) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)'; // Green indicator
        ctx.fillRect(0, 0, 2, 2); // Top-left corner marker
        ctx.fillRect(clearWidth - 2, 0, 2, 2); // Top-right corner marker
        ctx.fillRect(0, clearHeight - 2, 2, 2); // Bottom-left corner marker
        ctx.fillRect(clearWidth - 2, clearHeight - 2, 2, 2); // Bottom-right corner marker
        ctx.restore();
        if (isFirstDraw) {
            log('drawParticles: DEBUG corner markers drawn (will persist on every frame)');
        }
    }
    
    // Validate and set fill color
    let fillColor = textColor || '#ffffff'; // Default to white for dark themes
    
    // Check if color is transparent/invalid
    if (!fillColor || 
        fillColor === 'transparent' || 
        fillColor === 'rgba(0, 0, 0, 0)' ||
        (fillColor.includes('rgba') && fillColor.endsWith(', 0)'))) {
        warn('drawParticles: Invalid/transparent color, using white fallback');
        fillColor = '#ffffff';
    }
    
    ctx.fillStyle = fillColor;
    
    let drawnCount = 0;
    let skippedCount = 0;
    
    for (const particle of particles) {
        // Get values with fallbacks
        const x = particle?.x ?? particle?.X ?? 0;
        const y = particle?.y ?? particle?.Y ?? 0;
        const width = particle?.width ?? particle?.Width ?? 0;
        const height = particle?.height ?? particle?.Height ?? 0;
        const alpha = particle?.alpha ?? particle?.Alpha ?? 0;
        
        if (alpha > 0 && width > 0 && height > 0) {
            ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
            ctx.fillRect(
                Math.round(x), 
                Math.round(y), 
                Math.max(1, Math.ceil(width)), 
                Math.max(1, Math.ceil(height))
            );
            drawnCount++;
        } else {
            skippedCount++;
        }
    }
    ctx.globalAlpha = 1.0;
    
    // Log on first draw or if something is wrong
    if (isFirstDraw || (drawnCount === 0 && particles.length > 0)) {
        log('drawParticles: Drew', drawnCount, 'skipped', skippedCount, 'of', particles.length, 'particles');
        if (drawnCount === 0 && particles.length > 0) {
            warn('drawParticles: 0 particles drawn! First particle:', particles[0]);
        }
    }
}

export function getTextColor(element) {
    try {
        // The element has 'color: transparent' when hidden, so we need to get color from parent
        // or calculate what the color WOULD be without the transparent override
        let targetElement = element.parentElement || element;
        let computedStyle = window.getComputedStyle(targetElement);
        let color = computedStyle.color;
        
        log('getTextColor: Initial color from parent:', color);
        
        // Check if color is transparent or nearly transparent
        const isTransparent = !color || 
            color === 'transparent' || 
            color === 'rgba(0, 0, 0, 0)' ||
            color.includes('rgba') && color.endsWith(', 0)');
        
        if (isTransparent) {
            // Try walking up the DOM tree to find a non-transparent color
            let parent = targetElement.parentElement;
            while (parent && parent !== document.body) {
                computedStyle = window.getComputedStyle(parent);
                color = computedStyle.color;
                log('getTextColor: Checking parent color:', color, 'for element:', parent.tagName);
                
                const parentIsTransparent = !color || 
                    color === 'transparent' || 
                    color === 'rgba(0, 0, 0, 0)' ||
                    color.includes('rgba') && color.endsWith(', 0)');
                    
                if (!parentIsTransparent) {
                    log('getTextColor: Found non-transparent color:', color);
                    break;
                }
                parent = parent.parentElement;
            }
        }
        
        // If still no color, check for CSS custom properties or fallback
        if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
            // Try to get body color as ultimate fallback
            const bodyStyle = window.getComputedStyle(document.body);
            color = bodyStyle.color || '#000000';
            log('getTextColor: Using body color fallback:', color);
        }
        
        log('getTextColor: Final color:', color, 'for element:', element);
        return color || '#000000';
    } catch (e) {
        error('getTextColor: Error:', e);
        return '#000000';
    }
}

export function getBoundingBoxes(element) {
    log('getBoundingBoxes: Called with element:', element);
    const boxes = {};
    
    if (!element) {
        warn('getBoundingBoxes: Element is null/undefined');
        return boxes;
    }
    
    const slotNodes = Array.from(element.childNodes);
    log('getBoundingBoxes: Found', slotNodes.length, 'child nodes');
    
    const containerRect = element.getBoundingClientRect();
    log('getBoundingBoxes: Container rect:', containerRect);
    
    const scrollX = window.scrollX ?? window.pageXOffset;
    const scrollY = window.scrollY ?? window.pageYOffset;
    let index = 0;

    const range = document.createRange();

    for (const node of slotNodes) {
        // Skip canvas elements
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'CANVAS') {
            log('getBoundingBoxes: Skipping canvas element');
            continue;
        }
        
        if (node.nodeType === Node.TEXT_NODE) {
            log('getBoundingBoxes: Processing text node:', node.textContent?.substring(0, 20));
            range.selectNodeContents(node);
            const rects = range.getClientRects();
            log('getBoundingBoxes: Text node has', rects.length, 'rects');

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
                    log('getBoundingBoxes: Added box_' + index, boxes[`box_${index}`]);
                    index++;
                }
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            log('getBoundingBoxes: Processing element node:', node.tagName);
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
                    log('getBoundingBoxes: Added box_' + index, boxes[`box_${index}`]);
                    index++;
                }
            }
        }
    }

    log('getBoundingBoxes: Returning', Object.keys(boxes).length, 'boxes:', boxes);
    return boxes;
}

// Debug function to test canvas drawing
export function testCanvasDrawing(id) {
    log('testCanvasDrawing: Testing canvas', id);
    const ctx = contextMap.get(id);
    const canvas = canvasMap.get(id);
    
    if (!ctx || !canvas) {
        error('testCanvasDrawing: Canvas or context not found for id:', id);
        return false;
    }
    
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    
    log('testCanvasDrawing: Drawing test pattern on canvas', { width, height, dpr });
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // Draw a red rectangle
    ctx.fillStyle = 'red';
    ctx.globalAlpha = 1.0;
    ctx.fillRect(0, 0, width, height);
    
    // Draw a blue circle in the center
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(width/2, height/2, Math.min(width, height)/4, 0, Math.PI * 2);
    ctx.fill();
    
    log('testCanvasDrawing: Test pattern drawn successfully');
    return true;
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
    if (!elementRef || !dotNetRef) {
        warn('setupScrollResizeHandlers: Missing elementRef or dotNetRef');
        return;
    }
    
    log('setupScrollResizeHandlers: Setting up handlers for element:', elementRef);

    let updateDebounceTimer = null;
    
    // Initialize with current dimensions to prevent immediate resize callback
    const initialRect = elementRef.getBoundingClientRect();
    let lastKnownWidth = initialRect.width;
    let lastKnownHeight = initialRect.height;
    log('setupScrollResizeHandlers: Initial dimensions:', { lastKnownWidth, lastKnownHeight });

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
    if (!elementRef || !dotNetRef) {
        warn('setupPositionMonitoring: Missing elementRef or dotNetRef');
        return;
    }
    
    log('setupPositionMonitoring: Setting up monitoring for element:', elementRef);

    let updateDebounceTimer = null;
    let setupDebounceTimer = null;
    
    // Initialize with current dimensions to prevent immediate resize callback
    const initialRect = elementRef.getBoundingClientRect();
    let lastKnownWidth = initialRect.width;
    let lastKnownHeight = initialRect.height;
    log('setupPositionMonitoring: Initial dimensions:', { lastKnownWidth, lastKnownHeight });

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
            if (canvas) {
                // Check if canvas is still in DOM before removing
                if (canvas.parentNode) {
                    try {
                        canvas.parentNode.removeChild(canvas);
                    } catch (e) {
                        // Canvas may have already been removed, ignore
                    }
                }
            }
            canvasMap.delete(id);
            contextMap.delete(id);
            elementRefMap.delete(id);
        }
        elementCanvasIdsMap.delete(elementRef);
    }
}
