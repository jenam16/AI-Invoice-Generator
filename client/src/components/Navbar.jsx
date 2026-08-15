import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  useUser,
  useAuth,
  useClerk,
  SignedOut,
} from "@clerk/clerk-react";

import { navbarStyles } from "../assets/dummyStyles";
import logo from "../assets/logo.png";

import { Link, replace, useNavigate } from "react-router-dom";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { user } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const clerk = useClerk();

  const navigate = useNavigate();

  const profileRef = useRef(null);

  const TOKEN_KEY = "token";

  const fetchAndStoreToken = useCallback(async () => {
    try {
      if (!getToken) {
        return null;
      }

      const token = await getToken().catch(() => null);

      if (token) {
        try {
          localStorage.setItem(TOKEN_KEY, token);
          console.log("Token stored in localStorage");
        } catch (e) {
          console.error("Error storing token in localStorage:", e);
        }
        return token;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }, [getToken]);

  // keep the localstorage token in sync with clerk state

  useEffect(() => {
    let mounted = true;

    const syncToken = async () => {
      if (isSignedIn) {
        const token = await fetchAndStoreToken().catch(() => null);

        if (!token && mounted) {
          await fetchAndStoreToken().catch(() => null);
        }
      } else {
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {}
      }
    };

    syncToken();

    return () => {
      mounted = false;
    };
  }, [isSignedIn, user, fetchAndStoreToken]);

  // after successfull login redirect to dashboard

  useEffect(() => {
    if (isSignedIn) {
      const pathName = window.location.pathname || "/";
      if (
        pathName === "/login" ||
        pathName === "/signup" ||
        pathName === "/"
      ) {
        navigate("/app/dashboard", { replace: true });
      }
    }
  }, [isSignedIn, navigate]);

  // Close profile popover on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("touchstart", onDocClick);
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("touchstart", onDocClick);
    };
  }, [profileOpen]);

  function openSignIn() {
    try {
      if (
        clerk &&
        typeof clerk.openSignIn === "function"
      ) {
        clerk.openSignIn();
      } else {
        navigate("/login");
      }
    } catch (e) {
      console.error("Sign in error:", e);
      navigate("/login");
    }
  }

  // to open signup 
  function openSignUp() {
    try {
      if (
        clerk &&
        typeof clerk.openSignUp === "function"
      ) {
        clerk.openSignUp();
      } else {
        navigate("/signup");
      }
    } catch (e) {
      console.error("Sign up in error:", e);
      navigate("/signup");
    }
  }

  return (
    <header className={navbarStyles.header}>
      <div className={navbarStyles.Container}>
        <nav className={navbarStyles.nav}>
          {/* Logo */}
          <div className={navbarStyles.logoSection}>
            <Link
              to="/"
              className={navbarStyles.logoLink}
            >
              <img
                src={logo}
                alt="logo"
                className={navbarStyles.logoImage}
              />

              <span className={navbarStyles.logoText}>
                Invoice AI
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className={navbarStyles.desktopNav}>
              <a
                href="#features"
                className={navbarStyles.navLink}
              >
                Features
              </a>

              <a
                href="#pricing"
                className={navbarStyles.navLink}
              >
                Pricing
              </a>
            </div>
          </div>

          {/* Auth */}
          <div className="flex items-center gap-4">
            <div className={navbarStyles.authSection}>
              <SignedOut>
                <button
                  onClick={openSignIn}
                  className={navbarStyles.signInButton}
                >
                  Sign In
                </button>
                <button onClick={openSignUp} className={navbarStyles.signUpButton} type="button">
                  <div className={navbarStyles.signUpOverlay}></div>
                  <span className={navbarStyles.signUptext}>Get Started</span>
                  <svg
                    className={navbarStyles.signUpIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14m-7-7l7 7-7 7" />
                  </svg>
                </button>
              </SignedOut>
            </div>
          </div>
        </nav>
      </div>
    </header> 
  );
};

export default Navbar;