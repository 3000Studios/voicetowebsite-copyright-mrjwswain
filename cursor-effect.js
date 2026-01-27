/**
 * LuminousRibbon Cursor Effect
 * purely custom implementation using HTML5 Canvas
 */
export class LuminousRibbon {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        
        this.options = Object.assign({
            colors: ["#00f0ff", "#ff00aa", "#ffcc00"], // Cyberpunk defaults
            trailLength: 40,
            lineWidth: 8,
            friction: 0.5,
            tension: 0.5,
            glow: 15
        }, options);

        this.points = [];
        this.mouse = { x: 0, y: 0 };
        this.isActive = false;

        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });

        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    handleMouseMove(e) {
        this.isActive = true;
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }

    handleTouchMove(e) {
        this.isActive = true;
        e.preventDefault();
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
    }

    update() {
        // Add new point at mouse position
        // If no points, add current mouse
        if (this.points.length === 0 && this.isActive) {
            this.points.push({ x: this.mouse.x, y: this.mouse.y });
        }

        // Ease the head towards the mouse (lag effect)
        if (this.isActive) {
            const head = { x: this.mouse.x, y: this.mouse.y };
            this.points.push(head);
        }

        // Limit trail length
        if (this.points.length > this.options.trailLength) {
            this.points.shift();
        }

        // If inactive (mouse stopped or left), we could let it fade, 
        // but for now we just keep the last points which will naturally converge if we had physics.
        // For a simple ribbon, just removing points when they are too close or old works too.
        // Let's degrade the trail if mouse isn't moving roughly:
        // (Simplified for this version: just keep trail fixed length logic)
    }

    getGradient(ctx, points) {
        if (points.length < 2) return this.options.colors[0];
        
        // Create gradient along the path
        // Simplified: linear gradient from start to end of screen or just cycle colors
        // Better: Gradient that follows the line is hard in standard Canvas 2D without segmentation.
        // We will draw segments or use a screen-space gradient.
        
        const gradient = ctx.createLinearGradient(
            points[0].x, points[0].y, 
            points[points.length-1].x, points[points.length-1].y
        );
        
        this.options.colors.forEach((color, index) => {
            const stop = index / (this.options.colors.length - 1);
            gradient.addColorStop(stop, color);
        });

        return gradient;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.points.length < 2) return;

        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.lineWidth = this.options.lineWidth;
        this.ctx.shadowBlur = this.options.glow;
        
        // Dynamic shadow color picking
        this.ctx.shadowColor = this.options.colors[0];

        this.ctx.beginPath();
        
        // Smooth curve through points
        // Move to first point
        this.ctx.moveTo(this.points[0].x, this.points[0].y);

        for (let i = 1; i < this.points.length - 1; i++) {
            const pCurrent = this.points[i];
            const pNext = this.points[i + 1];
            
            // Quadratic Bezier control points
            const cx = (pCurrent.x + pNext.x) / 2;
            const cy = (pCurrent.y + pNext.y) / 2;
            
            this.ctx.quadraticCurveTo(pCurrent.x, pCurrent.y, cx, cy);
        }

        // Connect the last point
        const last = this.points[this.points.length - 1];
        this.ctx.lineTo(last.x, last.y);

        // Apply gradient stroke
        this.ctx.strokeStyle = this.getGradient(this.ctx, this.points);
        this.ctx.stroke();
    }

    animate() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.animate());
    }

    // API to change colors dynamically like the user asked
    setColors(newColors) {
        this.options.colors = newColors;
    }
}
