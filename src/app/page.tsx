"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Play, Zap, BarChart2, Users, ArrowRight,
  BookOpen, CheckCircle, Trophy, Menu, X, Hexagon
} from 'lucide-react';

const Facebook = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
  </svg>
);

const Twitter = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.05c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
  </svg>
);

const Instagram = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans" dir="ltr">
      
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-[90px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-16 md:h-20 w-auto hover:scale-105 transition-transform duration-300">
              <img src="/logo.jpeg" alt="Klevro" className="h-full object-contain" />
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-10 text-[15px] font-bold text-[#334155]">
            <Link href="#features" className="hover:text-indigo-600 transition-colors">Features</Link>
            <Link href="#tracks" className="hover:text-indigo-600 transition-colors">Tracks</Link>
            <Link href="#statistics" className="hover:text-indigo-600 transition-colors">Statistics</Link>
            <Link href="#about" className="hover:text-indigo-600 transition-colors">About</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-full font-bold text-[15px] transition-all">
              Login
            </Link>
            <Link href="/login" className="hidden sm:flex items-center justify-center bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90 text-white px-6 py-3 rounded-full font-bold text-[15px] shadow-[0_8px_16px_rgba(79,70,229,0.25)] transition-all">
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
            <Link href="#features" onClick={() => setIsMenuOpen(false)} className="block text-slate-600 font-bold hover:text-indigo-600">Features</Link>
            <Link href="#tracks" onClick={() => setIsMenuOpen(false)} className="block text-slate-600 font-bold hover:text-indigo-600">Tracks</Link>
            <Link href="#statistics" onClick={() => setIsMenuOpen(false)} className="block text-slate-600 font-bold hover:text-indigo-600">Statistics</Link>
            <Link href="#about" onClick={() => setIsMenuOpen(false)} className="block text-slate-600 font-bold hover:text-indigo-600">About</Link>
            <hr className="border-slate-100" />
            <Link href="/login" className="block text-center text-slate-700 bg-slate-100 py-3 rounded-full font-bold hover:bg-slate-200">Login</Link>
            <Link href="/login" className="block bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white text-center py-3 rounded-full font-bold">Get Started</Link>
          </div>
        )}
      </header>

      <main>
      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-[180px] lg:pb-32 px-6 relative overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0]">
        {/* Soft abstract blobs similar to design */}
        <div className="absolute top-20 right-[-10%] w-[600px] h-[600px] bg-indigo-200/40 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-[-10%] w-[600px] h-[600px] bg-purple-200/40 rounded-full blur-[100px]"></div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          
          {/* Left Text */}
          <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start">
            <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-slate-200/50 text-indigo-600 px-4 py-1.5 rounded-full text-sm font-bold mb-8 shadow-sm">
              <Zap className="w-4 h-4 fill-indigo-600" />
              Welcome to the Future of Education
            </div>
            
            <h1 className="text-[56px] lg:text-[72px] font-extrabold text-[#0F172A] leading-[1.1] mb-6 tracking-tight">
              Discover <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-gradient bg-[length:200%_auto]">
                Platform
              </span>
            </h1>
            
            <p className="text-lg lg:text-[19px] text-[#475569] mb-10 max-w-lg leading-[1.6]">
              Empowering students and educators with smart tools, interactive content, and personalized learning paths to achieve academic excellence.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link href="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90 text-white px-8 py-4 rounded-full font-bold text-lg shadow-[0_8px_20px_rgba(79,70,229,0.3)] transition-all">
                Get Started
              </Link>
              <Link href="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-[#334155] px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-50 transition-all shadow-sm border border-slate-200">
                Login
                <ArrowRight className="w-5 h-5 ml-1" />
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="flex-1 w-full max-w-[650px] relative">
            <div className="relative w-full aspect-square">
              <img 
                src="/dashboard-mockup.png"
                alt="Dashboard Illustration" 
                className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-[40px] font-extrabold text-[#0F172A] mb-4">Features</h2>
            <p className="text-[#64748B] text-[17px]">Designed to provide the best learning experience with modern methodologies.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-[32px] hover:-translate-y-1 transition-all duration-300 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100/50">
              <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-blue-500 text-blue-500 mb-6 bg-blue-50/50">
                <Play className="w-7 h-7" />
              </div>
              <h3 className="text-[20px] font-extrabold text-[#0F172A] mb-3">Interactive Learning</h3>
              <p className="text-[#64748B] leading-[1.6] text-[15px]">
                Engage with dynamic content, videos, and interactive quizzes that make learning fun.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[32px] hover:-translate-y-1 transition-all duration-300 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100/50">
              <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-purple-500 text-purple-500 mb-6 bg-purple-50/50">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-[20px] font-extrabold text-[#0F172A] mb-3">Smart Practice</h3>
              <p className="text-[#64748B] leading-[1.6] text-[15px]">
                Adaptive practice sessions that focus on your weak areas and build your confidence.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[32px] hover:-translate-y-1 transition-all duration-300 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100/50">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-orange-500 mb-6 bg-orange-100">
                <BarChart2 className="w-7 h-7" />
              </div>
              <h3 className="text-[20px] font-extrabold text-[#0F172A] mb-3">Progress Tracking</h3>
              <p className="text-[#64748B] leading-[1.6] text-[15px]">
                Detailed analytics and visual reports to monitor your academic growth over time.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[32px] hover:-translate-y-1 transition-all duration-300 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100/50">
              <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-green-500 text-green-500 mb-6 bg-green-50/50">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-[20px] font-extrabold text-[#0F172A] mb-3">Personalized Learning</h3>
              <p className="text-[#64748B] leading-[1.6] text-[15px]">
                Customized learning paths tailored to meet each student's unique needs and pace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tracks Section */}
      <section id="tracks" className="py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-[40px] font-extrabold text-[#0F172A] mb-4">Available Tracks</h2>
            <div className="w-20 h-1 bg-indigo-600 mx-auto rounded-full mb-6"></div>
            <p className="text-[#64748B] text-[17px]">Comprehensive preparation courses for standardized tests.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {['SAT', 'GAT', 'SAAT', 'NAFS'].map((track, i) => (
              <div key={track} className="p-8 rounded-[32px] bg-white text-center hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] transition-all duration-300 shadow-sm border border-slate-100 flex flex-col items-center">
                <div className={`w-[72px] h-[72px] rounded-full flex items-center justify-center mb-6 text-white font-black text-2xl shadow-lg
                  ${i === 0 ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 
                    i === 1 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 
                    i === 2 ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 
                    'bg-gradient-to-br from-purple-500 to-pink-500'}`
                }>
                  {track[0]}
                </div>
                <h3 className="text-[22px] font-extrabold text-[#0F172A]">{track}</h3>
                <p className="text-[#64748B] text-[14px] mt-1 mb-8 font-medium">Preparation Track</p>
                
                <Link href={`/login`} className="mt-auto flex items-center justify-center gap-2 text-indigo-600 font-bold border border-indigo-100 hover:border-indigo-600 hover:bg-indigo-50 px-6 py-2.5 rounded-full transition-all w-max text-sm">
                  Explore
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section id="statistics" className="py-20 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] relative overflow-hidden">
        {/* Halftone / Dots Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#fff 2px, transparent 2px)", backgroundSize: "24px 24px" }}></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x-0 md:divide-x divide-white/10">
            <div className="flex flex-col items-center">
              <Users className="w-8 h-8 text-white mb-4" />
              <div className="text-[40px] lg:text-[48px] font-black text-white leading-none mb-2">+10K</div>
              <div className="text-white/80 font-bold text-[15px]">Active Students</div>
            </div>
            <div className="flex flex-col items-center">
              <BookOpen className="w-8 h-8 text-white mb-4" />
              <div className="text-[40px] lg:text-[48px] font-black text-white leading-none mb-2">+50</div>
              <div className="text-white/80 font-bold text-[15px]">Courses</div>
            </div>
            <div className="flex flex-col items-center">
              <CheckCircle className="w-8 h-8 text-white mb-4" />
              <div className="text-[40px] lg:text-[48px] font-black text-white leading-none mb-2">+500K</div>
              <div className="text-white/80 font-bold text-[15px]">Questions Answered</div>
            </div>
            <div className="flex flex-col items-center">
              <Trophy className="w-8 h-8 text-white mb-4" />
              <div className="text-[40px] lg:text-[48px] font-black text-white leading-none mb-2">99%</div>
              <div className="text-white/80 font-bold text-[15px]">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="bg-[#0B0F19] text-slate-400 py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left mb-12">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3 relative z-10 group cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-[0_0_20px_rgba(79,70,229,0.15)] border border-indigo-100 flex items-center justify-center p-2.5 overflow-hidden group-hover:shadow-[0_0_30px_rgba(79,70,229,0.25)] transition-all duration-300 transform group-hover:scale-105">
                  <img src="/logo.jpeg" alt="Logo" className="h-full object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black bg-gradient-to-r from-slate-900 to-indigo-900 bg-clip-text text-transparent">
                    Platform
                  </span>
                </div>
              </div>
              <div className="text-[14px] text-slate-400 space-y-1">
                <p>Empowering learners.</p>
                <p>Building futures.</p>
              </div>
            </div>
            
            <p className="text-[14px] text-slate-300">© 2026 Platform. All rights reserved.</p>
            
            <div className="flex flex-col items-center md:items-end gap-6">
              <div className="flex gap-6 text-[14px] font-medium">
                <Link href="#" className="hover:text-white transition-colors">Contact Us</Link>
                <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
              </div>
              <div className="flex gap-4">
                <Link href="#" aria-label="Facebook" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-white transition-colors">
                  <Facebook className="w-5 h-5 fill-current border-none" />
                </Link>
                <Link href="#" aria-label="Twitter" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-white transition-colors">
                  <Twitter className="w-5 h-5 fill-current border-none" />
                </Link>
                <Link href="#" aria-label="Instagram" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-white transition-colors">
                  <Instagram className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

