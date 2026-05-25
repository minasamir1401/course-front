"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, BarChart, Shield, Zap, Globe, ArrowLeft, Users, GraduationCap, Play, Menu, X } from "lucide-react";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  // useEffect(() => {
  //   const token = localStorage.getItem("lms_token");
  //   const user = JSON.parse(localStorage.getItem("lms_user") || "null");
  //   
  //   if (token && user) {
  //     if (user.role === "SUPER_ADMIN") router.push("/super-admin");
  //     else if (user.role === "SCHOOL_ADMIN") router.push("/school-admin");
  //     else if (user.role === "TEACHER") router.push("/teacher");
  //     else if (user.role === "STUDENT") router.push("/dashboard");
  //   }
  // }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="ltr">

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 leading-tight">School Learning.</h1>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#tracks" className="hover:text-primary transition-colors">Tracks</Link>
            <Link href="#statistics" className="hover:text-primary transition-colors">Statistics</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-600 hover:text-primary font-bold text-sm hidden sm:block">
              Login
            </Link>
            <Link href="/login" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all hidden sm:block">
              Get Started
            </Link>
            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden text-slate-600 hover:text-primary p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 absolute top-20 left-0 right-0 p-6 space-y-4 shadow-xl animate-in slide-in-from-top duration-300">
            <Link href="#features" onClick={() => setIsMenuOpen(false)} className="block text-slate-600 font-bold hover:text-primary">Features</Link>
            <Link href="#tracks" onClick={() => setIsMenuOpen(false)} className="block text-slate-600 font-bold hover:text-primary">Tracks</Link>
            <Link href="#statistics" onClick={() => setIsMenuOpen(false)} className="block text-slate-600 font-bold hover:text-primary">Statistics</Link>
            <hr className="border-slate-100" />
            <Link href="/login" className="block text-center text-slate-600 font-bold hover:text-primary">Login</Link>
            <Link href="/login" className="block bg-primary text-white text-center py-3 rounded-xl font-bold">Get Started</Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 relative overflow-hidden text-center">
        {/* Abstract Backgrounds */}
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            <Zap className="w-4 h-4 fill-current" />
            Welcome to the Future of Education
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-tight mb-6">
            Discover <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              School Learning.
            </span>
          </h1>
          <p className="text-lg lg:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Empowering students and educators with smart tools, interactive content, and personalized learning paths to achieve academic excellence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link href="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-blue-500/30 transition-all">
              Get Started
            </Link>
            <Link href="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all shadow-sm">
              Login
              <ArrowLeft className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-4">Features</h2>
            <p className="text-slate-500 text-lg">Designed to provide the best learning experience with modern methodologies.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                <Play className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Interactive Learning</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Engage with dynamic content, videos, and interactive quizzes that make learning fun.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Smart Practice</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Adaptive practice sessions that focus on your weak areas and build your confidence.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-6">
                <BarChart className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Progress Tracking</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Detailed analytics and visual reports to monitor your academic growth over time.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-6">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Personalized Learning</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Customized learning paths tailored to meet each student's unique needs and pace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tracks Section */}
      <section id="tracks" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-4">Available Tracks</h2>
            <p className="text-slate-500 text-lg">Comprehensive preparation courses for standardized tests.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['SAT', 'GAT', 'SAAT', 'NAFS'].map(track => (
              <div key={track} className="p-8 rounded-3xl bg-white border border-slate-200 text-center hover:border-indigo-500 hover:shadow-xl transition-all cursor-pointer">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 text-white font-black text-xl shadow-lg">
                  {track[0]}
                </div>
                <h3 className="text-2xl font-bold text-slate-800">{track}</h3>
                <p className="text-slate-500 text-sm mt-2">Preparation Track</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="statistics" className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl lg:text-5xl font-extrabold mb-2">+10K</div>
              <div className="text-blue-200 font-medium text-sm lg:text-base">Active Students</div>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-extrabold mb-2">+50</div>
              <div className="text-blue-200 font-medium text-sm lg:text-base">Courses</div>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-extrabold mb-2">+500K</div>
              <div className="text-blue-200 font-medium text-sm lg:text-base">Questions Answered</div>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-extrabold mb-2">99%</div>
              <div className="text-blue-200 font-medium text-sm lg:text-base">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 w-full md:w-auto">
            <BookOpen className="w-6 h-6 text-blue-500" />
            <span className="text-xl font-bold text-white">School Learning.</span>
          </div>
          <p className="text-sm w-full md:w-auto">© 2026 School Learning. All rights reserved.</p>
          <div className="flex gap-4 justify-center w-full md:w-auto">
            <Link href="#" className="hover:text-white transition-colors">Contact Us</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

function CheckCircle() {
  return (
    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
