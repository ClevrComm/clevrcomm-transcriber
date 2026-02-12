import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        console.log("ThemeToggle mounted. Checking initial state...");
        // Check initial preference
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            document.documentElement.style.colorScheme = 'dark';
            setIsDark(true);
            console.log("Initial: Dark mode set.");
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.style.colorScheme = 'light';
            setIsDark(false);
            console.log("Initial: Light mode set.");
        }
    }, []);

    const toggleTheme = () => {
        console.log("Toggle clicked. Current: ", isDark ? "Dark" : "Light");
        if (isDark) {
            document.documentElement.classList.remove('dark');
            document.documentElement.style.colorScheme = 'light';
            localStorage.theme = 'light';
            setIsDark(false);
            console.log("Removed 'dark' class. HTML classes:", document.documentElement.className);
        } else {
            document.documentElement.classList.add('dark');
            document.documentElement.style.colorScheme = 'dark';
            localStorage.theme = 'dark';
            setIsDark(true);
            console.log("Added 'dark' class. HTML classes:", document.documentElement.className);
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-600 dark:text-gray-400"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
    );
}
