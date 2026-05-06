import { createContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { requestOtp, verifyOtp, fetchUser, logout as apiLogout, resendOtp, getCsrfCookie } from "../api/axios";
import Cookies from "universal-cookie";

const AuthContext = createContext({});

// Used to send the user back to the page they wanted after login
const POST_LOGIN_REDIRECT_KEY = "joli_post_login_redirect";

export const AuthProvider = ({ children }) => {
  const cookies = useMemo(() => new Cookies(), []);
  const navigate = useNavigate();

  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingOtp, setPendingOtp] = useState(null);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [cooldownOtp, setCooldownOtp] = useState(0);
  const [loginCooldownEnd, setLoginCooldownEnd] = useState(0);

  // IDLE TIMEOUT
  const idleTimeoutRef = useRef(null);
  const INACTIVITY_SECONDS = Number(import.meta.env.VITE_IDLE_TIMEOUT_SECONDS) || 120;
  const SESSION_TIMEOUT = false;

  const getUser = useCallback(async () => {
    try {
      const res = await fetchUser();
      setAuth(res.data);
      return res.data;
    } catch {
      setAuth(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getUser();
  }, [getUser]);

  useEffect(() => {
    const initAuth = async () => {
      const user = await getUser();

      if (!user) {
        const otp_email = cookies.get("otp_email");
        const otp_expires_at = cookies.get("otp_expires_at");
        if (otp_email) setPendingOtp({ email: otp_email, expires_at: otp_expires_at });
        else setPendingOtp(null);
      } else {
        setPendingOtp(null);
      }
    };

    initAuth();
  }, [getUser]);

  const login = async (credentials) => {
    try {
      const res = await requestOtp(credentials.email, credentials.password);

      // ✅ OTP skipped: device already verified
      if (res.headers["x-otp-skipped"]) {
        toast.success("Welcome back! Already verified today", { position: "top-center" });
        const user = await getUser();
        if (user) roleAccess(user);
        return;
      }

      toast.success(res.data.message, { position: "top-center" });

      if (res.data.email) {
        setPendingOtp({
          email: res.data.email,
          expires_at: res.data.expires_at,
        });
      } else {
        const user = await getUser();
        if (user) roleAccess(user);
      }
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        if (status === 401 || status === 422) {
          toast.error("Invalid email or password", { position: "top-center" });
        } else if (status === 429) {
          let cooldownEnd = loginCooldownEnd;

          if (cooldownEnd <= Date.now()) {
            const retryAfter = 5;
            cooldownEnd = Date.now() + retryAfter * 1000;
            setLoginCooldownEnd(cooldownEnd);
          }

          const remaining = Math.ceil((cooldownEnd - Date.now()) / 1000);
          toast.info(`Too many attempts. Try again in ${remaining}s`, { position: "top-center" });
        } else {
          toast.error("Server error. Please try again.", { position: "top-center" });
        }
      } else {
        toast.error("Network error. Please check your connection.", { position: "top-center" });
      }
    }
  };

  const verifyLoginOtp = async (otp) => {
    if (!pendingOtp?.email) return;

    try {
      await verifyOtp(pendingOtp.email, otp);
      toast.success("OTP verified! Logging in...", { position: "top-center" });

      const user = await getUser();
      if (user) {
        roleAccess(user);
        setPendingOtp(null);
      } else {
        toast.error("Unable to fetch user info.", { position: "top-center" });
      }
    } catch (error) {
      if (error.response?.status === 422) {
        toast.error(error.response.data.message || "Invalid OTP", { position: "top-center" });
      } else {
        toast.error("Failed to verify OTP. Try again.", { position: "top-center" });
      }
    }
  };

  const resendOtpCode = async () => {
    if (!pendingOtp?.email) {
      toast.error("Missing email. Please log in again.", { position: "top-center" });
      return;
    }

    if (cooldownOtp > 0) {
      toast.info(`Please wait ${cooldownOtp}s before requesting again.`, { position: "top-center" });
      return;
    }

    try {
      setResendingOtp(true);

      const res = await resendOtp(pendingOtp?.email);

      toast.success(res.data.message, { position: "top-center" });

      setCooldownOtp(5);

      setPendingOtp({
        email: res.data.email,
        expires_at: res.data.expires_at,
      });

      const interval = setInterval(() => {
        setCooldownOtp((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      if (err.response?.status === 429) {
        toast.error(err.response.data.message || "Please wait before resending.", { position: "top-center" });
      } else {
        toast.error("Failed to resend OTP. Try again.", { position: "top-center" });
      }
    } finally {
      setResendingOtp(false);
    }
  };

  const roleAccess = (user) => {
    // ✅ Jolitravel customer stays in this frontend
    if (user?.role === "Customer") {
      const redirectTo = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY) || "/";
      sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
      navigate(redirectTo);
      return;
    }

    switch (user?.role) {
      case "HR1 Admin":
        window.location.href = import.meta.env.VITE_HR1_FRONTEND;
        break;
      case "HR2 Admin":
      case "Trainer":
      case "Employee":
        window.location.href = import.meta.env.VITE_HR2_FRONTEND;
        break;
      case "HR3 Admin":
        window.location.href = import.meta.env.VITE_HR3_FRONTEND;
        break;
      case "HR4 Admin":
      case "HR4 Manager":
        window.location.href = import.meta.env.VITE_HR4_FRONTEND;
        break;
      case "LogisticsI Admin":
      case "Manager":
      case "Staff":
        window.location.href = import.meta.env.VITE_LOGISTICSI_FRONTEND;
        break;
      case "Fleet Manager":
      case "Driver":
        window.location.href = import.meta.env.VITE_FLEET_FRONTEND;
        break;
      case "CT1 Admin":
        window.location.href = import.meta.env.VITE_CT1_FRONTEND;
        break;
      case "Vendor":
        break;
      case "Facility Admin":
      case "Legal Admin":
      case "Front Desk Admin":
      case "Administrative Admin":
        window.location.href = import.meta.env.VITE_ADM_FRONTEND;
        break;
      case "Super Admin":
        navigate("/sa");
        break;
      default:
        toast.error("Invalid role. Please contact support.", { position: "top-center" });
    }
  };

  const logout = useCallback(async () => {
    try {
      if (auth) await apiLogout();
    } catch (_) {
      // ignore
    } finally {
      setAuth(null);
      setPendingOtp(null);
      navigate("/login");
    }
  }, [auth, navigate]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    // start new timer
    idleTimeoutRef.current = setTimeout(async () => {
      // auto-logout on inactivity
      if (auth && SESSION_TIMEOUT) {
        toast.info("Logged out due to inactivity.", { position: "top-center" });
        await logout();
      }
    }, INACTIVITY_SECONDS * 1000);
  }, [auth, logout, INACTIVITY_SECONDS, SESSION_TIMEOUT]);

  // Listen for activity
  useEffect(() => {
    if (!auth) {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
      return;
    }

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    const handleVisibility = () => {
      if (!document.hidden) resetIdleTimer();
    };

    events.forEach((ev) => window.addEventListener(ev, resetIdleTimer, { passive: true }));
    document.addEventListener("visibilitychange", handleVisibility);

    resetIdleTimer();

    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
      events.forEach((ev) => window.removeEventListener(ev, resetIdleTimer));
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [auth, resetIdleTimer]);

  const contextValue = useMemo(() => ({
    auth,
    setAuth,
    login,
    verifyLoginOtp,
    resendOtpCode,
    resendingOtp,
    cooldownOtp,
    pendingOtp,
    loading,
    roleAccess,
    logout,
    POST_LOGIN_REDIRECT_KEY,
    getUser,
  }), [auth, login, verifyLoginOtp, resendOtpCode, resendingOtp, cooldownOtp, pendingOtp, loading, roleAccess, logout, getUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
