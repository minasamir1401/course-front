"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function SchoolAdminAuthGate({
  children,
  loading,
}: {
  children: React.ReactNode;
  loading: React.ReactNode;
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

        // Super Admin, School Admin, and Teacher are allowed here
        if (role === "SCHOOL_ADMIN" || role === "SUPER_ADMIN" || role === "TEACHER") {
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
    return <>{loading}</>;
  }

  return <>{children}</>;
}
