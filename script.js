const revealElements = document.querySelectorAll('.reveal, .contact-cutout');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('in-view');
      }, index * 100);
    }
  });
}, {
  threshold: 0.18
});

revealElements.forEach(el => observer.observe(el));

const parallaxCards = document.querySelectorAll('.parallax-card');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;

  parallaxCards.forEach(card => {
    const speed = parseFloat(card.dataset.speed);

    const y = scrollY * speed;
    const rotate = Math.min(scrollY * 0.01, 8);

    card.style.transform = `translateY(${y}px) rotateX(${rotate}deg)`;
  });

  updateMarquees(scrollY);
});

const marqueeRows = [
  {
    row: document.querySelector('.marquee-row-1'),
    element: document.querySelector('.marquee-row-1 .track'),
    speed: 0.3,
    direction: 1,
    manualOffset: 0
  },
  {
    row: document.querySelector('.marquee-row-2'),
    element: document.querySelector('.marquee-row-2 .track'),
    speed: 0.45,
    direction: 1,
    manualOffset: 0
  },
  {
    row: document.querySelector('.marquee-row-3'),
    element: document.querySelector('.marquee-row-3 .track'),
    speed: 0.35,
    direction: -1,
    manualOffset: 0
  }
];

marqueeRows.forEach(row => {
  if (row.element) {
    row.element.innerHTML += row.element.innerHTML;
  }
});

function wrap(value, max) {
  return ((value % max) + max) % max;
}

function updateMarquees(scrollY) {
  marqueeRows.forEach(row => {
    if (!row.element) return;
    const width = row.element.scrollWidth / 2;
    const autoMovement = wrap(scrollY * row.speed * row.direction, width);
    const manualMovement = wrap(row.manualOffset || 0, width);
    const movement = wrap(autoMovement + manualMovement, width);

    row.element.style.transform = `translate3d(${-movement}px,0,0)`;
  });
}

function addManualHorizontalMarqueeInteraction() {
  marqueeRows.forEach((row) => {
    if (!row.row || !row.element) return;

    let isDragging = false;
    let startX = 0;
    let startOffset = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let momentumFrame = null;

    const applyManualOffset = (value) => {
      const width = Math.max(1, row.element.scrollWidth / 2);
      row.manualOffset = wrap(value, width);
      updateMarquees(window.scrollY || 0);
    };

    const stopMomentum = () => {
      if (momentumFrame) cancelAnimationFrame(momentumFrame);
      momentumFrame = null;
    };

    const startMomentum = () => {
      stopMomentum();
      const glide = () => {
        velocity *= 0.92;
        if (Math.abs(velocity) < 0.12) {
          momentumFrame = null;
          return;
        }
        applyManualOffset((row.manualOffset || 0) - velocity);
        momentumFrame = requestAnimationFrame(glide);
      };
      momentumFrame = requestAnimationFrame(glide);
    };

    row.row.addEventListener('pointerdown', (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      isDragging = true;
      startX = event.clientX;
      lastX = event.clientX;
      lastTime = performance.now();
      startOffset = row.manualOffset || 0;
      velocity = 0;
      row.row.classList.add('is-manual-dragging');
      stopMomentum();
      row.row.setPointerCapture?.(event.pointerId);
    });

    row.row.addEventListener('pointermove', (event) => {
      if (!isDragging) return;
      const now = performance.now();
      const dx = event.clientX - startX;
      const frameDx = event.clientX - lastX;
      const dt = Math.max(16, now - lastTime);
      velocity = frameDx / dt * 16;
      lastX = event.clientX;
      lastTime = now;
      applyManualOffset(startOffset - dx);
    });

    const endDrag = (event) => {
      if (!isDragging) return;
      isDragging = false;
      row.row.classList.remove('is-manual-dragging');
      row.row.releasePointerCapture?.(event.pointerId);
      startMomentum();
    };

    row.row.addEventListener('pointerup', endDrag);
    row.row.addEventListener('pointercancel', endDrag);
    row.row.addEventListener('lostpointercapture', () => {
      isDragging = false;
      row.row.classList.remove('is-manual-dragging');
    });

    row.row.addEventListener('wheel', (event) => {
      const horizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey;
      if (!horizontalIntent) return;
      event.preventDefault();
      const delta = event.deltaX || event.deltaY;
      stopMomentum();
      applyManualOffset((row.manualOffset || 0) + delta);
    }, { passive: false });
  });
}

