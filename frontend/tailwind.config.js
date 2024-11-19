/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--hot-fair-color-primary)",
        secondary: "var(--hot-fair-color-secondary)",
        dark: "var(--hot-fair-color-dark)",
        gray: "var(--hot-fair-color-gray)",
        "light-gray": "var(--hot-fair-color-light-gray)",
        "off-white": "var(--hot-fair-color-off-white)",
        "gray-disabled": "var(--hot-fair-color-gray-disabled)",
        "gray-border": "var(--hot-fair-color-gray-border)",
        "hover-accent": "var( --hot-fair-color-hover-accent)",
        "green-secondary": "var(--hot-fair-color-green-secondary)",
        "green-primary": "var(--hot-fair-color-green-primary)",
      },
      fontFamily: {
        archivo: "var(--sl-font-sans)",
      },
      fontSize: {
        "large-title": "var(--hot-fair-font-size-large-title)",
        "title-1": "var(--hot-fair-font-size-title-1)",
        "title-2": "var(--hot-fair-font-size-title-2)",
        "title-3": "var(--hot-fair-font-size-title-3)",
        "body-1": "var(--hot-fair-font-size-body-text-1)",
        "body-2": "var(--hot-fair-font-size-body-text-2)",
        "body-2base": "var(--hot-fair-font-size-body-text-2base)",
        "body-3": "var(--hot-fair-font-size-body-text-3)",
        "body-4": "var(--hot-fair-font-size-body-text-4)",
      },
      fontWeight: {
        regular: "var(--hot-fair-font-weight-regular)",
        medium: "var(--hot-fair-font-weight-medium)",
        bold: "var(--hot-fair-font-weight-bold)",
        semibold: "var(--hot-fair-font-weight-semibold)",
      },
      screens: {
        mdx: "960px",
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
