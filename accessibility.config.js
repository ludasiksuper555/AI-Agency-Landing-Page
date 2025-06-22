/**
 * Enhanced Team Portfolio - Accessibility Configuration
 * WCAG 2.1 AA compliance and accessibility best practices
 */

const accessibilityConfig = {
  // =============================================================================
  // WCAG 2.1 COMPLIANCE SETTINGS
  // =============================================================================

  wcag: {
    // Compliance level: A, AA, AAA
    level: 'AA',
    version: '2.1',

    // Principle 1: Perceivable
    perceivable: {
      // 1.1 Text Alternatives
      textAlternatives: {
        // All images must have alt text
        requireAltText: true,
        // Decorative images should have empty alt
        decorativeImagesEmptyAlt: true,
        // Complex images should have detailed descriptions
        complexImagesLongDesc: true,
      },

      // 1.2 Time-based Media
      timeBased: {
        // Captions for videos
        videoCaptions: true,
        // Audio descriptions for videos
        audioDescriptions: true,
        // Transcripts for audio
        audioTranscripts: true,
      },

      // 1.3 Adaptable
      adaptable: {
        // Semantic HTML structure
        semanticStructure: true,
        // Meaningful sequence
        meaningfulSequence: true,
        // Sensory characteristics
        avoidSensoryOnly: true,
      },

      // 1.4 Distinguishable
      distinguishable: {
        // Color contrast ratios
        colorContrast: {
          normal: 4.5, // AA standard
          large: 3.0, // AA standard for large text
          enhanced: 7.0, // AAA standard
        },
        // Audio control
        audioControl: true,
        // Resize text up to 200%
        textResize: 200,
        // Images of text
        avoidImagesOfText: true,
        // Reflow content
        reflow: true,
        // Non-text contrast
        nonTextContrast: 3.0,
        // Text spacing
        textSpacing: true,
        // Content on hover/focus
        hoverFocusContent: true,
      },
    },

    // Principle 2: Operable
    operable: {
      // 2.1 Keyboard Accessible
      keyboard: {
        // All functionality available via keyboard
        keyboardAccessible: true,
        // No keyboard trap
        noKeyboardTrap: true,
        // Character key shortcuts
        characterKeyShortcuts: true,
      },

      // 2.2 Enough Time
      timing: {
        // Timing adjustable
        timingAdjustable: true,
        // Pause, stop, hide
        pauseStopHide: true,
        // No timing
        noTiming: true,
        // Interruptions
        interruptions: true,
        // Re-authenticating
        reauthenticating: true,
        // Timeouts
        timeouts: true,
      },

      // 2.3 Seizures and Physical Reactions
      seizures: {
        // Three flashes or below threshold
        flashThreshold: true,
        // Three flashes
        threeFlashes: true,
        // Animation from interactions
        animationFromInteractions: true,
      },

      // 2.4 Navigable
      navigable: {
        // Bypass blocks
        bypassBlocks: true,
        // Page titled
        pageTitled: true,
        // Focus order
        focusOrder: true,
        // Link purpose in context
        linkPurpose: true,
        // Multiple ways
        multipleWays: true,
        // Headings and labels
        headingsAndLabels: true,
        // Focus visible
        focusVisible: true,
      },

      // 2.5 Input Modalities
      inputModalities: {
        // Pointer gestures
        pointerGestures: true,
        // Pointer cancellation
        pointerCancellation: true,
        // Label in name
        labelInName: true,
        // Motion actuation
        motionActuation: true,
        // Target size
        targetSize: 44, // Minimum 44x44 pixels
        // Concurrent input mechanisms
        concurrentInput: true,
      },
    },

    // Principle 3: Understandable
    understandable: {
      // 3.1 Readable
      readable: {
        // Language of page
        pageLanguage: true,
        // Language of parts
        partsLanguage: true,
        // Unusual words
        unusualWords: true,
        // Abbreviations
        abbreviations: true,
        // Reading level
        readingLevel: true,
        // Pronunciation
        pronunciation: true,
      },

      // 3.2 Predictable
      predictable: {
        // On focus
        onFocus: true,
        // On input
        onInput: true,
        // Consistent navigation
        consistentNavigation: true,
        // Consistent identification
        consistentIdentification: true,
        // Change on request
        changeOnRequest: true,
      },

      // 3.3 Input Assistance
      inputAssistance: {
        // Error identification
        errorIdentification: true,
        // Labels or instructions
        labelsOrInstructions: true,
        // Error suggestion
        errorSuggestion: true,
        // Error prevention (legal, financial, data)
        errorPrevention: true,
        // Help
        help: true,
        // Error prevention (all)
        errorPreventionAll: true,
      },
    },

    // Principle 4: Robust
    robust: {
      // 4.1 Compatible
      compatible: {
        // Parsing
        parsing: true,
        // Name, role, value
        nameRoleValue: true,
        // Status messages
        statusMessages: true,
      },
    },
  },

  // =============================================================================
  // ARIA (Accessible Rich Internet Applications) SETTINGS
  // =============================================================================

  aria: {
    // ARIA landmarks
    landmarks: {
      banner: 'header[role="banner"]',
      navigation: 'nav[role="navigation"]',
      main: 'main[role="main"]',
      complementary: 'aside[role="complementary"]',
      contentinfo: 'footer[role="contentinfo"]',
      search: '[role="search"]',
      form: 'form[role="form"]',
      region: '[role="region"]',
    },

    // ARIA attributes validation
    attributes: {
      // Required ARIA attributes
      required: [
        'aria-label',
        'aria-labelledby',
        'aria-describedby',
        'aria-expanded',
        'aria-hidden',
        'aria-live',
        'aria-atomic',
        'aria-relevant',
      ],

      // ARIA states and properties
      states: [
        'aria-checked',
        'aria-disabled',
        'aria-expanded',
        'aria-hidden',
        'aria-invalid',
        'aria-pressed',
        'aria-readonly',
        'aria-required',
        'aria-selected',
      ],

      // ARIA properties
      properties: [
        'aria-atomic',
        'aria-autocomplete',
        'aria-controls',
        'aria-describedby',
        'aria-dropeffect',
        'aria-flowto',
        'aria-grabbed',
        'aria-haspopup',
        'aria-label',
        'aria-labelledby',
        'aria-level',
        'aria-live',
        'aria-multiline',
        'aria-multiselectable',
        'aria-orientation',
        'aria-owns',
        'aria-posinset',
        'aria-relevant',
        'aria-setsize',
        'aria-sort',
        'aria-valuemax',
        'aria-valuemin',
        'aria-valuenow',
        'aria-valuetext',
      ],
    },

    // Live regions
    liveRegions: {
      polite: 'aria-live="polite"',
      assertive: 'aria-live="assertive"',
      off: 'aria-live="off"',
      atomic: 'aria-atomic="true"',
      relevant: {
        additions: 'aria-relevant="additions"',
        removals: 'aria-relevant="removals"',
        text: 'aria-relevant="text"',
        all: 'aria-relevant="all"',
      },
    },
  },

  // =============================================================================
  // KEYBOARD NAVIGATION
  // =============================================================================

  keyboard: {
    // Tab order
    tabOrder: {
      // Skip links
      skipLinks: {
        enabled: true,
        targets: ['#main-content', '#navigation', '#search'],
        text: {
          mainContent: 'Skip to main content',
          navigation: 'Skip to navigation',
          search: 'Skip to search',
        },
      },

      // Focus management
      focusManagement: {
        // Focus indicators
        focusIndicators: {
          enabled: true,
          style: {
            outline: '2px solid #005fcc',
            outlineOffset: '2px',
            borderRadius: '4px',
          },
        },

        // Focus trap for modals
        focusTrap: {
          enabled: true,
          returnFocus: true,
          initialFocus: 'first',
        },

        // Roving tabindex
        rovingTabindex: {
          enabled: true,
          groups: ['menu', 'toolbar', 'grid', 'listbox'],
        },
      },
    },

    // Keyboard shortcuts
    shortcuts: {
      // Global shortcuts
      global: {
        'Alt+1': 'Go to main content',
        'Alt+2': 'Go to navigation',
        'Alt+3': 'Go to search',
        'Alt+H': 'Go to homepage',
        'Alt+C': 'Go to contact',
        Escape: 'Close modal/dropdown',
      },

      // Component-specific shortcuts
      components: {
        modal: {
          Escape: 'Close modal',
          Tab: 'Navigate forward',
          'Shift+Tab': 'Navigate backward',
        },
        dropdown: {
          Escape: 'Close dropdown',
          ArrowDown: 'Next option',
          ArrowUp: 'Previous option',
          Enter: 'Select option',
          Space: 'Select option',
        },
        carousel: {
          ArrowLeft: 'Previous slide',
          ArrowRight: 'Next slide',
          Home: 'First slide',
          End: 'Last slide',
        },
      },
    },
  },

  // =============================================================================
  // SCREEN READER SUPPORT
  // =============================================================================

  screenReader: {
    // Announcements
    announcements: {
      // Page changes
      pageChanges: {
        enabled: true,
        delay: 100, // ms
        message: 'Page content updated',
      },

      // Form validation
      formValidation: {
        enabled: true,
        success: 'Form submitted successfully',
        error: 'Please correct the errors below',
      },

      // Loading states
      loading: {
        enabled: true,
        start: 'Loading content',
        end: 'Content loaded',
      },

      // Search results
      searchResults: {
        enabled: true,
        template: '{count} results found for "{query}"',
        noResults: 'No results found for "{query}"',
      },
    },

    // Screen reader only content
    srOnly: {
      className: 'sr-only',
      style: {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0',
      },
    },

    // Alternative text guidelines
    altText: {
      // Decorative images
      decorative: '',

      // Informative images
      informative: {
        template: '{description}',
        maxLength: 125,
      },

      // Functional images
      functional: {
        template: '{action} {description}',
        examples: {
          button: 'Click to {action}',
          link: 'Go to {destination}',
        },
      },

      // Complex images
      complex: {
        useAriaDescribedby: true,
        provideLongDescription: true,
      },
    },
  },

  // =============================================================================
  // COLOR AND CONTRAST
  // =============================================================================

  colorContrast: {
    // Contrast ratios
    ratios: {
      // WCAG AA
      aa: {
        normal: 4.5,
        large: 3.0,
      },
      // WCAG AAA
      aaa: {
        normal: 7.0,
        large: 4.5,
      },
    },

    // Color palette accessibility
    palette: {
      // Primary colors with sufficient contrast
      primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#dc004e',
        light: '#ff5983',
        dark: '#9a0036',
        contrastText: '#ffffff',
      },
      // Status colors
      success: {
        main: '#2e7d32',
        light: '#4caf50',
        dark: '#1b5e20',
        contrastText: '#ffffff',
      },
      warning: {
        main: '#ed6c02',
        light: '#ff9800',
        dark: '#e65100',
        contrastText: '#ffffff',
      },
      error: {
        main: '#d32f2f',
        light: '#f44336',
        dark: '#c62828',
        contrastText: '#ffffff',
      },
      info: {
        main: '#0288d1',
        light: '#03a9f4',
        dark: '#01579b',
        contrastText: '#ffffff',
      },
    },

    // Color blindness considerations
    colorBlindness: {
      // Don't rely solely on color
      usePatterns: true,
      useIcons: true,
      useText: true,

      // Color combinations to avoid
      avoidCombinations: [
        ['red', 'green'],
        ['blue', 'purple'],
        ['green', 'brown'],
      ],
    },
  },

  // =============================================================================
  // RESPONSIVE DESIGN & MOBILE ACCESSIBILITY
  // =============================================================================

  responsive: {
    // Touch targets
    touchTargets: {
      minSize: 44, // pixels
      spacing: 8, // pixels between targets

      // Touch target guidelines
      guidelines: {
        buttons: 44,
        links: 44,
        formControls: 44,
        icons: 44,
      },
    },

    // Viewport settings
    viewport: {
      // Zoom and scale
      allowZoom: true,
      maxScale: 5.0,
      minScale: 1.0,
      userScalable: true,

      // Responsive breakpoints
      breakpoints: {
        mobile: 320,
        tablet: 768,
        desktop: 1024,
        wide: 1440,
      },
    },

    // Mobile-specific accessibility
    mobile: {
      // Orientation support
      orientation: {
        portrait: true,
        landscape: true,
        lockPrevention: true,
      },

      // Gesture support
      gestures: {
        swipe: true,
        pinch: true,
        tap: true,
        doubleTap: false, // Can interfere with zoom
      },
    },
  },

  // =============================================================================
  // TESTING AND VALIDATION
  // =============================================================================

  testing: {
    // Automated testing tools
    tools: {
      // axe-core configuration
      axe: {
        enabled: true,
        rules: {
          // Enable all WCAG 2.1 AA rules
          wcag2a: true,
          wcag2aa: true,
          wcag21aa: true,

          // Additional best practices
          'best-practice': true,

          // Experimental rules
          experimental: false,
        },
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
        exclude: [],
        include: [],
      },

      // Lighthouse accessibility audit
      lighthouse: {
        enabled: true,
        threshold: 90, // Minimum score
        categories: ['accessibility'],
      },

      // Pa11y configuration
      pa11y: {
        enabled: true,
        standard: 'WCAG2AA',
        ignore: [],
        hideElements: [],
      },
    },

    // Manual testing checklist
    manual: {
      keyboard: [
        'Tab through all interactive elements',
        'Use arrow keys for navigation',
        'Test keyboard shortcuts',
        'Verify focus indicators',
        'Check focus order',
      ],
      screenReader: [
        'Test with NVDA/JAWS/VoiceOver',
        'Verify heading structure',
        'Check alt text',
        'Test form labels',
        'Verify live regions',
      ],
      visual: [
        'Check color contrast',
        'Test at 200% zoom',
        'Verify without color',
        'Test in high contrast mode',
        'Check text spacing',
      ],
      mobile: [
        'Test touch targets',
        'Verify orientation support',
        'Check zoom functionality',
        'Test with voice control',
        'Verify gesture support',
      ],
    },
  },

  // =============================================================================
  // ACCESSIBILITY UTILITIES
  // =============================================================================

  utils: {
    // Generate accessible IDs
    generateId: (prefix = 'a11y') => {
      return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    },

    // Check color contrast
    checkContrast: (foreground, background) => {
      // Convert hex to RGB
      const hexToRgb = hex => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : null;
      };

      // Calculate relative luminance
      const getLuminance = rgb => {
        const { r, g, b } = rgb;
        const [rs, gs, bs] = [r, g, b].map(c => {
          c = c / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      };

      const fgRgb = hexToRgb(foreground);
      const bgRgb = hexToRgb(background);

      if (!fgRgb || !bgRgb) return null;

      const fgLum = getLuminance(fgRgb);
      const bgLum = getLuminance(bgRgb);

      const ratio = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);

      return {
        ratio: Math.round(ratio * 100) / 100,
        aa: ratio >= 4.5,
        aaa: ratio >= 7.0,
        aaLarge: ratio >= 3.0,
        aaaLarge: ratio >= 4.5,
      };
    },

    // Announce to screen readers
    announce: (message, priority = 'polite') => {
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', priority);
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';

      document.body.appendChild(announcer);
      announcer.textContent = message;

      setTimeout(() => {
        document.body.removeChild(announcer);
      }, 1000);
    },

    // Focus management
    focusManagement: {
      // Set focus to element
      setFocus: (element, options = {}) => {
        if (typeof element === 'string') {
          element = document.querySelector(element);
        }

        if (element && typeof element.focus === 'function') {
          element.focus(options);
        }
      },

      // Get focusable elements
      getFocusableElements: (container = document) => {
        const focusableSelectors = [
          'a[href]',
          'button:not([disabled])',
          'input:not([disabled])',
          'select:not([disabled])',
          'textarea:not([disabled])',
          '[tabindex]:not([tabindex="-1"])',
          '[contenteditable="true"]',
        ].join(', ');

        return Array.from(container.querySelectorAll(focusableSelectors)).filter(el => {
          return (
            el.offsetWidth > 0 &&
            el.offsetHeight > 0 &&
            getComputedStyle(el).visibility !== 'hidden'
          );
        });
      },

      // Create focus trap
      createFocusTrap: container => {
        const focusableElements =
          accessibilityConfig.utils.focusManagement.getFocusableElements(container);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTabKey = e => {
          if (e.key === 'Tab') {
            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
              }
            } else {
              if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
              }
            }
          }
        };

        container.addEventListener('keydown', handleTabKey);

        return {
          activate: () => firstElement?.focus(),
          deactivate: () => container.removeEventListener('keydown', handleTabKey),
        };
      },
    },

    // ARIA helpers
    aria: {
      // Set ARIA attributes
      setAttributes: (element, attributes) => {
        Object.entries(attributes).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });
      },

      // Toggle ARIA expanded
      toggleExpanded: element => {
        const expanded = element.getAttribute('aria-expanded') === 'true';
        element.setAttribute('aria-expanded', !expanded);
        return !expanded;
      },

      // Set ARIA live region
      setLiveRegion: (element, politeness = 'polite', atomic = true) => {
        element.setAttribute('aria-live', politeness);
        element.setAttribute('aria-atomic', atomic);
      },
    },

    // Validation helpers
    validate: {
      // Check if element has accessible name
      hasAccessibleName: element => {
        return !!(
          element.getAttribute('aria-label') ||
          element.getAttribute('aria-labelledby') ||
          element.textContent.trim() ||
          element.getAttribute('title') ||
          element.getAttribute('alt')
        );
      },

      // Check if form control has label
      hasLabel: input => {
        const id = input.getAttribute('id');
        const ariaLabelledby = input.getAttribute('aria-labelledby');
        const ariaLabel = input.getAttribute('aria-label');

        return !!(
          ariaLabel ||
          ariaLabelledby ||
          (id && document.querySelector(`label[for="${id}"]`)) ||
          input.closest('label')
        );
      },

      // Check heading structure
      checkHeadingStructure: () => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        const issues = [];

        if (headings.length === 0) {
          issues.push('No headings found');
          return issues;
        }

        const firstHeading = headings[0];
        if (firstHeading.tagName !== 'H1') {
          issues.push('First heading is not H1');
        }

        for (let i = 1; i < headings.length; i++) {
          const current = parseInt(headings[i].tagName.charAt(1));
          const previous = parseInt(headings[i - 1].tagName.charAt(1));

          if (current > previous + 1) {
            issues.push(
              `Heading level skipped: ${headings[i - 1].tagName} to ${headings[i].tagName}`
            );
          }
        }

        return issues;
      },
    },
  },
};

// Export configuration
module.exports = accessibilityConfig;

// Export for ES modules
module.exports.default = accessibilityConfig;
