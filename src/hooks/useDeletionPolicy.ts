"use client";

import { useState, useEffect } from "react";
import { API_URL } from "@/lib/api";

let cachedPolicy: boolean | null = null;
let fetchPromise: Promise<boolean> | null = null;

export const useDeletionPolicy = (role: string) => {
  const [allowDeletion, setAllowDeletion] = useState<boolean>(
    role === "SUPER_ADMIN" ? true : cachedPolicy ?? false
  );

  useEffect(() => {
    if (role === "SUPER_ADMIN") {
      setAllowDeletion(true);
      return;
    }
    
    if (cachedPolicy !== null) {
      setAllowDeletion(cachedPolicy);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = (async () => {
        try {
          const token = localStorage.getItem("school_admin_token") || localStorage.getItem("token") || "";
          const res = await fetch(`${API_URL}/system/settings/deletion-policy`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include"
          });
          if (res.ok) {
            const data = await res.json();
            return Boolean(data.allowContentDeletion);
          }
          return false;
        } catch (err) {
          console.error("Failed to fetch deletion policy:", err);
          return false;
        }
      })();
    }

    fetchPromise.then(policy => {
      cachedPolicy = policy;
      setAllowDeletion(policy);
    });
  }, [role]);

  return allowDeletion;
};
