/** @type {import('tailwindcss').Config} */
const config = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: ["class", ".dark"],
    theme: {
        extend: {},
    },
    plugins: [],
};

export default config;