addManualHorizontalMarqueeInteraction();

const projectCards = document.querySelectorAll('.sticky-card');

function getAdaptiveProjectStack() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  if (width <= 760) {
    return { offsetStep: Math.max(10, Math.min(18, height * 0.022)), scaleStep: 0.018 };
  }

  if (width <= 1020) {
    return { offsetStep: Math.max(16, Math.min(26, height * 0.028)), scaleStep: 0.022 };
  }

  if (height <= 740) {
    return { offsetStep: Math.max(16, Math.min(22, height * 0.03)), scaleStep: 0.024 };
  }

  if (height <= 840) {
    return { offsetStep: Math.max(20, Math.min(28, height * 0.033)), scaleStep: 0.026 };
  }

  return { offsetStep: 40, scaleStep: 0.03 };
}

function updateProjectStack() {
  const isArchivePage = document.body.classList.contains('projects-page-body');

  if (isArchivePage) {
    projectCards.forEach((card) => {
      card.style.transform = 'translateY(0) scale(1)';
    });
    return;
  }

  const { offsetStep, scaleStep } = getAdaptiveProjectStack();

  projectCards.forEach((card, index) => {
    const offset = index * offsetStep;
    const scale = 1 - (index * scaleStep);

    card.style.transform = `translateY(${offset}px) scale(${scale})`;
  });
}

window.addEventListener('scroll', updateProjectStack, { passive: true });
window.addEventListener('resize', updateProjectStack);
updateProjectStack();

const form = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      const firstInvalidField = form.querySelector(':invalid');

      if (firstInvalidField) {
        firstInvalidField.setCustomValidity(firstInvalidField.dataset.error || 'Please complete this field.');
        firstInvalidField.reportValidity();
      }

      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.textContent : '';

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
      }
      if (formStatus) {
        formStatus.textContent = '';
        formStatus.className = 'form-status';
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Message could not be sent. Please try again.');
      }

      form.reset();
      form.querySelectorAll('input, textarea').forEach((field) => field.setCustomValidity(''));

      if (formStatus) {
        formStatus.textContent = 'Thank you! Your message has been sent successfully.';
        formStatus.classList.add('success');
      }
    } catch (error) {
      if (formStatus) {
        formStatus.textContent = error.message || 'Something went wrong. Please try again later.';
        formStatus.classList.add('error');
      } else {
        alert(error.message || 'Something went wrong. Please try again later.');
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  });
}





/* === Easy project-link manager ===
   Edit only project-links.js to change Figma, live website, or PDF links.
*/
(function setupProjectLinks() {
  const buttons = document.querySelectorAll('[data-project-key]');
  const projectLinks = window.PROJECT_LINKS || {};

  buttons.forEach((button) => {
    const key = button.getAttribute('data-project-key');
    const config = projectLinks[key] || {};
    const label = typeof config === 'string' ? button.textContent : config.label;
    const url = typeof config === 'string' ? config : config.url;

    if (label) button.textContent = label;

    if (typeof url === 'string' && url.trim() && url.trim() !== '#') {
      button.href = url.trim();
      button.target = '_blank';
      button.rel = 'noopener noreferrer';
      button.removeAttribute('aria-disabled');
      button.classList.remove('is-disabled');
      return;
    }

    button.href = '#';
    button.removeAttribute('target');
    button.removeAttribute('rel');
    button.setAttribute('aria-disabled', 'true');
    button.classList.add('is-disabled');
    button.addEventListener('click', (event) => {
      event.preventDefault();
      alert(`Project link is not added yet. Open project-links.js and add the url for: ${key}`);
    });
  });
})();

const footerSmokeName = document.querySelector('.footer-smoke-name');

if (footerSmokeName && window.matchMedia('(pointer: fine)').matches) {
  let previousX = 0;

  footerSmokeName.addEventListener('mousemove', (event) => {
    const rect = footerSmokeName.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const flow = Math.max(-28, Math.min(28, (event.clientX - previousX) * 1.35));

    footerSmokeName.style.setProperty('--smoke-x', `${x}%`);
    footerSmokeName.style.setProperty('--smoke-y', `${y}%`);
    footerSmokeName.style.setProperty('--smoke-flow', `${flow}px`);

    previousX = event.clientX;
  });

  footerSmokeName.addEventListener('mouseleave', () => {
    footerSmokeName.style.setProperty('--smoke-flow', '0px');
  });
}

