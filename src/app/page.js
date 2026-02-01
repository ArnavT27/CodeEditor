"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FloatingParticles from "./components/FloatingParticles";
import LanguageSelector from "./components/LanguageSelector";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const featuresRef = useRef(null);
  const userMenuRef = useRef(null);
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    setIsVisible(true);

    // Redirect logged-in users to dashboard
    if (user) {
      router.push('/dashboard');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up");
          }
        });
      },
      { threshold: 0.1 }
    );

    const featureCards = document.querySelectorAll(".feature-card");
    featureCards.forEach((card) => observer.observe(card));

    // Click outside handler for user menu
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      featureCards.forEach((card) => observer.unobserve(card));
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

        {/* Additional gradient orbs */}
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-float-slow"></div>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full mix-blend-multiply filter blur-2xl opacity-15 animate-blob animation-delay-1000"></div>
      </div>

      {/* Floating Particles */}
      <FloatingParticles />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between p-6 lg:px-8 glass border-b border-white/10">
        <div className="flex lg:flex-1">
          <h2 className={`text-2xl font-bold gradient-text-purple transition-all duration-1000 animate-bounce-in ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            CodeEditor
          </h2>
        </div>
        <div className={`flex items-center gap-4 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <Link
            href="/editor"
            className="text-sm font-semibold leading-6 text-white/90 hover:text-white transition-all duration-300 hover:scale-110 relative group"
          >
            Editor
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <LanguageSelector />

          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-lg glass border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <span>{user.name}</span>
                <svg className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 glass border border-white/20 rounded-lg shadow-2xl overflow-hidden z-50">
                  <div className="p-3 border-b border-white/10">
                    <p className="text-sm text-white/90 font-semibold">{user.name}</p>
                    <p className="text-xs text-white/60">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/signup"
              className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-purple-500/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 transition-all duration-300 btn-hover-lift animate-pulse-glow"
            >
              Get Started
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8 z-10">
        <div className="mx-auto max-w-4xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <div className={`mb-8 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <span className="inline-block px-6 py-3 rounded-full glass border border-white/20 text-white/90 text-sm font-medium animate-shimmer relative overflow-hidden">
                <span className="relative z-10">✨ New: Advanced Code Editor with AI</span>
              </span>
            </div>
            <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <span className="gradient-text-purple animate-gradient ">
                Build Amazing
              </span>
              <br />
              <span className="gradient-text-purple animate-gradient animation-delay-1000 ">
                Web Applications
              </span>
            </h1>
            <p className={`mt-8 text-xl leading-8 text-white/80 max-w-3xl mx-auto transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Create powerful, modern web applications with our intuitive platform.
              Experience the future of coding with AI-powered assistance and real-time collaboration.
            </p>
            <div className={`mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <Link
                href="/editor"
                className="group relative rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-10 py-5 text-lg font-semibold text-white shadow-2xl hover:shadow-purple-500/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 transition-all duration-300 btn-hover-lift overflow-hidden animate-pulse-glow"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Try Editor Now
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <a
                href="#features"
                className="group text-lg font-semibold leading-6 text-white/90 hover:text-white transition-all duration-300 btn-hover-lift flex items-center gap-3 px-6 py-3 rounded-xl glass border border-white/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                Explore Features
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-2">→</span>
              </a>
            </div>
          </div>
        </div>

        {/* Floating Code Snippets */}
        <div className="absolute top-1/4 left-10 hidden lg:block animate-float-slow">
          <div className="glass rounded-xl p-6 border border-white/20 shadow-2xl card-hover">
            <div className="flex gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-scale-pulse"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500 animate-scale-pulse animation-delay-200"></div>
              <div className="w-3 h-3 rounded-full bg-green-500 animate-scale-pulse animation-delay-300"></div>
            </div>
            <pre className="text-sm text-white/90 font-mono">
              <code>{`function createApp() {\n  return "Hello World!";\n}`}</code>
            </pre>
          </div>
        </div>
        <div className="absolute bottom-1/4 right-10 hidden lg:block animate-float-slow animation-delay-2000">
          <div className="glass rounded-xl p-6 border border-white/20 shadow-2xl card-hover">
            <div className="flex gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-scale-pulse"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500 animate-scale-pulse animation-delay-200"></div>
              <div className="w-3 h-3 rounded-full bg-green-500 animate-scale-pulse animation-delay-300"></div>
            </div>
            <pre className="text-sm text-white/90 font-mono">
              <code>{`const editor = {\n  theme: "dark",\n  ai: true\n};`}</code>
            </pre>
          </div>
        </div>

        {/* Rotating Tech Icons */}
        <div className="absolute top-1/3 right-1/4 hidden xl:block">
          <div className="relative w-32 h-32 animate-rotate-slow">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">JS</span>
            </div>
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">TS</span>
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">AI</span>
            </div>
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-pink-400 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">UI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative z-10 py-24 sm:py-32" ref={featuresRef}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-purple-400 animate-shimmer gradient-text-purple">
              Features
            </h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl gradient-text">
              Everything you need to build great apps
            </p>
            <p className="mt-6 text-lg leading-8 text-white/70">
              Our platform provides all the tools and features you need to create
              modern, scalable web applications with cutting-edge technology.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              {[
                {
                  icon: (
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                    </svg>
                  ),
                  title: "AI-Powered Code Editor",
                  description: "Built-in code editor with AI assistance, syntax highlighting, and intelligent auto-completion.",
                  gradient: "from-blue-500 to-cyan-500"
                },
                {
                  icon: (
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  ),
                  title: "Lightning Performance",
                  description: "Blazing-fast performance with optimized builds, intelligent caching, and edge deployment.",
                  gradient: "from-yellow-500 to-orange-500"
                },
                {
                  icon: (
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  ),
                  title: "Enterprise Security",
                  description: "Bank-level security with end-to-end encryption, secure authentication, and compliance.",
                  gradient: "from-green-500 to-emerald-500"
                },
                {
                  icon: (
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                    </svg>
                  ),
                  title: "Responsive Design",
                  description: "Mobile-first design that works perfectly on all devices with adaptive layouts.",
                  gradient: "from-purple-500 to-pink-500"
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="feature-card relative pl-16 opacity-0 group"
                >
                  <dt className="text-base font-semibold leading-7 text-white">
                    <div className={`absolute left-0 top-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg group-hover:scale-110 transition-all duration-300 group-hover:shadow-2xl animate-pulse-glow card-hover`}>
                      {feature.icon}
                    </div>
                    <span className="gradient-text-purple">{feature.title}</span>
                  </dt>
                  <dd className="mt-3 text-base leading-7 text-white/80">
                    {feature.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="glass rounded-3xl p-12 border border-white/20 shadow-2xl card-hover">
              <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl gradient-text-purple neon-glow">
                Ready to get started?
              </h2>
              <p className="mt-6 text-xl leading-8 text-white/80">
                Join thousands of developers building amazing applications with our platform.
                Experience the future of web development today.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link
                  href="/auth/signup"
                  className="group relative rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-10 py-5 text-lg font-semibold text-white shadow-2xl hover:shadow-purple-500/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 transition-all duration-300 btn-hover-lift animate-pulse-glow overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Start Building Now
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                <Link
                  href="/demo"
                  className="group text-lg font-semibold leading-6 text-white/90 hover:text-white transition-all duration-300 btn-hover-lift flex items-center gap-3 px-8 py-4 rounded-xl glass border border-white/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 010 5H9m4.5-5H15a2.5 2.5 0 010 5h-1.5m-5-5v5m5-5v5" />
                  </svg>
                  Watch Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 glass border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-8 md:order-2">
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/60">Built with</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">N</span>
                </div>
                <span className="text-sm text-white/80 font-medium">Next.js</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">T</span>
                </div>
                <span className="text-sm text-white/80 font-medium">Tailwind</span>
              </div>
            </div>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="gradient-text-purple font-bold text-lg">CodeEditor</div>
              <span className="text-center text-sm leading-5 text-white/60">
                &copy; 2026 All rights reserved.
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}