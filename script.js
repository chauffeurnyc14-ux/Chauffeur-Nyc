document.addEventListener('DOMContentLoaded', () => {
    // Initialize AOS with cinematic settings
    AOS.init({
        duration: 1200,
        once: true,
        offset: 100,
        easing: 'ease-out-cubic'
    });

    // Navbar scroll effect
    const nav = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu-overlay');
    const menuIcon = menuBtn ? menuBtn.querySelector('i') : null;
    
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            const isActive = mobileMenu.classList.toggle('active');
            document.body.style.overflow = isActive ? 'hidden' : '';
            
            // Toggle icon
            if (menuIcon) {
                menuIcon.classList.toggle('fa-bars-staggered');
                menuIcon.classList.toggle('fa-xmark');
            }
        });

        // Close menu on link click or click outside
        mobileMenu.addEventListener('click', (e) => {
            if (e.target === mobileMenu || e.target.classList.contains('mobile-nav-link')) {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
                if (menuIcon) {
                    menuIcon.classList.add('fa-bars-staggered');
                    menuIcon.classList.remove('fa-xmark');
                }
            }
        });
    }

    // Use My Current Location functionality
    const getLocationBtn = document.getElementById('get-location');
    const pickupInput = document.getElementById('booking-pickup');
    
    if (getLocationBtn && pickupInput) {
        getLocationBtn.addEventListener('click', () => {
            if ("geolocation" in navigator) {
                getLocationBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Locating...';
                navigator.geolocation.getCurrentPosition((position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    pickupInput.value = `Current Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
                    getLocationBtn.innerHTML = '<i class="fa-solid fa-check"></i> Location Captured';
                    setTimeout(() => {
                        getLocationBtn.innerHTML = '<i class="fa-solid fa-location-dot"></i> Use My Current Location';
                    }, 3000);
                }, (error) => {
                    console.error("Geolocation error:", error);
                    getLocationBtn.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Access Denied';
                    setTimeout(() => {
                        getLocationBtn.innerHTML = '<i class="fa-solid fa-location-dot"></i> Use My Current Location';
                    }, 3000);
                });
            } else {
                alert("Geolocation is not supported by this browser.");
            }
        });
    }

    // --- SMART VIDEO AUDIO SYSTEM ---
    const allVideos = document.querySelectorAll('video');
    
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
                // Video is prominent - Unmute
                video.muted = false;
                // Attempt play just in case
                video.play().catch(() => {
                    // Browser blocked autoplay with sound, keep muted until interaction
                    video.muted = true;
                });
            } else {
                // Video is not prominent - Mute
                video.muted = true;
            }
        });
    }, {
        threshold: [0, 0.6, 1.0]
    });

    allVideos.forEach(video => {
        video.muted = true; // Start muted for policy compliance
        videoObserver.observe(video);
        
        // Add one-time click listener to body to "unlock" audio for the session
        // Most browsers allow audio after the first user gesture
        document.body.addEventListener('click', () => {
            if (video.parentElement.closest('.item')) { // Only for gallery/visible videos
                // video.muted = false; // We let the observer handle specific unmuting
            }
        }, { once: true });
    });

    // Luxury Booking Form Handling
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const btn = bookingForm.querySelector('button');
            const originalText = btn.innerText;
            
            btn.innerText = 'Transmitting...';
            btn.disabled = true;
            btn.style.opacity = '0.5';
            
            setTimeout(() => {
                // Show luxury success message
                const successDiv = document.createElement('div');
                successDiv.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in';
                successDiv.innerHTML = `
                    <div class="text-center p-10 max-w-lg border theme-border theme-surface-matte shadow-2xl">
                        <img src="WhatsApp Image 2026-04-23 at 01.14.37.jpeg" class="h-12 mx-auto mb-8">
                        <h3 class="text-2xl font-bold uppercase tracking-[0.3em] mb-4 theme-text-heading">Inquiry Received</h3>
                        <p class="theme-text-muted text-sm tracking-widest leading-loose">
                            Your request has been securely transmitted to our private concierge. 
                            An elite chauffeur specialist will contact you shortly to finalize your journey.
                        </p>
                        <button class="mt-10 px-8 py-3 bg-white text-black text-[10px] uppercase tracking-widest font-bold" onclick="this.parentElement.parentElement.remove()">Close</button>
                    </div>
                `;
                document.body.appendChild(successDiv);
                
                bookingForm.reset();
                btn.innerText = originalText;
                btn.disabled = false;
                btn.style.opacity = '1';
            }, 2000);
        });
    }

    // Clean up any legacy theme selection in localStorage
    try {
        localStorage.removeItem('theme');
    } catch (e) {
        // Storage access handled gracefully
    }

    // Custom Fleet Multi-Select Dropdown Logic
    const fleetDropdown = document.getElementById('fleet-multi-select');
    if (fleetDropdown) {
        const trigger = fleetDropdown.querySelector('.dropdown-trigger');
        const menu = fleetDropdown.querySelector('.dropdown-menu');
        const checkboxes = fleetDropdown.querySelectorAll('.fleet-checkbox');
        const selectedText = document.getElementById('selected-fleet-text');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!fleetDropdown.contains(e.target)) {
                menu.classList.add('hidden');
            }
        });

        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                const selected = Array.from(checkboxes)
                    .filter(c => c.checked)
                    .map(c => c.value);

                if (selected.length === 0) {
                    selectedText.innerText = '▼ Select Fleet(s)';
                } else if (selected.length <= 2) {
                    selectedText.innerText = `▼ ${selected.join(', ')}`;
                } else {
                    selectedText.innerText = `▼ ${selected.length} Vehicles Selected`;
                }
            });
        });
    }

    // Hero Booking Form Handling (WhatsApp Integration)
    const heroBooking = document.getElementById('hero-booking');
    if (heroBooking) {
        heroBooking.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Validation: Check if at least one vehicle is selected
            const selectedVehicles = Array.from(heroBooking.querySelectorAll('.fleet-checkbox:checked'))
                .map(cb => cb.value);
            
            if (selectedVehicles.length === 0) {
                alert('Please select at least one vehicle from the fleet.');
                return;
            }

            const btn = heroBooking.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = 'Transmitting...';
            btn.disabled = true;

            // Collect values
            const name = document.getElementById('booking-name').value;
            const phone = document.getElementById('booking-phone').value;
            const email = document.getElementById('booking-email').value;
            const pickup = document.getElementById('booking-pickup').value;
            const destination = document.getElementById('booking-destination').value;
            const hours = document.getElementById('booking-hours').value;
            const pDate = document.getElementById('booking-pickup-date').value;
            const pTime = document.getElementById('booking-pickup-time').value;

            // Format WhatsApp Message
            const fleetList = selectedVehicles.map(v => `• ${v}`).join('\n');
            const message = `*NEW BOOKING REQUEST - CHAUFFEURNYC*\n\n👤 Name:\n${name}\n\n📞 Phone:\n${phone}\n\n📧 Email:\n${email}\n\n📍 Pickup Location:\n${pickup}\n\n🏁 Destination:\n${destination}\n\n⏱ Total Rental Hours:\n${hours}\n\n📅 Pickup Schedule:\n${pDate} at ${pTime}\n\n🚗 Selected Fleet(s):\n\n${fleetList}`;

            // Define target (19292637593)
            const whatsappNumber = "19292637593"; 
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

            setTimeout(() => {
                // Open WhatsApp in new tab
                window.open(whatsappUrl, '_blank');
                
                // UI state recovery
                btn.innerText = originalText;
                btn.disabled = false;
            }, 1000);
        });
    }

    // Horizontal Scroll interactions
    const horizontalScroll = document.querySelector('.horizontal-scroll');
    if (horizontalScroll) {
        let isDown = false;
        let scrollLeft;
        let startX;

        horizontalScroll.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = e.pageX - horizontalScroll.offsetLeft;
            scrollLeft = horizontalScroll.scrollLeft;
        });
        horizontalScroll.addEventListener('mouseleave', () => isDown = false);
        horizontalScroll.addEventListener('mouseup', () => isDown = false);
        horizontalScroll.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - horizontalScroll.offsetLeft;
            const walk = (x - startX) * 2;
            horizontalScroll.scrollLeft = scrollLeft - walk;
        });
    }
});