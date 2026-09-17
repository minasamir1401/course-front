"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto px-6 h-[90px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-16 md:h-20 w-auto hover:scale-105 transition-transform duration-300 relative">
            <Image
              src="/logo.jpeg"
              alt="Klevro"
              width={160}
              height={60}
              priority
              className="h-full w-auto object-contain"
            />
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-10 text-[15px] font-bold text-[#334155]">
          <Link href="#features" className="hover:text-indigo-600 transition-colors">
            Features
          </Link>
          <Link href="#tracks" className="hover:text-indigo-600 transition-colors">
            Tracks
          </Link>
          <Link href="#statistics" className="hover:text-indigo-600 transition-colors">
            Statistics
          </Link>
          <Link href="#about" className="hover:text-indigo-600 transition-colors">
            About
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden sm:flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-full font-bold text-[15px] transition-all"
          >
            Login
          </Link>
          <Link
            href="/login"
            className="hidden sm:flex items-center justify-center bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90 text-white px-6 py-3 rounded-full font-bold text-[15px] shadow-[0_8px_16px_rgba(79,70,229,0.25)] transition-all"
          >
            Get Started
          </Link>
          <button
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="md:hidden text-slate-600 hover:text-indigo-600 p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 absolute top-[90px] left-0 right-0 p-6 space-y-4 shadow-xl animate-in slide-in-from-top duration-300">
          <Link
            href="#features"
            onClick={() => setIsMenuOpen(false)}
            className="block text-slate-600 font-bold hover:text-indigo-600"
          >
            Features
          </Link>
          <Link
            href="#tracks"
            onClick={() => setIsMenuOpen(false)}
            className="block text-slate-600 font-bold hover:text-indigo-600"
          >
            Tracks
          </Link>
          <Link
            href="#statistics"
            onClick={() => setIsMenuOpen(false)}
            className="block text-slate-600 font-bold hover:text-indigo-600"
          >
            Statistics
          </Link>
          <Link
            href="#about"
            onClick={() => setIsMenuOpen(false)}
            className="block text-slate-600 font-bold hover:text-indigo-600"
          >
            About
          </Link>
          <hr className="border-slate-100" />
          <Link
            href="/login"
            className="block text-center text-slate-700 bg-slate-100 py-3 rounded-full font-bold hover:bg-slate-200"
          >
            Login
          </Link>
          <Link
            href="/login"
            className="block bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white text-center py-3 rounded-full font-bold"
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  );
}
