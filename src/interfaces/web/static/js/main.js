// Main JavaScript for Homepage
// ============================

// Initialize homepage
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add hover effects to feature cards
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-4px)';
        });
    });

    // Animate stats on scroll
    const observeStats = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
            }
        });
    });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        observeStats.observe(heroStats);
    }
});

function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const text = stat.textContent;
        if (text === '3') {
            animateNumber(stat, 0, 3, 1000);
        } else if (text === '24/7') {
            // Keep as is - it's text
            stat.style.opacity = '1';
        } else if (text === '100%') {
            animateNumber(stat, 0, 100, 1500, '%');
        }
    });
}

function animateNumber(element, start, end, duration, suffix = '') {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (end - start) * progress);
        element.textContent = current + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Navigation active state management
function updateActiveNav() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}

// Call on page load
updateActiveNav();

// Feature card click handlers
document.querySelectorAll('.feature-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        
        // Add some visual feedback
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = '';
        }, 150);
        
        // Check if the feature is available
        const statusElement = this.parentElement.querySelector('.feature-status');
        if (statusElement && statusElement.textContent.includes('Coming Soon')) {
            e.preventDefault();
            showComingSoon();
        }
    });
});

function showComingSoon() {
    alert('🚧 This feature is coming soon! \n\nWe\'re working hard to bring you the best possible experience. Stay tuned for updates!');
}

// Add loading animation for page transitions
function addPageTransition() {
    document.body.style.opacity = '0.9';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 300);
}

// Call on page navigation
window.addEventListener('beforeunload', addPageTransition);