"use client";

import React, { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import styles from "./StudentLoginForm.module.css";
import { API_URL } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export default function StudentLoginForm() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const schoolAdminToken = localStorage.getItem("school_admin_token");
    const schoolAdminUser = localStorage.getItem("school_admin_user");
    if (schoolAdminToken && schoolAdminUser) {
      try {
        const user = JSON.parse(schoolAdminUser);
        if (user && (user.role === "TEACHER" || user.role === "SCHOOL_ADMIN")) {
          router.replace("/school-admin");
          return;
        }
      } catch {}
    }
    const token = localStorage.getItem("lms_token");
    const userString = localStorage.getItem("lms_user");
    if (token && userString) {
      try {
        const user = JSON.parse(userString);
        if (user && user.role === "STUDENT") {
          router.replace("/dashboard");
          return;
        }
      } catch {
        localStorage.removeItem("lms_token");
        localStorage.removeItem("lms_user");
      }
    }
    setIsChecking(false);
  }, [router]);

  if (isChecking) {
    return (
      <main role="status" aria-label={language === "ar" ? "جارٍ التحقق من الحساب" : "Checking account"} className="min-h-screen flex items-center justify-center" style={{ background: "#F5F8FF" }}>
        <div className="w-10 h-10 border-4 border-[#5028E8] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch(API_URL + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      let data: any = {};
      try { data = await res.json(); } catch {}
      if (!res.ok) {
        setError(res.status >= 502 ? 'unreachable' : 'credentials');
        return;
      }
      if (data.user?.role === "SUPER_ADMIN" || data.user?.role === "SCHOOL_ADMIN") {
        setError('role');
        return;
      }
      if (data.user?.role === "TEACHER") {
        localStorage.setItem("school_admin_token", "cookie_auth");
        localStorage.setItem("school_admin_token_expires_at", String(data.expiresAt || Date.now() + 28800000));
        localStorage.setItem("school_admin_user", JSON.stringify({ id: data.user.id, role: data.user.role, name: data.user.name, schoolId: data.user.schoolId, schoolName: data.user.schoolName, username }));
        router.push("/school-admin");
      } else {
        localStorage.setItem("lms_token", "cookie_auth");
        localStorage.setItem("lms_token_expires_at", String(data.expiresAt || Date.now() + 28800000));
        localStorage.setItem("lms_user", JSON.stringify({ id: data.user.id, role: data.user.role, name: data.user.name, schoolId: data.user.schoolId, schoolName: data.user.schoolName, username }));
        router.push("/dashboard");
      }
    } catch {
      setError('connection');
    } finally {
      setIsLoading(false);
    }
  };

  const ar = language === "ar";
  const errorText = ({unreachable:ar?"الخادم لا يستجيب. حاول لاحقاً.":"Server unreachable. Try later.",credentials:ar?"اسم المستخدم أو كلمة المرور غير صحيحة.":"Incorrect username or password.",role:t("login.roleErrorStudent"),connection:t("login.connError")} as Record<string,string>)[error] || error;

  const icon = (name: string, className?: string) => <Image src={`/klevro/icons/outline/${name}.svg`} alt="" aria-hidden="true" width={20} height={20} className={className}/>;

  return (
    <div className={styles.page} dir={ar ? 'rtl' : 'ltr'}>
      <div className={styles.background} aria-hidden="true"/>
      <header className={styles.header} dir="ltr">
        <button type="button" className={styles.language} onClick={()=>setLanguage(ar?'en':'ar')} aria-label={ar?'التبديل للإنجليزية':'Switch to Arabic'}>{ar?'EN':'عربي'}</button>
        <Link href="/" className={styles.brand} aria-label="Klevro"><span>Klevro</span><Image src="/logo.jpeg" alt="" width={46} height={46} priority/></Link>
      </header>
      <main className={styles.main}>
        <div className={styles.layout} dir="ltr">
          <section className={styles.promo} dir={ar?'rtl':'ltr'} aria-labelledby="login-intro-title">
            <div className={styles.promoCopy}><h1 id="login-intro-title">{ar?<>منصتك التعليمية<br/>في مكان واحد</>:<>Your Learning Platform<br/>In One Place</>}</h1><p>{ar?'ادخل بحساب المدرسة لمتابعة دروسك وواجباتك والاختبارات.':'Sign in with your school account to follow your lessons, assignments and exams.'}</p></div>
            <div className={styles.artScene} aria-hidden="true"><div className={styles.art}><Image src="/klevro/illustrations/login-education-transparent.png" alt="" aria-hidden="true" width={1391} height={1131} priority sizes="(max-width: 540px) calc(100vw - 40px), (max-width: 900px) 360px, (max-width: 1200px) 36vw, 440px"/></div></div>
          </section>
          <div className={styles.cardColumn} dir={ar?'rtl':'ltr'}>
            <section className={styles.card} aria-labelledby="login-title">
              <div className={styles.cardHeading}><h2 id="login-title">{ar?'أهلاً بعودتك':'Welcome Back'} <span aria-hidden="true">👋</span></h2><p>{ar?'ادخل بحساب المدرسة لمتابعة دروسك وواجباتك والاختبارات.':'Sign in with your school account to access your lessons, assignments and exams.'}</p></div>
              <form className={styles.form} onSubmit={handleLogin} aria-busy={isLoading}>
                {error&&<div id="login-error" role="alert" className={styles.error}><AlertCircle size={18} aria-hidden="true"/><span>{errorText}</span></div>}
                <div className={styles.field}><label htmlFor="student-username">{ar?'اسم المستخدم':'Username'}</label><div className={styles.inputWrap} dir="ltr"><span className={styles.inputIcon}>{icon('user')}</span><input id="student-username" name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={username} onChange={event=>setUsername(event.target.value)} placeholder={ar?'اسم المستخدم':'Enter username'} dir="auto" aria-describedby={error?'login-error':undefined}/></div></div>
                <div className={styles.field}><label htmlFor="student-password">{ar?'كلمة المرور':'Password'}</label><div className={styles.inputWrap} dir="ltr"><span className={styles.inputIcon}>{icon('lock')}</span><input id="student-password" name="password" type={showPassword?'text':'password'} autoComplete="current-password" required value={password} onChange={event=>setPassword(event.target.value)} placeholder="••••••••" dir="ltr" aria-describedby={error?'login-error':undefined}/><button className={styles.eyeButton} type="button" onClick={()=>setShowPassword(value=>!value)} aria-label={ar?(showPassword?'إخفاء كلمة المرور':'إظهار كلمة المرور'):(showPassword?'Hide password':'Show password')} aria-pressed={showPassword}>{icon(showPassword?'eye-off':'eye')}</button></div><button type="button" className={styles.showPassword} onClick={()=>setShowPassword(value=>!value)} aria-pressed={showPassword}>{icon('eye')}<span>{ar?(showPassword?'إخفاء كلمة المرور':'إظهار كلمة المرور'):(showPassword?'Hide password':'Show password')}</span></button></div>
                <button type="submit" className={styles.submit} disabled={isLoading}><span>{isLoading?(ar?'جارٍ الدخول…':'Signing in…'):(ar?'دخول':'Sign in')}</span><svg viewBox="0 0 24 24" fill="none" width="22" height="22" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
              </form>
            </section>
            <Link href="/" className={styles.back}>{ar?'العودة للرئيسية':'Back to Home'}</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
