"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function SchoolAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // 1. Skip auth check for login page
    if (pathname === "/school-admin/login") {
      setIsChecking(false);
      return;
    }

    const checkUser = () => {
      const token = localStorage.getItem("school_admin_token");
      const userStr = localStorage.getItem("school_admin_user");

      if (!token || !userStr) {
        router.replace("/school-admin/login");
        return;
      }

      try {
        const user = JSON.parse(userStr);
        const role = String(user.role || "").toUpperCase();

        // Super Admin and School Admin are allowed here
        if (role === "SCHOOL_ADMIN" || role === "SUPER_ADMIN") {
          setIsChecking(false);
          return;
        }

        // If not an admin, don't just hijack to dashboard
        // Force them to login page for this section
        console.warn("Unauthorized role in School Admin area:", role);
        router.replace("/school-admin/login");
      } catch (e) {
        console.error("Auth check error:", e);
        router.replace("/school-admin/login");
      }
    };

    checkUser();
  }, [pathname, router]);

  if (isChecking && pathname !== "/school-admin/login") {
    return (
      <div className="min-h-screen bg-emerald-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          <p className="text-emerald-300 font-medium">جاري التحقق...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
