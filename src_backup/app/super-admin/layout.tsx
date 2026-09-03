"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === "/super-admin/login") {
      setIsChecking(false);
      return;
    }

    const token = localStorage.getItem("super_admin_token");
    const userStr = localStorage.getItem("super_admin_user");

    if (!token || !userStr) {
      router.replace("/super-admin/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const role = String(user.role || "").toUpperCase();

      // If not a Super Admin, don't just hijack and redirect to another portal
      // Instead, redirect to the super-admin login so they can sign in with the right account
      if (role !== "SUPER_ADMIN") {
        console.warn("Role mismatch in Super Admin area. Found:", role);
        // We don't clear storage yet to avoid losing session if it was an accident, 
        // but we force them to the correct login page for this section.
        router.replace("/super-admin/login");
        return;
      }

      setIsChecking(false);
    } catch (e) {
      console.error("Auth check error:", e);
      router.replace("/super-admin/login");
    }
  }, [pathname, router]);

  if (isChecking && pathname !== "/super-admin/login") {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          <p className="text-purple-300 font-medium">جاري التحقق...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
