// =========================================================================
// CINEMATIC SCROLL ANIMATION - BHARATFARM
// Built with GSAP & ScrollTrigger using HTML5 Canvas for peak performance
// =========================================================================

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initial Setup
    const canvas = document.getElementById("hero-lightpass");
    const context = canvas.getContext("2d");
    const frameCount = 240; // Total frames inside Landing_Page
    const images = [];
    
    // UI Elements
    const loader = document.getElementById("landing-loader");
    const progressBar = document.getElementById("loader-progress");
    const nav = document.querySelector(".landing-nav");

    // We store the current frame in an object so GSAP can uniquely animate it
    const heroState = {
        frame: 0
    };

    // 2. Base Configuration depending on screen size
    // Calculate aspect ratio covering the browser elegantly
    function resizeCanvas() {
        // Handle high DPI screens for sharp rendering
        const dpr = window.devicePixelRatio || 1;
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        
        // Internal resolution (buffer)
        canvas.width = winWidth * dpr;
        canvas.height = winHeight * dpr;
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        // CSS visual size
        canvas.style.width = `${winWidth}px`;
        canvas.style.height = `${winHeight}px`;

        // Initial render constraint
        if (images[heroState.frame] && images[heroState.frame].complete) {
            render();
        }
    }
    
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas(); // Set initially

    // 3. Preloading System
    // We preload sequentially. We hide the loader after the first ~30 frames load
    // so the user can begin, whilst the rest load in the background.
    const currentFrame = index => {
        // Generate padded string e.g., "001" to "240"
        let numStr = (index + 1).toString().padStart(3, '0');
        return `Landing_Page/ezgif-frame-${numStr}.jpg`;
    };

    let loadedCount = 0;
    const initialLoadThreshold = Math.min(30, frameCount); // When to reveal UI
    
    function preloadImages() {
        for (let i = 0; i < frameCount; i++) {
            const img = new Image();
            img.onload = () => {
                loadedCount++;
                
                // Update Progress Bar
                const percent = Math.floor((loadedCount / frameCount) * 100);
                progressBar.style.width = `${percent}%`;

                // If threshold reached, reveal page
                if (loadedCount === initialLoadThreshold) {
                    revealPage();
                }

                // Initial render specifically when First image finishes
                if (i === 0) {
                    render();
                }
            };
            img.src = currentFrame(i);
            images.push(img);
        }
    }

    function revealPage() {
        // Fade out loader
        loader.style.opacity = "0";
        setTimeout(() => {
            loader.style.display = "none";
        }, 800);
        
        // Fade in first section
        gsap.to("#intro .text-box", {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
            delay: 0.2
        });
    }

    // 4. Rendering Function
    function render() {
        const img = images[heroState.frame];
        if (img && img.complete) {
            const dpr = window.devicePixelRatio || 1;
            const winWidth = window.innerWidth;
            const winHeight = window.innerHeight;

            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = "high";
            context.clearRect(0, 0, canvas.width, canvas.height);

            // Calculate "Cover" logic manually to ensure maximum sharpness
            const imgRatio = img.width / img.height;
            const winRatio = winWidth / winHeight;
            
            let drawWidth, drawHeight, offsetX, offsetY;

            if (winRatio > imgRatio) {
                drawWidth = canvas.width;
                drawHeight = canvas.width / imgRatio;
                offsetX = 0;
                offsetY = (canvas.height - drawHeight) / 2;
            } else {
                drawWidth = canvas.height * imgRatio;
                drawHeight = canvas.height;
                offsetX = (canvas.width - drawWidth) / 2;
                offsetY = 0;
            }

            context.drawImage(img, Math.floor(offsetX), Math.floor(offsetY), Math.ceil(drawWidth), Math.ceil(drawHeight));
        }
    }

    // 5. GSAP ScrollTrigger Integration
    gsap.registerPlugin(ScrollTrigger);

    // Timeline spanning the entire scroll-content height
    // We bind the `frame` property so scrolling interpolates 0 -> 239.
    gsap.to(heroState, {
        frame: frameCount - 1,
        snap: "frame", // Snap to whole numbers exclusively (cannot draw fraction of frame)
        ease: "none",
        scrollTrigger: {
            trigger: ".scroll-content",
            start: "top top",
            end: "bottom bottom",
            scrub: 0.5, // 0.5s scrubbing smooths fast scrolls
            onUpdate: render // Fire render on every scrub tick
        }
    });

    // 6. Content Section Overlays Animations
    // Dynamically fade sections in and out when they enter viewport
    const sections = gsap.utils.toArray('.step');
    
    sections.forEach((section, i) => {
        // Skip intro (handled at initial load)
        if (i === 0) return;

        const box = section.querySelector('.text-box');
        
        ScrollTrigger.create({
            trigger: section,
            start: "top center+=20%", // Trigger when section top enters vertically lower
            end: "bottom center-=20%",
            onEnter: () => gsap.to(box, { opacity: 1, y: 0, duration: 0.8 }),
            onLeave: () => gsap.to(box, { opacity: 0, y: -50, duration: 0.5 }),
            onEnterBack: () => gsap.to(box, { opacity: 1, y: 0, duration: 0.8 }),
            onLeaveBack: () => gsap.to(box, { opacity: 0, y: 50, duration: 0.5 })
        });
    });

    // 7. Navbar Styling on Scroll
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            nav.classList.add("scrolled");
        } else {
            nav.classList.remove("scrolled");
        }
    });

    // Kickoff Preloading
    preloadImages();
});

// Global About Modal Control
function showAboutPage() {
    const modal = document.getElementById("aboutPage");
    if (modal) {
        modal.style.display = "block";
        document.body.style.overflow = "hidden";
    }
}

function hideAboutPage() {
    const modal = document.getElementById("aboutPage");
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "";
    }
}
