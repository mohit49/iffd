"use strict";

(function initPageScripts() {
    const COLOR_PALETTE = ["#e75a93", "#5cbca9", "#65a556", "#ffffff", "#313c40"];
    const DOT_COLUMNS = 3;
    const DOT_ROWS = 9;
    const PARALLAX_MOBILE_BREAKPOINT = 768;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    function initHeaderInteractions() {
        const menuToggle = document.getElementById("menu-toggle");
        const menuClose = document.getElementById("menu-close");
        const overlay = document.getElementById("mobile-menu-overlay");
        const drawer = document.getElementById("mobile-menu-drawer");
        const desktopMoreToggle = document.getElementById("desktop-more-toggle");
        const desktopMoreMenu = document.getElementById("desktop-more-menu");
        const desktopMoreArrow = document.getElementById("desktop-more-arrow");

        if (!menuToggle || !overlay || !drawer) {
            return;
        }

        const openMenu = () => {
            drawer.classList.remove("translate-x-full");
            overlay.classList.remove("hidden");
            document.body.classList.add("overflow-hidden");
        };

        const closeMenu = () => {
            drawer.classList.add("translate-x-full");
            overlay.classList.add("hidden");
            document.body.classList.remove("overflow-hidden");
        };

        menuToggle.addEventListener("click", openMenu);
        overlay.addEventListener("click", closeMenu);
        if (menuClose) {
            menuClose.addEventListener("click", closeMenu);
        }

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeMenu();
            }
        });

        const desktopMediaQuery = window.matchMedia("(min-width: 1024px)");
        const onDesktopBreakpoint = (event) => {
            if (event.matches) {
                closeMenu();
            }
        };
        if (desktopMediaQuery.addEventListener) {
            desktopMediaQuery.addEventListener("change", onDesktopBreakpoint);
        } else if (desktopMediaQuery.addListener) {
            desktopMediaQuery.addListener(onDesktopBreakpoint);
        }

        if (!desktopMoreToggle || !desktopMoreMenu || !desktopMoreArrow) {
            return;
        }

        desktopMoreToggle.addEventListener("click", (event) => {
            event.stopPropagation();
            desktopMoreMenu.classList.toggle("hidden");
            desktopMoreArrow.classList.toggle("rotate-180");
        });

        document.addEventListener("click", (event) => {
            const clickedOutsideMenu = !desktopMoreMenu.contains(event.target);
            const clickedOutsideToggle = !desktopMoreToggle.contains(event.target);
            if (clickedOutsideMenu && clickedOutsideToggle) {
                desktopMoreMenu.classList.add("hidden");
                desktopMoreArrow.classList.remove("rotate-180");
            }
        });
    }

    function initStickyHeader() {
        const header = document.getElementById("main-header");
        if (!header) return;

        const COMPACT_THRESHOLD = 80;
        const SCROLL_DELTA = 5;
        let lastScrollY = window.scrollY;

        function onScroll() {
            const scrollY = window.scrollY;
            const scrollDown = scrollY > lastScrollY;
            const scrollUp = scrollY < lastScrollY;

            if (scrollY <= COMPACT_THRESHOLD) {
                header.classList.remove("header-compact", "header-hidden");
                document.body.classList.remove("header-compact-active");
            } else {
                header.classList.add("header-compact");
                document.body.classList.add("header-compact-active");
                if (scrollDown && scrollY - lastScrollY > SCROLL_DELTA) {
                    header.classList.add("header-hidden");
                } else if (scrollUp && lastScrollY - scrollY > SCROLL_DELTA) {
                    header.classList.remove("header-hidden");
                }
            }
            lastScrollY = scrollY;
        }

        let ticking = false;
        window.addEventListener("scroll", () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    onScroll();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        onScroll();
    }

    function initNavHoverIndicator() {
        const navs = Array.from(document.querySelectorAll(".nav-hover-nav"));
        if (!navs.length) {
            return;
        }

        navs.forEach((nav) => {
            const indicator = nav.querySelector(".nav-hover-indicator");
            const links = Array.from(nav.querySelectorAll(".nav-hover-link"));
            if (!indicator || !links.length) {
                return;
            }

            const defaultActive = links.find((link) => link.hasAttribute("data-default-active")) || null;

            const setActiveLink = (activeLink) => {
                links.forEach((link) => {
                    if (link === activeLink) {
                        link.classList.add("is-active");
                    } else {
                        link.classList.remove("is-active");
                    }
                });
            };

            const moveIndicator = (link) => {
                const navRect = nav.getBoundingClientRect();
                const linkRect = link.getBoundingClientRect();
                const offsetLeft = linkRect.left - navRect.left;

                indicator.style.width = `${linkRect.width}px`;
                indicator.style.left = `${offsetLeft}px`;
                indicator.style.opacity = "1";
                setActiveLink(link);
            };

            const resetToDefault = () => {
                if (!defaultActive) {
                    indicator.style.opacity = "0";
                    links.forEach((link) => link.classList.remove("is-active"));
                    return;
                }
                moveIndicator(defaultActive);
            };

            links.forEach((link) => {
                link.addEventListener("mouseenter", () => moveIndicator(link));
                link.addEventListener("focus", () => moveIndicator(link));
            });

            nav.addEventListener("mouseleave", resetToDefault);
            nav.addEventListener("focusout", (event) => {
                if (!nav.contains(event.relatedTarget)) {
                    resetToDefault();
                }
            });

            resetToDefault();
        });
    }

    function initHeroDots() {
        const dots = Array.from(document.querySelectorAll(".hero-dot"));
        if (!dots.length) {
            return;
        }

        const pickColor = (blockedColors) => {
            const available = COLOR_PALETTE.filter((color) => !blockedColors.includes(color));
            return available.length ? pickRandom(available) : pickRandom(COLOR_PALETTE);
        };

        const updateDots = () => {
            for (let row = 0; row < DOT_ROWS; row += 1) {
                let prevColorInRow = "";

                for (let col = 0; col < DOT_COLUMNS; col += 1) {
                    const dotIndex = row * DOT_COLUMNS + col;
                    const dot = dots[dotIndex];
                    if (!dot) {
                        continue;
                    }

                    const currentColor = dot.dataset.color || "";
                    const nextColor = pickColor([currentColor, prevColorInRow]);
                    dot.style.backgroundColor = nextColor;
                    dot.dataset.color = nextColor;
                    prevColorInRow = nextColor;
                }
            }
        };

        updateDots();
        window.setInterval(updateDots, 650);
    }

    function initHeroParallax() {
        const heroSection = document.getElementById("hero-section");
        const leftDecor = document.getElementById("hero-left-decor");
        const rightDecor = document.getElementById("hero-right-decor");
        if (!heroSection) {
            return;
        }

        const heroStartY = window.scrollY + heroSection.getBoundingClientRect().top;
        let ticking = false;

        heroSection.style.willChange = "background-position";
        if (leftDecor) {
            leftDecor.style.willChange = "transform";
        }
        if (rightDecor) {
            rightDecor.style.willChange = "transform";
        }

        const updateParallax = () => {
            if (window.innerWidth < PARALLAX_MOBILE_BREAKPOINT) {
                heroSection.style.backgroundPosition = "center center";
                if (leftDecor) {
                    leftDecor.style.transform = "";
                }
                if (rightDecor) {
                    rightDecor.style.transform = "";
                }
                ticking = false;
                return;
            }

            const rect = heroSection.getBoundingClientRect();
            const viewportHeight = window.innerHeight || 0;
            const isVisible = rect.bottom > 0 && rect.top < viewportHeight;

            if (isVisible) {
                const scrollDelta = window.scrollY - heroStartY;
                const bgOffset = clamp(scrollDelta * 0.22, -160, 160);
                const leftOffset = clamp(scrollDelta * 0.14, -100, 100);
                const rightOffset = clamp(scrollDelta * -0.17, -120, 120);

                heroSection.style.backgroundPosition = `center calc(50% + ${bgOffset}px)`;

                if (leftDecor) {
                    leftDecor.style.transform = `translate3d(0, ${leftOffset}px, 0)`;
                }
                if (rightDecor) {
                    rightDecor.style.transform = `translate3d(0, ${rightOffset}px, 0)`;
                }
            }

            ticking = false;
        };

        const requestParallax = () => {
            if (ticking) {
                return;
            }
            ticking = true;
            window.requestAnimationFrame(updateParallax);
        };

        window.addEventListener("scroll", requestParallax, { passive: true });
        window.addEventListener("resize", requestParallax);
        requestParallax();
    }

    function initScrollReveal() {
        const revealElements = Array.from(document.querySelectorAll(".reveal-left, .reveal-up, .reveal-slide-pop-left, .reveal-slide-pop-right"));
        if (!revealElements.length) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                    } else {
                        entry.target.classList.remove("is-visible");
                    }
                });
            },
            { threshold: 0.2, rootMargin: "0px 0px -40px 0px" }
        );

        revealElements.forEach((element) => observer.observe(element));
    }

    function initStarBorder() {
        const strips = document.querySelectorAll(".star-strip");
        if (!strips.length) {
            return;
        }

        const STAR_SIZE = 22;
        const STAR_GAP = 10;

        function renderStars(strip) {
            const stripWidth = strip.clientWidth;
            if (!stripWidth) {
                return;
            }

            const count = Math.ceil(stripWidth / (STAR_SIZE + STAR_GAP)) + 2;
            strip.innerHTML = "";

            for (let i = 0; i < count; i += 1) {
                const star = document.createElement("img");
                star.src = "assets/star-border.png";
                star.alt = "";
                star.setAttribute("aria-hidden", "true");
                star.className = "star-item";

                const duration = (1.2 + Math.random() * 1.2).toFixed(2);
                const delay = (Math.random() * 1.4).toFixed(2);
                star.style.animationDuration = `${duration}s`;
                star.style.animationDelay = `${delay}s`;
                star.style.animationDirection = i % 2 === 0 ? "normal" : "alternate";

                strip.appendChild(star);
            }
        }

        let resizeTimeout;
        const onResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = window.setTimeout(() => {
                strips.forEach(renderStars);
            }, 120);
        };

        strips.forEach(renderStars);
        window.addEventListener("resize", onResize);
    }

    initHeaderInteractions();
    initStickyHeader();
    initNavHoverIndicator();
    initHeroDots();
    initHeroParallax();
    initScrollReveal();
    initStarBorder();
})();
