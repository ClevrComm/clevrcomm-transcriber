import React from 'react';

export default function ClevrCommLogo({ className = "h-8" }) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* Logo Icon - Abstract Globe/Swirl */}
            <svg
                viewBox="0 0 100 100"
                className="h-full w-auto"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Left Side - Black Swirls */}
                <path
                    d="M30 85 C 10 80, 5 40, 35 15"
                    stroke="black"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className="dark:stroke-white"
                />
                <path
                    d="M40 92 C 15 85, 12 50, 42 22"
                    stroke="black"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className="dark:stroke-white"
                />
                <path
                    d="M50 95 C 25 90, 22 60, 48 30"
                    stroke="black"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="dark:stroke-white"
                />

                {/* Right Side - Blue Swirls */}
                <path
                    d="M65 15 C 90 20, 95 60, 65 85"
                    stroke="#0090FF"
                    strokeWidth="8"
                    strokeLinecap="round"
                />
                <path
                    d="M58 8 C 85 15, 88 50, 58 78"
                    stroke="#0090FF"
                    strokeWidth="6"
                    strokeLinecap="round"
                />
                <path
                    d="M52 5 C 75 10, 78 40, 52 70"
                    stroke="#0090FF"
                    strokeWidth="4"
                    strokeLinecap="round"
                />
            </svg>

            {/* Text Logo */}
            <div className="font-sans tracking-wide flex items-baseline">
                <span className="font-light text-2xl text-black dark:text-white">CLEVR</span>
                <span className="font-medium text-2xl text-[#0090FF]">COMM</span>
            </div>
        </div>
    );
}
