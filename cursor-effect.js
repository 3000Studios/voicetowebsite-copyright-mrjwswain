/**
 * LuminousRibbon Cursor Effect
 * purely custom implementation using HTML5 Canvas
 */
export class LuminousRibbon {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");

    this.options = Object.assign(
      {
        colors: ["#00f0ff", "#ff00aa", "#ffcc00"], // Cyberpunk defaults
        trailLength: 40,
        lineWidth: 8,
        friction: 0.5,
        tension: 0.5,
        glow: 15,
      },
      options
    );

    this.points = [];
    this.mouse = { x: 0, y: 0 };
    this.isActive = false;

    this.resize();
    window.addEventListener("resize", () => this.resize());

    document.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    document.addEventListener("touchmove", (e) => this.handleTouchMove(e), { passive: false });

    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  handleMouseMove(e) {
    if (!this.isActive) {
      this.isActive = true;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      // Initialize points at current mouse position to avoid "flying in"
      this.points = Array(this.options.trailLength)
        .fill(0)
        .map(() => ({ x: this.mouse.x, y: this.mouse.y }));
    } else {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    }
  }

  handleTouchMove(e) {
    e.preventDefault();
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;

    if (!this.isActive) {
      this.isActive = true;
      this.mouse.x = x;
      this.mouse.y = y;
      this.points = Array(this.options.trailLength)
        .fill(0)
        .map(() => ({ x, y }));
    } else {
      this.mouse.x = x;
      this.mouse.y = y;
    }
  }

  update() {
    if (!this.isActive || this.points.length === 0) return;

    // Physics: Follow the leader
    // 1. Head (points[0]) follows the mouse with friction/easing
    const head = this.points[0];
    head.x += (this.mouse.x - head.x) * this.options.friction;
    head.y += (this.mouse.y - head.y) * this.options.friction;

    // 2. Body segments follow the previous point with tension
    for (let i = 1; i < this.points.length; i++) {
      const leader = this.points[i - 1];
      const follower = this.points[i];

      follower.x += (leader.x - follower.x) * this.options.tension;
      follower.y += (leader.y - follower.y) * this.options.tension;
    }
  }

  getGradient(ctx, points) {
    if (points.length < 2) return this.options.colors[0];

    // Create gradient from head to tail
    const gradient = ctx.createLinearGradient(
      points[0].x,
      points[0].y,
      points[points.length - 1].x,
      points[points.length - 1].y
    );

    const len = this.options.colors.length;
    this.options.colors.forEach((color, index) => {
      // Squeeze colors into 0.0 -> 0.85 to leave room for fade out
      const stop = (index / (len - 1)) * 0.85;
      gradient.addColorStop(stop, color);
    });

    // Add transparent tail
    const lastColor = this.options.colors[len - 1];
    gradient.addColorStop(1, fadeColor(lastColor, 0));

    return gradient;
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.points.length < 2) return;

    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
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

// Helper to convert color to transparent version
function fadeColor(color, alpha) {
  color = color.trim();

  if (color.startsWith("#")) {
    const cleanHex = color.replace("#", "");
    let r, g, b;

    if (cleanHex.length === 3) {
      r = parseInt(cleanHex[0] + cleanHex[0], 16);
      g = parseInt(cleanHex[1] + cleanHex[1], 16);
      b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else {
      r = parseInt(cleanHex.substring(0, 2), 16);
      g = parseInt(cleanHex.substring(2, 4), 16);
      b = parseInt(cleanHex.substring(4, 6), 16);
    }

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  if (color.startsWith("hsl")) {
    if (color.startsWith("hsla")) {
      // Replace alpha value
      return color.replace(/[\d.]+\)$/, `${alpha})`);
    }
    // Convert hsl to hsla
    return color.replace("hsl", "hsla").replace(")", `, ${alpha})`);
  }

  if (color.startsWith("rgb")) {
    if (color.startsWith("rgba")) {
      return color.replace(/[\d.]+\)$/, `${alpha})`);
    }
    return color.replace("rgb", "rgba").replace(")", `, ${alpha})`);
  }

  return color;
}
