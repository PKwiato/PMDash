export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                "background": "var(--color-background)",
                "on-background": "var(--color-on-background)",
                "surface": "var(--color-surface)",
                "on-surface": "var(--color-on-surface)",
                "surface-variant": "var(--color-surface-variant)",
                "on-surface-variant": "var(--color-on-surface-variant)",
                "primary": "var(--color-primary)",
                "on-primary": "var(--color-on-primary)",
                "primary-container": "var(--color-primary-container)",
                "on-primary-container": "var(--color-on-primary-container)",
                "secondary": "var(--color-secondary)",
                "on-secondary": "var(--color-on-secondary)",
                "secondary-container": "var(--color-secondary-container)",
                "on-secondary-container": "var(--color-on-secondary-container)",
                "tertiary": "var(--color-tertiary)",
                "on-tertiary": "var(--color-on-tertiary)",
                "error": "var(--color-error)",
                "on-error": "var(--color-on-error)",
                "error-container": "var(--color-error-container)",
                "on-error-container": "var(--color-on-error-container)",
                "outline": "var(--color-outline)",
                "outline-variant": "var(--color-outline-variant)",
                "inverse-surface": "var(--color-inverse-surface)",
                "inverse-on-surface": "var(--color-inverse-on-surface)",
                "surface-dim": "var(--color-surface-dim)",
                "surface-bright": "var(--color-surface-bright)",
                "surface-container-lowest": "var(--color-surface-container-lowest)",
                "surface-container-low": "var(--color-surface-container-low)",
                "surface-container": "var(--color-surface-container)",
                "surface-container-high": "var(--color-surface-container-high)",
                "surface-container-highest": "var(--color-surface-container-highest)",
            },
            borderRadius: {
                "DEFAULT": "0.125rem",
                "lg": "0.25rem",
                "xl": "0.5rem",
                "full": "0.75rem"
            },
            spacing: {
                "lg": "24px",
                "sm": "8px",
                "margin": "24px",
                "xl": "32px",
                "xs": "4px",
                "unit": "4px",
                "md": "16px",
                "gutter": "16px"
            },
            fontSize: {
                "headline-xl": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                "label-sm": ["11px", {"lineHeight": "14px", "letterSpacing": "0.03em", "fontWeight": "500"}],
                "headline-md": ["20px", {"lineHeight": "28px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                "body-sm": ["13px", {"lineHeight": "18px", "letterSpacing": "0", "fontWeight": "400"}],
                "headline-lg": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                "body-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0", "fontWeight": "400"}],
                "label-md": ["12px", {"lineHeight": "16px", "letterSpacing": "0.02em", "fontWeight": "600"}],
                "body-lg": ["16px", {"lineHeight": "24px", "letterSpacing": "0", "fontWeight": "400"}]
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
