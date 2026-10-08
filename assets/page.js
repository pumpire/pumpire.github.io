(() => {
    "use strict";

    const metricsToggle = document.querySelector(".metrics-toggle-text");
    const metricsPanel = document.querySelector("#proposed-metrics");
    if (metricsToggle && metricsPanel) {
        metricsPanel.hidden = true;
        metricsToggle.setAttribute("role", "button");
        metricsToggle.setAttribute("aria-expanded", "false");
        metricsToggle.addEventListener("click", (event) => {
            event.preventDefault();
            metricsPanel.hidden = !metricsPanel.hidden;
            metricsToggle.setAttribute("aria-expanded", String(!metricsPanel.hidden));
        });
        metricsToggle.addEventListener("keydown", (event) => {
            if (event.key === " ") {
                event.preventDefault();
                metricsToggle.click();
            }
        });
    }

    const resourceLinks = document.querySelectorAll("[data-resource]");
    resourceLinks.forEach((link) => {
        const url = (window.PUMPIRE_LINKS?.[link.dataset.resource] || "").trim();
        if (!url) return;
        link.href = url;
        link.removeAttribute("aria-disabled");
        link.removeAttribute("title");
        link.target = "_blank";
        link.rel = "noopener noreferrer";
    });

    document.querySelectorAll(".results-carousel").forEach((carousel) => {
        const slides = [...carousel.querySelectorAll("[data-slide]")];
        const previousButton = carousel.querySelector(".previous");
        const nextButton = carousel.querySelector(".next");
        const footer = carousel.nextElementSibling;
        const controls = footer.querySelectorAll("[data-goto]");
        const status = footer.querySelector(".carousel-status");
        const itemLabel = carousel.dataset.itemLabel || "Table";
        let current = 0;

        function showSlide(index, announce = true) {
            const focusedArrow = [previousButton, nextButton].includes(document.activeElement)
                ? document.activeElement : null;
            current = (index + slides.length) % slides.length;
            slides.forEach((slide, i) => {
                slide.hidden = i !== current;
                slide.setAttribute("role", "group");
                slide.setAttribute("aria-roledescription", "slide");
                slide.setAttribute("aria-label", `${i + 1} of ${slides.length}`);
            });
            controls.forEach((control) => {
                const active = Number(control.dataset.goto) === current;
                if (active) {
                    control.setAttribute("aria-current", "true");
                } else {
                    control.removeAttribute("aria-current");
                }
            });
            const heading = slides[current].querySelector(".slide-heading");
            heading.prepend(previousButton);
            heading.append(nextButton);
            if (focusedArrow) focusedArrow.focus({ preventScroll: true });
            const figureImage = slides[current].querySelector("img");
            if (figureImage) figureImage.loading = "eager";
            if (announce) status.textContent = `${itemLabel} ${current + 1} of ${slides.length}: ${slides[current].querySelector("h3").textContent}`;
        }

        if (slides.length) {
            carousel.classList.add("carousel-ready");
            [previousButton, nextButton, footer].forEach((element) => { element.hidden = false; });
            controls.forEach((control) => control.addEventListener("click", () => showSlide(Number(control.dataset.goto))));
            previousButton.addEventListener("click", () => showSlide(current - 1));
            nextButton.addEventListener("click", () => showSlide(current + 1));
            carousel.addEventListener("keydown", (event) => {
                // Keep arrow keys available for horizontal scrolling inside the table.
                if (event.target.closest(".table-scroll")) return;
                const actions = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: slides.length - 1 };
                if (Object.hasOwn(actions, event.key)) {
                    event.preventDefault();
                    showSlide(actions[event.key]);
                }
            });
            let touchStart = null;
            carousel.addEventListener("touchstart", (event) => {
                touchStart = event.target.closest(".table-scroll") || event.touches.length !== 1
                    ? null : { x: event.touches[0].clientX, y: event.touches[0].clientY };
            }, { passive: true });
            carousel.addEventListener("touchend", (event) => {
                if (!touchStart || !event.changedTouches.length) return;
                const dx = event.changedTouches[0].clientX - touchStart.x;
                const dy = event.changedTouches[0].clientY - touchStart.y;
                if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5) showSlide(current + (dx < 0 ? 1 : -1));
                touchStart = null;
            }, { passive: true });
            carousel.addEventListener("touchcancel", () => { touchStart = null; }, { passive: true });
            showSlide(0, false);
        }
    });

    const dialog = document.querySelector(".figure-dialog");
    const enlargedImage = dialog.querySelector("img");
    if (typeof dialog.showModal === "function") {
        document.querySelectorAll("[data-lightbox]").forEach((link) => {
            link.addEventListener("click", (event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                enlargedImage.src = link.href;
                enlargedImage.alt = link.querySelector("img").alt;
                dialog.querySelector(".dialog-caption").textContent = link.dataset.caption
                    || link.closest("figure").querySelector("figcaption").textContent;
                dialog.showModal();
                dialog.querySelector(".dialog-image-scroll").scrollTo(0, 0);
                document.body.classList.add("dialog-open");
            });
        });
        dialog.addEventListener("click", (event) => {
            if (event.target !== dialog) return;
            const bounds = dialog.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
        });
        dialog.addEventListener("close", () => document.body.classList.remove("dialog-open"));
    }

})();
