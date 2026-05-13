
export const AUTH_KEYS = {
  SUPER_ADMIN: {
    TOKEN: "super_admin_token",
    USER: "super_admin_user",
    LOGIN_PATH: "/super-admin/login",
    DASHBOARD_PATH: "/super-admin"
  },
  SCHOOL_ADMIN: {
    TOKEN: "school_admin_token",
    USER: "school_admin_user",
    LOGIN_PATH: "/school-admin/login",
    DASHBOARD_PATH: "/school-admin"
  },
  STUDENT: {
    TOKEN: "lms_token",
    USER: "lms_user",
    LOGIN_PATH: "/login",
    DASHBOARD_PATH: "/dashboard"
  }
};

export const clearAllAuthData = () => {
  Object.values(AUTH_KEYS).forEach(config => {
    localStorage.removeItem(config.TOKEN);
    localStorage.removeItem(config.USER);
  });
  // Also clear impersonation data
  localStorage.removeItem("is_impersonating");
  localStorage.removeItem("original_admin_token");
  localStorage.removeItem("original_admin_user");
  localStorage.removeItem("original_admin_type");
};

export const logout = (router: any, currentPath: string = "") => {
  let redirectPath = AUTH_KEYS.STUDENT.LOGIN_PATH;
  let authKey = AUTH_KEYS.STUDENT;
  
  if (currentPath.startsWith("/super-admin")) {
    redirectPath = AUTH_KEYS.SUPER_ADMIN.LOGIN_PATH;
    authKey = AUTH_KEYS.SUPER_ADMIN;
  } else if (currentPath.startsWith("/school-admin")) {
    redirectPath = AUTH_KEYS.SCHOOL_ADMIN.LOGIN_PATH;
    authKey = AUTH_KEYS.SCHOOL_ADMIN;
  }

  localStorage.removeItem(authKey.TOKEN);
  localStorage.removeItem(authKey.USER);
  router.replace(redirectPath);
};

export const startImpersonation = (targetToken: string, targetUser: any, targetRole: string) => {
  // 1. Capture current admin data
  const adminToken = localStorage.getItem(AUTH_KEYS.SUPER_ADMIN.TOKEN) || localStorage.getItem(AUTH_KEYS.SCHOOL_ADMIN.TOKEN);
  const adminUser = localStorage.getItem(AUTH_KEYS.SUPER_ADMIN.USER) || localStorage.getItem(AUTH_KEYS.SCHOOL_ADMIN.USER);
  const adminType = localStorage.getItem(AUTH_KEYS.SUPER_ADMIN.TOKEN) ? 'SUPER' : 'SCHOOL';

  // 2. Clear everything
  clearAllAuthData();

  // 3. Save backup
  if (adminToken) {
    localStorage.setItem("original_admin_token", adminToken);
    localStorage.setItem("original_admin_user", adminUser || "");
    localStorage.setItem("original_admin_type", adminType);
    localStorage.setItem("is_impersonating", "true");
  }

  // 4. Set target session
  if (targetRole === 'STUDENT' || targetRole === 'TEACHER') {
    localStorage.setItem(AUTH_KEYS.STUDENT.TOKEN, targetToken);
    localStorage.setItem(AUTH_KEYS.STUDENT.USER, JSON.stringify(targetUser));
  } else if (targetRole === 'SCHOOL_ADMIN') {
    localStorage.setItem(AUTH_KEYS.SCHOOL_ADMIN.TOKEN, targetToken);
    localStorage.setItem(AUTH_KEYS.SCHOOL_ADMIN.USER, JSON.stringify(targetUser));
  }
};

export const stopImpersonation = () => {
  const adminToken = localStorage.getItem("original_admin_token");
  const adminUser = localStorage.getItem("original_admin_user");
  const adminType = localStorage.getItem("original_admin_type");

  // Clear current impersonation session
  localStorage.removeItem("lms_token");
  localStorage.removeItem("lms_user");
  localStorage.removeItem("school_admin_token");
  localStorage.removeItem("school_admin_user");
  localStorage.removeItem("is_impersonating");
  localStorage.removeItem("original_admin_token");
  localStorage.removeItem("original_admin_user");
  localStorage.removeItem("original_admin_type");

  if (adminToken && adminType) {
    // Restore original session
    const key = adminType === 'SUPER' ? AUTH_KEYS.SUPER_ADMIN : AUTH_KEYS.SCHOOL_ADMIN;
    localStorage.setItem(key.TOKEN, adminToken);
    localStorage.setItem(key.USER, adminUser || "");
    
    // Redirect to correct dashboard with a full reload to clear all React states
    window.location.href = key.DASHBOARD_PATH;
  } else {
    window.location.href = AUTH_KEYS.STUDENT.LOGIN_PATH;
  }
};