/* === Final requested usability patch: social placeholders, English validation, smoother hover interactions === */
const socialLinks = {
  linkedin: "PASTE_LINK_HERE",
  facebook: "PASTE_LINK_HERE",
  twitter: "PASTE_LINK_HERE",
  github: "PASTE_LINK_HERE",
  behance: "PASTE_LINK_HERE"
};

window.portfolioSocialLinks = socialLinks;

document.querySelectorAll('[data-social]').forEach((link) => {
  const key = link.dataset.social;
  const url = socialLinks[key];

  if (url && url !== 'PASTE_LINK_HERE') {
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
});

const contactEditorial = document.querySelector('.contact-editorial');

if (contactEditorial && window.matchMedia('(pointer: fine)').matches) {
  let rafId = null;

  contactEditorial.addEventListener('mousemove', (event) => {
    if (rafId) cancelAnimationFrame(rafId);

    rafId = requestAnimationFrame(() => {
      const rect = contactEditorial.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      contactEditorial.style.setProperty('--connect-x', `${x}%`);
      contactEditorial.style.setProperty('--connect-y', `${y}%`);
      contactEditorial.style.setProperty('--connect-opacity', '1');
      contactEditorial.classList.add('is-pointer-active');
    });
  });

  contactEditorial.addEventListener('mouseleave', () => {
    contactEditorial.style.setProperty('--connect-opacity', '0');
    contactEditorial.classList.remove('is-pointer-active');
  });
}

const validatedFields = document.querySelectorAll('#contactForm input[required], #contactForm textarea[required]');

validatedFields.forEach((field) => {
  field.addEventListener('invalid', (event) => {
    event.preventDefault();
    field.setCustomValidity(field.dataset.error || 'Please complete this field.');
    field.reportValidity();
  });

  field.addEventListener('input', () => {
    field.setCustomValidity('');
  });
});

if (footerSmokeName && window.matchMedia('(pointer: fine)').matches) {
  footerSmokeName.addEventListener('mouseenter', () => {
    footerSmokeName.classList.add('is-smoking');
  });

  footerSmokeName.addEventListener('mouseleave', () => {
    footerSmokeName.classList.remove('is-smoking');
  });
}

/* === Device-model adaptive project stack sizing ===
   Calculates a safe card size from the real viewport so every card remains fully
   visible on compact laptops, tablets, phones, desktops, and ultra-wide screens.
   Existing sticky-card interaction is preserved; only responsive values change. */
function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getAdaptiveProjectMetrics() {
  const width = window.innerWidth || document.documentElement.clientWidth;
  const height = window.innerHeight || document.documentElement.clientHeight;
  const cardCount = Math.max(projectCards.length, 1);
  const lastIndex = cardCount - 1;

  let top;
  let offsetStep;
  let scaleStep;
  let widthRatio;
  let widthMax;
  let minHeight;
  let maxHeightCap;
  let headerReserve;

  if (width <= 390) {
    top = clampNumber(height * 0.18, 112, 150);
    offsetStep = clampNumber(height * 0.015, 8, 11);
    scaleStep = 0.010;
    widthRatio = 0.91;
    widthMax = 360;
    minHeight = 248;
    maxHeightCap = 385;
    headerReserve = 78;
  } else if (width <= 760) {
    top = clampNumber(height * 0.18, 118, 156);
    offsetStep = clampNumber(height * 0.017, 9, 13);
    scaleStep = 0.012;
    widthRatio = 0.92;
    widthMax = 560;
    minHeight = 272;
    maxHeightCap = 450;
    headerReserve = 84;
  } else if (width <= 1020) {
    top = clampNumber(height * 0.085, 62, 92);
    offsetStep = clampNumber(height * 0.024, 14, 22);
    scaleStep = 0.018;
    widthRatio = 0.88;
    widthMax = 820;
    minHeight = 330;
    maxHeightCap = 590;
    headerReserve = 98;
  } else if (height <= 700) {
    top = clampNumber(height * 0.062, 42, 58);
    offsetStep = clampNumber(height * 0.023, 13, 18);
    scaleStep = 0.020;
    widthRatio = 0.72;
    widthMax = 900;
    minHeight = 315;
    maxHeightCap = 470;
    headerReserve = 92;
  } else if (height <= 860) {
    top = clampNumber(height * 0.07, 48, 76);
    offsetStep = clampNumber(height * 0.026, 16, 24);
    scaleStep = 0.022;
    widthRatio = 0.74;
    widthMax = 940;
    minHeight = 340;
    maxHeightCap = 540;
    headerReserve = 98;
  } else if (width >= 1700) {
    top = clampNumber(height * 0.09, 84, 122);
    offsetStep = clampNumber(height * 0.035, 32, 44);
    scaleStep = 0.028;
    widthRatio = 0.66;
    widthMax = 1180;
    minHeight = 500;
    maxHeightCap = 760;
    headerReserve = 112;
  } else {
    top = clampNumber(height * 0.09, 74, 112);
    offsetStep = clampNumber(height * 0.033, 24, 38);
    scaleStep = 0.026;
    widthRatio = 0.78;
    widthMax = 1080;
    minHeight = 420;
    maxHeightCap = 720;
    headerReserve = 108;
  }

  const cardWidth = Math.min(width * widthRatio, widthMax, width - (width <= 760 ? 28 : 80));
  const imageRatio = 1400 / 900;
  const naturalHeight = (cardWidth / imageRatio) + headerReserve;
  const lastScale = Math.max(0.82, 1 - (lastIndex * scaleStep));
  const maxOffset = lastIndex * offsetStep;
  const safeBottom = width <= 760 ? 18 : 16;
  const firstSafeHeight = height - top - safeBottom;
  const stackedSafeHeight = (height - top - maxOffset - safeBottom) / lastScale;
  const safeHeight = Math.max(220, Math.min(firstSafeHeight, stackedSafeHeight, maxHeightCap));
  const cardHeight = clampNumber(Math.min(naturalHeight, safeHeight), Math.min(minHeight, safeHeight), safeHeight);

  return {
    top,
    offsetStep,
    scaleStep,
    cardWidth,
    cardHeight
  };
}

function updateProjectStack() {
  const metrics = getAdaptiveProjectMetrics();
  const root = document.documentElement;

  root.style.setProperty('--project-safe-top', `${metrics.top}px`);
  root.style.setProperty('--project-card-width', `${metrics.cardWidth}px`);
  root.style.setProperty('--project-card-height', `${metrics.cardHeight}px`);
  root.style.setProperty('--project-stack-step', `${metrics.offsetStep}px`);
  root.style.setProperty('--project-card-scale-step', `${metrics.scaleStep}`);

  projectCards.forEach((card, index) => {
    const offset = index * metrics.offsetStep;
    const scale = clampNumber(1 - (index * metrics.scaleStep), 0.82, 1);
    card.style.transform = `translate3d(0, ${offset}px, 0) scale(${scale})`;
  });
}

window.addEventListener('orientationchange', () => {
  setTimeout(updateProjectStack, 180);
});

updateProjectStack();

/* ==========================================================
   REAL FINAL PROJECT STICKY CONTROLLER
   Keeps project cards equal to the resume reference card, computes
   sticky top from the real navbar bottom, and keeps added cards flowing
   from below without touching the navbar.
   ========================================================== */
(function finalResumeSizedProjectCards() {
  const cards = Array.from(document.querySelectorAll('.stacked-projects .sticky-card'));
  const stack = document.querySelector('.stacked-projects');
  const projectsSection = document.querySelector('.projects-section');
  const navbar = document.querySelector('.navbar');
  if (!cards.length || !stack || !projectsSection) return;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function updateFinalProjectLayout() {
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const navRect = navbar ? navbar.getBoundingClientRect() : { bottom: 78 };

    // Same visual top gap as the reference screenshot: navbar bottom + safe breathing room.
    const topGap = vw <= 760 ? 18 : 20;
    const safeTop = Math.ceil(navRect.bottom + topGap);

    let cardWidth;
    let cardHeight;
    let offsetStep;
    let scaleStep;

    if (vw <= 390) {
      cardWidth = Math.min(vw * 0.91, 360);
      cardHeight = clamp(vh * 0.64, 350, 420);
      offsetStep = clamp(vh * 0.018, 8, 14);
      scaleStep = 0.012;
    } else if (vw <= 760) {
      cardWidth = Math.min(vw * 0.92, 560);
      cardHeight = clamp(vh * 0.66, 380, 470);
      offsetStep = clamp(vh * 0.02, 10, 18);
      scaleStep = 0.014;
    } else if (vw <= 1020) {
      cardWidth = Math.min(vw * 0.90, 920);
      cardHeight = clamp(vh * 0.62, 440, 508);
      offsetStep = clamp(vh * 0.026, 16, 24);
      scaleStep = 0.019;
    } else {
      // Reference image target: about 920px wide and 508px tall on laptop/desktop.
      cardWidth = Math.min(920, vw * 0.92);
      cardHeight = clamp(vh * 0.66, 500, 508);
      offsetStep = clamp(vh * 0.032, 18, 30);
      scaleStep = 0.022;
    }

    const root = document.documentElement;
    root.style.setProperty('--project-safe-top', `${safeTop}px`);
    root.style.setProperty('--resume-reference-width', `${Math.round(cardWidth)}px`);
    root.style.setProperty('--resume-reference-height', `${Math.round(cardHeight)}px`);
    root.style.setProperty('--project-stack-step', `${offsetStep}px`);
    root.style.setProperty('--project-card-scale-step', `${scaleStep}`);

    cards.forEach((card, index) => {
      const offset = index * offsetStep;
      const scale = clamp(1 - index * scaleStep, 0.84, 1);
      card.style.transform = `translate3d(0, ${offset}px, 0) scale(${scale})`;
    });

    // Natural end point: enough scroll room for every card, no endless blank scroll,
    // and no overlap with the next section.
    const flowGap = vw <= 760 ? clamp(vh * 0.12, 64, 96) : clamp(vh * 0.14, 88, 132);
    const naturalStackHeight = (cards.length * cardHeight) + ((cards.length - 1) * flowGap);
    projectsSection.style.minHeight = `${Math.ceil(safeTop + naturalStackHeight + 180)}px`;
  }

  window.addEventListener('load', updateFinalProjectLayout, { once: true });
  window.addEventListener('resize', updateFinalProjectLayout, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(updateFinalProjectLayout, 180));
  window.addEventListener('scroll', updateFinalProjectLayout, { passive: true });
  updateFinalProjectLayout();
})();

/* ==========================================================
   LAST REQUEST PATCH JS
   - Navbar active indicator for Home/About/Projects/Contact
   - Archive projects page: equal-size sticky cards with top-stack feel only
   ========================================================== */
(function portfolioLastRequestPatch() {
  const navLinks = Array.from(document.querySelectorAll('nav a[data-nav-target]'));

  function setActiveNav(target) {
    navLinks.forEach((link) => {
      const isActive = link.dataset.navTarget === target;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  if (document.body.classList.contains('about-page-body')) {
    setActiveNav('about');
  } else if (document.body.classList.contains('projects-page-body')) {
    setActiveNav('projects');
  } else if (navLinks.length) {
    const sectionIds = ['home', 'about', 'projects', 'contact'];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    function updateActiveFromScroll() {
      const checkpoint = window.scrollY + Math.max(120, window.innerHeight * 0.32);
      let active = 'home';

      sections.forEach((section) => {
        if (section.offsetTop <= checkpoint) active = section.id;
      });

      setActiveNav(active);
    }

    window.addEventListener('scroll', updateActiveFromScroll, { passive: true });
    window.addEventListener('resize', updateActiveFromScroll, { passive: true });
    updateActiveFromScroll();
  }

  function updateArchiveProjectPageStack() {
    if (!document.body.classList.contains('projects-page-body')) return;

    const cards = Array.from(document.querySelectorAll('.projects-archive-stack .sticky-card'));
    const section = document.querySelector('.projects-archive-section');
    const navbar = document.querySelector('.navbar');
    if (!cards.length || !section) return;

    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const navBottom = navbar ? navbar.getBoundingClientRect().bottom : 78;
    const safeTop = Math.ceil(navBottom + (vw <= 760 ? 18 : 22));

    let cardWidth;
    let cardHeight;

    if (vw <= 390) {
      cardWidth = Math.min(vw * 0.91, 360);
      cardHeight = Math.max(350, Math.min(vh * 0.64, 420));
    } else if (vw <= 760) {
      cardWidth = Math.min(vw * 0.92, 560);
      cardHeight = Math.max(380, Math.min(vh * 0.66, 470));
    } else if (vw <= 1020) {
      cardWidth = Math.min(vw * 0.90, 920);
      cardHeight = Math.max(440, Math.min(vh * 0.62, 508));
    } else {
      cardWidth = Math.min(920, vw * 0.92);
      cardHeight = Math.max(500, Math.min(vh * 0.66, 508));
    }

    document.documentElement.style.setProperty('--project-safe-top', `${safeTop}px`);
    document.documentElement.style.setProperty('--resume-reference-width', `${Math.round(cardWidth)}px`);
    document.documentElement.style.setProperty('--resume-reference-height', `${Math.round(cardHeight)}px`);

    const topLayerStep = vw <= 760 ? 5 : 7;
    cards.forEach((card, index) => {
      const layer = Math.min(index, 6) * topLayerStep;
      card.style.top = `${safeTop}px`;
      card.style.width = `${Math.round(cardWidth)}px`;
      card.style.height = `${Math.round(cardHeight)}px`;
      card.style.minHeight = `${Math.round(cardHeight)}px`;
      card.style.transform = `translate3d(0, -${layer}px, 0) scale(1)`;
      card.style.zIndex = String(20 + index);
    });

    const flowGap = vw <= 760 ? Math.max(72, vh * 0.12) : Math.max(104, vh * 0.15);
    section.style.minHeight = `${Math.ceil(safeTop + cards.length * cardHeight + (cards.length - 1) * flowGap + 160)}px`;
  }

  window.addEventListener('load', updateArchiveProjectPageStack, { once: true });
  window.addEventListener('scroll', updateArchiveProjectPageStack, { passive: true });
  window.addEventListener('resize', updateArchiveProjectPageStack, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(updateArchiveProjectPageStack, 180));
  updateArchiveProjectPageStack();
})();

/* ==========================================================
   PROJECTS PAGE ONLY: arrow project showcase
   This runs only on projects.html and does not touch the home page.
   ========================================================== */
(function dedicatedProjectsPageArrowShowcase() {
  if (!document.body.classList.contains('projects-page-body')) return;

  const showcase = document.querySelector('[data-project-showcase]');
  if (!showcase) return;

  const slides = Array.from(showcase.querySelectorAll('.project-slide'));
  const prevButton = showcase.querySelector('[data-project-prev]');
  const nextButton = showcase.querySelector('[data-project-next]');
  const currentEl = showcase.querySelector('[data-project-current]');
  const totalEl = showcase.querySelector('[data-project-total]');
  if (!slides.length) return;

  let activeIndex = 0;

  function formatNumber(number) {
    return String(number).padStart(2, '0');
  }

  function renderSlides() {
    slides.forEach((slide, index) => {
      slide.classList.remove('is-active', 'is-before', 'is-after');

      if (index === activeIndex) {
        slide.classList.add('is-active');
        slide.removeAttribute('aria-hidden');
      } else if (index < activeIndex) {
        slide.classList.add('is-before');
        slide.setAttribute('aria-hidden', 'true');
      } else {
        slide.classList.add('is-after');
        slide.setAttribute('aria-hidden', 'true');
      }
    });

    if (currentEl) currentEl.textContent = formatNumber(activeIndex + 1);
    if (totalEl) totalEl.textContent = formatNumber(slides.length);
  }

  function goToSlide(nextIndex) {
    activeIndex = (nextIndex + slides.length) % slides.length;
    renderSlides();
  }

  prevButton?.addEventListener('click', () => goToSlide(activeIndex - 1));
  nextButton?.addEventListener('click', () => goToSlide(activeIndex + 1));

  window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') goToSlide(activeIndex - 1);
    if (event.key === 'ArrowRight') goToSlide(activeIndex + 1);
  });

  let startX = 0;
  let pointerIsDown = false;

  showcase.addEventListener('pointerdown', (event) => {
    pointerIsDown = true;
    startX = event.clientX;
    showcase.setPointerCapture?.(event.pointerId);
  });

  showcase.addEventListener('pointerup', (event) => {
    if (!pointerIsDown) return;
    pointerIsDown = false;
    const distance = event.clientX - startX;

    if (Math.abs(distance) > 60) {
      if (distance < 0) goToSlide(activeIndex + 1);
      else goToSlide(activeIndex - 1);
    }
  });

  showcase.addEventListener('pointercancel', () => {
    pointerIsDown = false;
  });

  renderSlides();
})();

/* ==========================================================
   FINAL PROJECTS PAGE ARROW CLICK FIX
   Scope: projects.html only. Keeps home page untouched.
   Ensures mouse clicks on left/right arrows work reliably.
   ========================================================== */
(function finalProjectsPageArrowClickFix() {
  if (!document.body.classList.contains('projects-page-body')) return;

  const showcase = document.querySelector('[data-project-showcase]');
  if (!showcase) return;

  const slides = Array.from(showcase.querySelectorAll('.project-slide'));
  const prevButton = showcase.querySelector('[data-project-prev]');
  const nextButton = showcase.querySelector('[data-project-next]');
  const currentEl = showcase.querySelector('[data-project-current]');
  const totalEl = showcase.querySelector('[data-project-total]');
  if (!slides.length || !prevButton || !nextButton) return;

  let activeIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));

  function formatProjectNumber(value) {
    return String(value).padStart(2, '0');
  }

  function renderProjectSlide() {
    slides.forEach((slide, index) => {
      slide.classList.remove('is-active', 'is-before', 'is-after');

      if (index === activeIndex) {
        slide.classList.add('is-active');
        slide.removeAttribute('aria-hidden');
      } else if (index < activeIndex) {
        slide.classList.add('is-before');
        slide.setAttribute('aria-hidden', 'true');
      } else {
        slide.classList.add('is-after');
        slide.setAttribute('aria-hidden', 'true');
      }
    });

    if (currentEl) currentEl.textContent = formatProjectNumber(activeIndex + 1);
    if (totalEl) totalEl.textContent = formatProjectNumber(slides.length);
  }

  function changeProject(direction) {
    activeIndex = (activeIndex + direction + slides.length) % slides.length;
    renderProjectSlide();
  }

  // Capture-phase click handling prevents any drag/swipe handler from swallowing button clicks.
  document.addEventListener('click', (event) => {
    const prev = event.target.closest('[data-project-prev]');
    const next = event.target.closest('[data-project-next]');
    if (!prev && !next) return;
    if (!showcase.contains(prev || next)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    changeProject(next ? 1 : -1);
  }, true);

  // Also support pointer/touch activation for devices that do not consistently emit click after drag zones.
  [prevButton, nextButton].forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
    }, true);
  });

  renderProjectSlide();
})();

