"use strict";

(function initPageScripts() {
    const COLOR_PALETTE = ["#e75a93", "#5cbca9", "#65a556", "#ffffff", "#313c40"];
    const DOT_COLUMNS = 3;
    const DOT_ROWS = 9;
    const PARALLAX_MOBILE_BREAKPOINT = 768;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    function formDataToObject(form) {
        const data = {};
        const formData = new FormData(form);
        for (const [key, value] of formData.entries()) {
            if (data[key]) {
                data[key] = Array.isArray(data[key]) ? [...data[key], value] : [data[key], value];
            } else {
                data[key] = value;
            }
        }
        return data;
    }

    function postFormToApi(form, apiUrl) {
        if (!apiUrl || !form) return Promise.reject(new Error("Missing form or API URL"));
        const data = formDataToObject(form);
        return fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
    }

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

    function initHeaderDropdowns() {
        document.querySelectorAll(".header-dropdown").forEach((dropdown) => {
            const toggle = dropdown.querySelector(".header-dropdown-toggle");
            const menu = dropdown.querySelector(".header-dropdown-menu");
            if (!toggle || !menu) return;

            toggle.addEventListener("click", (e) => {
                e.stopPropagation();
                const isOpen = dropdown.classList.toggle("is-open");
                toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
                document.querySelectorAll(".header-dropdown").forEach((other) => {
                    if (other !== dropdown) {
                        other.classList.remove("is-open");
                        const t = other.querySelector(".header-dropdown-toggle");
                        if (t) t.setAttribute("aria-expanded", "false");
                    }
                });
            });
        });

        document.addEventListener("click", () => {
            document.querySelectorAll(".header-dropdown.is-open").forEach((dropdown) => {
                dropdown.classList.remove("is-open");
                const t = dropdown.querySelector(".header-dropdown-toggle");
                if (t) t.setAttribute("aria-expanded", "false");
            });
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

    function initAboutParallax() {
        const aboutHero = document.getElementById("about-hero-section");
        const aboutIffdBg = document.getElementById("about-iffd-bg");
        const iff2026Bg = document.getElementById("iffd-2026-bg");

        if (!aboutHero && !aboutIffdBg && !iff2026Bg) return;

        let ticking = false;

        const updateAboutParallax = () => {
            if (aboutHero) {
                const rect = aboutHero.getBoundingClientRect();
                const viewportHeight = window.innerHeight || 0;
                if (rect.bottom > 0 && rect.top < viewportHeight && window.innerWidth >= PARALLAX_MOBILE_BREAKPOINT) {
                    const heroTop = aboutHero.offsetTop;
                    const scrollDelta = window.scrollY - heroTop;
                    const bgOffset = clamp(scrollDelta * 0.22, -120, 120);
                    aboutHero.style.backgroundPosition = `center calc(50% + ${bgOffset}px)`;
                }
            }
            if (aboutIffdBg) {
                const section = aboutIffdBg.closest("section");
                if (section) {
                    const rect = section.getBoundingClientRect();
                    const viewportHeight = window.innerHeight || 0;
                    if (rect.bottom > 0 && rect.top < viewportHeight && window.innerWidth >= PARALLAX_MOBILE_BREAKPOINT) {
                        const sectionTop = section.offsetTop;
                        const scrollDelta = window.scrollY - sectionTop;
                        const bgOffset = clamp(scrollDelta * 0.28, 0, 80);
                        aboutIffdBg.style.transform = `translate3d(0, ${bgOffset}px, 0)`;
                    }
                }
            }
            if (iff2026Bg) {
                const section = iff2026Bg.closest("section");
                if (section) {
                    const rect = section.getBoundingClientRect();
                    const viewportHeight = window.innerHeight || 0;
                    if (rect.bottom > 0 && rect.top < viewportHeight && window.innerWidth >= PARALLAX_MOBILE_BREAKPOINT) {
                        const sectionTop = section.offsetTop;
                        const scrollDelta = window.scrollY - sectionTop;
                        const bgOffset = clamp(scrollDelta * 0.28, 0, 80);
                        iff2026Bg.style.transform = `translate3d(0, ${bgOffset}px, 0)`;
                    }
                }
            }
            ticking = false;
        };

        const requestAboutParallax = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(updateAboutParallax);
        };

        if (aboutHero) aboutHero.style.willChange = "background-position";
        if (aboutIffdBg) aboutIffdBg.style.willChange = "transform";
        if (iff2026Bg) iff2026Bg.style.willChange = "transform";

        window.addEventListener("scroll", requestAboutParallax, { passive: true });
        window.addEventListener("resize", requestAboutParallax);
        requestAboutParallax();
    }

    function initMediaGalleryParallax() {
        const mediaSpan = document.getElementById("media-gallery-media");
        const gallerySpan = document.getElementById("media-gallery-gallery");
        const heroSection = document.getElementById("media-gallery-hero");
        if (!mediaSpan || !gallerySpan || !heroSection) return;

        let ticking = false;

        const updateParallax = () => {
            if (window.innerWidth < PARALLAX_MOBILE_BREAKPOINT) {
                mediaSpan.style.transform = "";
                gallerySpan.style.transform = "";
                ticking = false;
                return;
            }

            const rect = heroSection.getBoundingClientRect();
            const viewportHeight = window.innerHeight || 0;
            const isVisible = rect.bottom > 0 && rect.top < viewportHeight;

            if (isVisible) {
                const scrollDelta = window.scrollY - heroSection.offsetTop;
                const mediaOffset = clamp(scrollDelta * 0.25, -80, 80);
                const galleryOffset = clamp(scrollDelta * 0.12, -50, 50);
                mediaSpan.style.transform = `translate3d(0, ${mediaOffset}px, 0)`;
                gallerySpan.style.transform = `translate3d(0, ${galleryOffset}px, 0)`;
            } else {
                mediaSpan.style.transform = "";
                gallerySpan.style.transform = "";
            }
            ticking = false;
        };

        const requestParallax = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(updateParallax);
        };

        mediaSpan.style.willChange = "transform";
        gallerySpan.style.willChange = "transform";
        window.addEventListener("scroll", requestParallax, { passive: true });
        window.addEventListener("resize", requestParallax);
        requestParallax();
    }

    function initExpoParallax() {
        const cineverseSpan = document.getElementById("expo-cineverse");
        const expoSpan = document.getElementById("expo-expo");
        const heroSection = document.getElementById("expo-hero");
        if (!cineverseSpan || !expoSpan || !heroSection) return;

        let ticking = false;

        const updateParallax = () => {
            if (window.innerWidth < PARALLAX_MOBILE_BREAKPOINT) {
                cineverseSpan.style.transform = "";
                expoSpan.style.transform = "";
                ticking = false;
                return;
            }

            const rect = heroSection.getBoundingClientRect();
            const viewportHeight = window.innerHeight || 0;
            const isVisible = rect.bottom > 0 && rect.top < viewportHeight;

            if (isVisible) {
                const scrollDelta = window.scrollY - heroSection.offsetTop;
                const cineverseOffset = clamp(scrollDelta * 0.25, -80, 80);
                const expoOffset = clamp(scrollDelta * 0.12, -50, 50);
                cineverseSpan.style.transform = `translate3d(0, ${cineverseOffset}px, 0)`;
                expoSpan.style.transform = `translate3d(0, ${expoOffset}px, 0)`;
            } else {
                cineverseSpan.style.transform = "";
                expoSpan.style.transform = "";
            }
            ticking = false;
        };

        const requestParallax = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(updateParallax);
        };

        cineverseSpan.style.willChange = "transform";
        expoSpan.style.willChange = "transform";
        window.addEventListener("scroll", requestParallax, { passive: true });
        window.addEventListener("resize", requestParallax);
        requestParallax();
    }

    function initScrollReveal() {
        const revealElements = Array.from(document.querySelectorAll(".reveal-left, .reveal-up, .reveal-slide-pop-left, .reveal-slide-pop-right, .reveal-from-footer, .reveal-popout"));
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

    function initViewFilmPopup() {
        const viewFilm = document.getElementById("view-film");
        const overlay = document.getElementById("film-popup-overlay");
        const closeBtn = document.getElementById("film-popup-close");
        const video = document.getElementById("film-popup-video");

        if (!viewFilm || !overlay || !closeBtn) {
            return;
        }

        const isDesktop = () => window.matchMedia("(min-width: 768px)").matches;

        const openPopup = () => {
            overlay.classList.add("is-open");
            overlay.setAttribute("aria-hidden", "false");
            document.body.classList.add("overflow-hidden");
            if (video) {
                video.currentTime = 0;
                if (isDesktop()) {
                    video.play().catch(() => {});
                }
            }
        };

        const closePopup = () => {
            overlay.classList.remove("is-open");
            overlay.setAttribute("aria-hidden", "true");
            document.body.classList.remove("overflow-hidden");
            if (video) {
                video.pause();
            }
        };

        viewFilm.addEventListener("click", openPopup);
        viewFilm.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openPopup();
            }
        });
        closeBtn.addEventListener("click", closePopup);
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                closePopup();
            }
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && overlay.classList.contains("is-open")) {
                closePopup();
            }
        });
    }

    function initContactFormValidation() {
        const form = document.getElementById("contact-form");
        if (!form) return;

        const nameInput = form.querySelector('input[name="name"]');
        const emailInput = form.querySelector('input[name="email"]');
        const mobileInput = form.querySelector('input[name="mobile"]');
        const messageInput = form.querySelector('textarea[name="message"]');

        const ERROR_CLASS = "border-red-500";
        const ERROR_MSG_CLASS = "contact-form-error text-sm text-red-500 mt-1";

        function showError(input, message) {
            input.classList.add(ERROR_CLASS);
            input.classList.remove("border-gray-300");
            let err = input.parentElement?.querySelector("." + ERROR_MSG_CLASS.split(" ")[0]);
            if (!err) {
                err = document.createElement("div");
                err.className = ERROR_MSG_CLASS;
                input.parentElement?.appendChild(err);
            }
            err.textContent = message;
        }

        function clearError(input) {
            input.classList.remove(ERROR_CLASS);
            input.classList.add("border-gray-300");
            const err = input.parentElement?.querySelector("." + ERROR_MSG_CLASS.split(" ")[0]);
            if (err) err.remove();
        }

        function validateName() {
            const v = (nameInput?.value || "").trim();
            if (!v) {
                showError(nameInput, "Name is required.");
                return false;
            }
            if (v.length < 2) {
                showError(nameInput, "Name must be at least 2 characters.");
                return false;
            }
            clearError(nameInput);
            return true;
        }

        function validateEmail() {
            const v = (emailInput?.value || "").trim();
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!v) {
                showError(emailInput, "Email is required.");
                return false;
            }
            if (!re.test(v)) {
                showError(emailInput, "Please enter a valid email address.");
                return false;
            }
            clearError(emailInput);
            return true;
        }

        function validateMobile() {
            const v = (mobileInput?.value || "").trim().replace(/\s/g, "");
            const digits = v.replace(/\D/g, "");
            if (!v) {
                showError(mobileInput, "Mobile number is required.");
                return false;
            }
            if (digits.length < 10 || digits.length > 15) {
                showError(mobileInput, "Please enter a valid mobile number (10–15 digits).");
                return false;
            }
            clearError(mobileInput);
            return true;
        }

        [nameInput, emailInput, mobileInput].forEach((input) => {
            input?.addEventListener("blur", () => {
                if (input === nameInput) validateName();
                if (input === emailInput) validateEmail();
                if (input === mobileInput) validateMobile();
            });
            input?.addEventListener("input", () => clearError(input));
        });

        const submitBtn = form.querySelector("#registration-form-submit-btn");
        const handleSubmit = async () => {
            const nameOk = validateName();
            const emailOk = validateEmail();
            const contactOk = validateContact();
            if (!nameOk || !emailOk || !contactOk) return;
            const apiUrl = form.dataset.apiUrl || "";
            if (!apiUrl) {
                console.warn("Registration form: Set data-api-url attribute with your API endpoint.");
                return;
            }
            const originalText = submitBtn?.textContent;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Submitting...";
            }
            try {
                const res = await postFormToApi(form, apiUrl);
                if (res.ok) {
                    const wrapper = document.getElementById("registration-form-wrapper");
                    const successEl = document.getElementById("registration-form-success");
                    if (wrapper) wrapper.classList.add("hidden");
                    if (successEl) successEl.classList.remove("hidden");
                    form.reset();
                } else {
                    throw new Error(res.statusText || "Request failed");
                }
            } catch (err) {
                console.error("Registration form submit error:", err);
                if (submitBtn) submitBtn.textContent = "Try Again";
                alert("Could not submit. Please try again later.");
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    if (submitBtn.textContent !== "Submitted!") submitBtn.textContent = originalText;
                }
            }
        };

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit();
            return false;
        });
    }

    function initRegistrationTabs() {
        const tabs = document.querySelectorAll(".registration-tab");
        const contents = document.querySelectorAll(".registration-tab-content");
        if (!tabs.length || !contents.length) return;

        function switchToTab(tabValue) {
            const targetId = "tab-" + tabValue;
            const tab = Array.from(tabs).find((t) => t.dataset.tab === tabValue);
            const content = document.getElementById(targetId);
            if (!tab || !content) return;
            tabs.forEach((t) => {
                t.classList.remove("active", "border-[#ea5183]", "text-[#ea5183]");
                t.classList.add("border-transparent", "text-gray-500");
            });
            tab.classList.add("active", "border-[#ea5183]", "text-[#ea5183]");
            tab.classList.remove("border-transparent", "text-gray-500");
            contents.forEach((c) => {
                c.classList.add("hidden");
                if (c.id === targetId) c.classList.remove("hidden");
            });
        }

        const hash = (window.location.hash || "").replace("#", "");
        if (hash === "media" || hash === "general") {
            switchToTab(hash);
        }

        tabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                switchToTab(tab.dataset.tab || "");
            });
        });
    }

    function initRegistrationFormValidation() {
        const form = document.getElementById("registration-form");
        if (!form) return;

        const nameInput = form.querySelector('input[name="fullname"]');
        const emailInput = form.querySelector('input[name="email"]');
        const contactInput = form.querySelector('input[name="contact"]');

        const ERROR_CLASS = "border-red-500";

        function getErrorEl(input) {
            return input.closest(".w-full")?.querySelector(".registration-form-error");
        }

        function showError(input, message) {
            input.classList.add(ERROR_CLASS);
            input.classList.remove("border-gray-300");
            const err = getErrorEl(input);
            if (err) {
                err.textContent = message;
                err.classList.remove("hidden");
            }
        }

        function clearError(input) {
            input.classList.remove(ERROR_CLASS);
            input.classList.add("border-gray-300");
            const err = getErrorEl(input);
            if (err) {
                err.textContent = "";
                err.classList.add("hidden");
            }
        }

        function validateName() {
            const v = (nameInput?.value || "").trim();
            if (!v) {
                showError(nameInput, "Full name is required.");
                return false;
            }
            if (v.length < 2) {
                showError(nameInput, "Full name must be at least 2 characters.");
                return false;
            }
            clearError(nameInput);
            return true;
        }

        function validateEmail() {
            const v = (emailInput?.value || "").trim();
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!v) {
                showError(emailInput, "Email is required.");
                return false;
            }
            if (!re.test(v)) {
                showError(emailInput, "Please enter a valid email address.");
                return false;
            }
            clearError(emailInput);
            return true;
        }

        function validateContact() {
            const v = (contactInput?.value || "").trim();
            if (!v) {
                clearError(contactInput);
                return true;
            }
            const digits = v.replace(/\D/g, "");
            if (digits.length < 10 || digits.length > 15) {
                showError(contactInput, "Please enter a valid contact number (10–15 digits).");
                return false;
            }
            clearError(contactInput);
            return true;
        }

        [nameInput, emailInput, contactInput].forEach((input) => {
            input?.addEventListener("blur", () => {
                if (input === nameInput) validateName();
                if (input === emailInput) validateEmail();
                if (input === contactInput) validateContact();
            });
            input?.addEventListener("input", () => clearError(input));
        });

        const submitBtn = form.querySelector("#registration-form-submit-btn");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const nameOk = validateName();
            const emailOk = validateEmail();
            const contactOk = validateContact();
            if (!nameOk || !emailOk || !contactOk) return;
            const apiUrl = form.dataset.apiUrl || "";
            if (!apiUrl) {
                console.warn("Registration form: Set data-api-url attribute with your API endpoint.");
                return;
            }
            const originalText = submitBtn?.textContent;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Submitting...";
            }
            try {
                const res = await postFormToApi(form, apiUrl);
                if (res.ok) {
                    const wrapper = document.getElementById("registration-form-wrapper");
                    const successEl = document.getElementById("registration-form-success");
                    if (wrapper) wrapper.classList.add("hidden");
                    if (successEl) successEl.classList.remove("hidden");
                    form.reset();
                } else {
                    throw new Error(res.statusText || "Request failed");
                }
            } catch (err) {
                console.error("Registration form submit error:", err);
                if (submitBtn) submitBtn.textContent = "Try Again";
                alert("Could not submit. Please try again later.");
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    if (submitBtn.textContent !== "Submitted!") submitBtn.textContent = originalText;
                }
            }
        });
    }

    function initMediaFormValidation() {
        const form = document.getElementById("media-form");
        if (!form) return;

        const ERROR_CLASS = "border-red-500";

        function getErrorEl(el, selector = ".media-form-error") {
            if (selector === "media-type-choice-error") return form.querySelector(".media-type-choice-error");
            if (selector === "media-type-detail-error") return form.querySelector(".media-type-detail-error");
            if (selector === "coverage-error") return form.querySelector(".coverage-error");
            if (selector === "consent-error") return form.querySelector(".consent-error");
            return el?.closest(".media-field")?.querySelector(".media-form-error");
        }

        function showError(el, message, errorSelector) {
            if (el && el.classList) {
                el.classList.add(ERROR_CLASS);
                el.classList.remove("border-gray-300");
            }
            const err = errorSelector ? getErrorEl(null, errorSelector) : getErrorEl(el);
            if (err) {
                err.textContent = message;
                err.classList.remove("hidden");
            }
        }

        function clearError(el, errorSelector) {
            if (el && el.classList) {
                el.classList.remove(ERROR_CLASS);
                el.classList.add("border-gray-300");
            }
            const err = errorSelector ? getErrorEl(null, errorSelector) : getErrorEl(el);
            if (err) {
                err.textContent = "";
                err.classList.add("hidden");
            }
        }

        function validateRequiredText(input, fieldName) {
            const v = (input?.value || "").trim();
            if (!v) {
                showError(input, `${fieldName} is required.`);
                return false;
            }
            if (v.length < 2) {
                showError(input, `${fieldName} must be at least 2 characters.`);
                return false;
            }
            clearError(input);
            return true;
        }

        function validateEmail() {
            const input = form.querySelector('input[name="email"]');
            const v = (input?.value || "").trim();
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!v) {
                showError(input, "Email is required.");
                return false;
            }
            if (!re.test(v)) {
                showError(input, "Please enter a valid email address.");
                return false;
            }
            clearError(input);
            return true;
        }

        function validateMobile() {
            const input = form.querySelector('input[name="mobile"]');
            const v = (input?.value || "").trim().replace(/\D/g, "");
            if (!v || v.length < 10) {
                showError(input, "Mobile/WhatsApp is required (10+ digits).");
                return false;
            }
            if (v.length > 15) {
                showError(input, "Please enter a valid mobile number (10–15 digits).");
                return false;
            }
            clearError(input);
            return true;
        }

        function validateMediaType() {
            const selected = form.querySelector('input[name="media_type"]:checked');
            if (!selected) {
                showError(null, "Please select your media type.", "media-type-choice-error");
                return false;
            }
            clearError(null, "media-type-choice-error");
            return true;
        }

        function validateTypeOfMedia() {
            const checked = form.querySelectorAll('.media-type-cb:checked');
            if (!checked.length) {
                showError(null, "Please select at least one type of media.", "media-type-detail-error");
                return false;
            }
            clearError(null, "media-type-detail-error");
            return true;
        }

        function validateCoverage() {
            const checked = form.querySelectorAll('.coverage-cb:checked');
            if (!checked.length) {
                showError(null, "Please select at least one type of coverage.", "coverage-error");
                return false;
            }
            clearError(null, "coverage-error");
            return true;
        }

        function validateConsent() {
            const cb = form.querySelector('#media-consent');
            if (!cb?.checked) {
                showError(cb, "You must consent to receive updates.", "consent-error");
                return false;
            }
            clearError(null, "consent-error");
            return true;
        }

        const textInputs = ["firstname", "lastname", "designation", "nationality", "organisation", "publication", "country"];
        textInputs.forEach((name) => {
            const input = form.querySelector(`input[name="${name}"]`);
            const label = (name.charAt(0).toUpperCase() + name.slice(1)).replace(/_/g, " ");
            input?.addEventListener("blur", () => validateRequiredText(input, label));
            input?.addEventListener("input", () => clearError(input));
        });

        form.querySelector('input[name="email"]')?.addEventListener("blur", () => validateEmail());
        form.querySelector('input[name="email"]')?.addEventListener("input", () => clearError(form.querySelector('input[name="email"]')));
        form.querySelector('input[name="mobile"]')?.addEventListener("blur", () => validateMobile());
        form.querySelector('input[name="mobile"]')?.addEventListener("input", () => clearError(form.querySelector('input[name="mobile"]')));

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const ok =
                validateMediaType() &&
                validateRequiredText(form.querySelector('input[name="firstname"]'), "First name") &&
                validateRequiredText(form.querySelector('input[name="lastname"]'), "Last name") &&
                validateRequiredText(form.querySelector('input[name="designation"]'), "Designation/Title") &&
                validateRequiredText(form.querySelector('input[name="nationality"]'), "Nationality") &&
                validateEmail() &&
                validateMobile() &&
                validateRequiredText(form.querySelector('input[name="organisation"]'), "Organisation/Media House") &&
                validateRequiredText(form.querySelector('input[name="publication"]'), "Publication/Channel Name") &&
                validateTypeOfMedia() &&
                validateRequiredText(form.querySelector('input[name="country"]'), "Country of Publication") &&
                validateCoverage() &&
                validateConsent();
            if (!ok) return;
            const apiUrl = form.dataset.apiUrl || "";
            if (!apiUrl) {
                console.warn("Media form: Set data-api-url attribute with your API endpoint.");
                return;
            }
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn?.textContent;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Submitting...";
            }
            try {
                const res = await postFormToApi(form, apiUrl);
                if (res.ok) {
                    const wrapper = document.getElementById("media-form-wrapper");
                    const successEl = document.getElementById("media-form-success");
                    if (wrapper) wrapper.classList.add("hidden");
                    if (successEl) successEl.classList.remove("hidden");
                    form.reset();
                } else {
                    throw new Error(res.statusText || "Request failed");
                }
            } catch (err) {
                console.error("Media form submit error:", err);
                if (submitBtn) submitBtn.textContent = "Submit";
                alert("Could not submit. Please try again later.");
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    if (originalText && submitBtn.textContent !== "Submitted!") submitBtn.textContent = originalText;
                }
            }
        });
    }

    function initFaqAccordion() {
        const triggers = document.querySelectorAll(".faq-trigger");
        triggers.forEach((btn) => {
            btn.addEventListener("click", () => {
                const item = btn.closest(".faq-item");
                const isOpen = item.classList.contains("is-open");
                if (isOpen) {
                    item.classList.remove("is-open");
                    btn.setAttribute("aria-expanded", "false");
                } else {
                    document.querySelectorAll(".faq-item").forEach((i) => {
                        i.classList.remove("is-open");
                        const t = i.querySelector(".faq-trigger");
                        if (t) t.setAttribute("aria-expanded", "false");
                    });
                    item.classList.add("is-open");
                    btn.setAttribute("aria-expanded", "true");
                }
            });
        });
    }

    initHeaderInteractions();
    initHeaderDropdowns();
    initStickyHeader();
    initNavHoverIndicator();
    initHeroDots();
    initHeroParallax();
    initAboutParallax();
    initMediaGalleryParallax();
    initExpoParallax();
    initScrollReveal();
    initStarBorder();
    initViewFilmPopup();
    initContactFormValidation();
    initRegistrationTabs();
    initRegistrationFormValidation();
    initMediaFormValidation();
    initFaqAccordion();
})();
