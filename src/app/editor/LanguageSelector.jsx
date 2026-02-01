"use client";

import React, { useState, useRef, useEffect } from 'react';

const languages = [
    { value: "javascript", label: "JavaScript", icon: "🟨" },
    { value: "typescript", label: "TypeScript", icon: "🔷" },
    { value: "python", label: "Python", icon: "🐍" },
    { value: "java", label: "Java", icon: "☕" },
    { value: "cpp", label: "C++", icon: "⚡" },
    { value: "c", label: "C", icon: "🔧" },
    { value: "csharp", label: "C#", icon: "💜" },
    { value: "go", label: "Go", icon: "🐹" },
    { value: "rust", label: "Rust", icon: "🦀" },
    { value: "html", label: "HTML", icon: "🌐" },
    { value: "css", label: "CSS", icon: "🎨" },
    { value: "json", label: "JSON", icon: "📄" },
    { value: "xml", label: "XML", icon: "📋" },
    { value: "markdown", label: "Markdown", icon: "📝" },
    { value: "sql", label: "SQL", icon: "🗃️" },
    { value: "php", label: "PHP", icon: "🐘" },
    { value: "ruby", label: "Ruby", icon: "💎" },
    { value: "swift", label: "Swift", icon: "🦉" },
    { value: "kotlin", label: "Kotlin", icon: "🎯" },
];

const LanguageSelector = ({ selectedLanguage, onLanguageChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const selectedLang = languages.find(lang => lang.value === selectedLanguage) || languages[0];

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLanguageSelect = (language) => {
        onLanguageChange(language.value);
        setIsOpen(false);
    };

    return (
        <div className="flex items-center gap-4">
            <div className='text-white font-semibold'>Language:</div>
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-between w-48 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white hover:bg-gray-700 hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{selectedLang.icon}</span>
                        <span className="font-medium">{selectedLang.label}</span>
                    </div>
                    <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl z-50 max-h-80 overflow-y-auto">
                        <div className="py-1">
                            {languages.map((language) => (
                                <button
                                    key={language.value}
                                    onClick={() => handleLanguageSelect(language)}
                                    className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-700 transition-colors duration-150 ${
                                        selectedLanguage === language.value 
                                            ? 'bg-purple-600 text-white' 
                                            : 'text-gray-200 hover:text-white'
                                    }`}
                                >
                                    <span className="text-lg">{language.icon}</span>
                                    <span className="font-medium">{language.label}</span>
                                    {selectedLanguage === language.value && (
                                        <svg className="w-4 h-4 ml-auto text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LanguageSelector;