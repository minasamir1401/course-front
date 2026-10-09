"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { buildSuperAdminRouteRoleFallbackHref } from "@/lib/examEditRoleFallback";

export default function SuperAdminAuthGate({
  children,
  loading,
}: {
  children: React.ReactNode;
  loading: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === "/super-admin/login") {
      setIsChecking(false);
      return;
    }

    const token = localStorage.getItem("super_admin_token");
    const userStr = localStorage.getItem("super_admin_user");
    const schoolAdminToken = localStorage.getItem("school_admin_token");
    const schoolAdminUser = localStorage.getItem("school_admin_user");
    const roleFallbackHref = buildSuperAdminRouteRoleFallbackHref({
      pathname,
      search: searchParams.toString() ? `?${searchParams.toString()}` : "",
      hasSuperAdminToken: !!token,
      hasSchoolAdminSession: !!schoolAdminToken || !!schoolAdminUser,
    });

    if (roleFallbackHref) {
      router.replace(roleFallbackHref);
      return;
    }

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
  }, [pathname, router, searchParams]);

  if (isChecking && pathname !== "/super-admin/login") {
    return <>{loading}</>;
  }

  return <>{children}</>;
}