/* REAL FINAL PATCH: keep dedicated About page active in navbar without touching other behavior. */
(function markProfessionalAboutPageActive() {
  if (!document.body.classList.contains('professional-about-page')) return;
  document.querySelectorAll('nav a[data-nav-target]').forEach((link) => {
    link.classList.toggle('is-active', link.dataset.navTarget === 'about');
  });
})();


/* About Me floating cutout scroll reveal — scoped only to the home About section */
(function initAboutCutoutScrollReveal() {
  const aboutSection = document.querySelector('#about.about-section');
  const cutouts = Array.from(document.querySelectorAll('#about .about-floating-cutout'));

  if (!aboutSection || !cutouts.length) return;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  let ticking = false;

  function updateAboutCutouts() {
    ticking = false;

    const rect = aboutSection.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight || 1;

    /* Slower scroll-linked progress: starts just before the About section enters
       and finishes later, so the slide-in is clearly visible while scrolling. */
    const start = vh * 1.04;
    const end = vh * 0.02;
    const rawProgress = (start - rect.top) / Math.max(1, start - end);
    const progress = clamp(rawProgress, 0, 1);
    const eased = progress * progress * (3 - 2 * progress);

    cutouts.forEach((cutout, index) => {
      const fromLeft = cutout.classList.contains('about-cutout-left');
      const direction = fromLeft ? -1 : 1;

      const offscreenDistance = Math.max(260, window.innerWidth * 0.48);
      const x = direction * (offscreenDistance * (1 - eased));

      /* Very subtle scroll-linked vertical drift for cinematic/parallax feel. */
      const floatBase = index % 2 === 0 ? -1 : 1;
      const y = floatBase * (1 - eased) * 42 + Math.sin((progress + index * 0.18) * Math.PI) * 10;
      const rotate = direction * (1 - eased) * 7 + floatBase * eased * 1.2;
      const scale = 1.50 + eased * 0.15;

      cutout.style.opacity = String(clamp((progress - 0.08) / 0.72, 0, 1));
      cutout.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${scale})`;
    });
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateAboutCutouts);
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  window.addEventListener('load', updateAboutCutouts);
  updateAboutCutouts();
})();
