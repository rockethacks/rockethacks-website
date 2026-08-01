"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FiUser, FiLogOut } from "react-icons/fi";
import { MdDashboard } from "react-icons/md";
import { createClient } from "@/lib/supabase/client";
import { staffHome } from "@/lib/auth/routing";
import { terminal } from "../../app/fonts/fonts";
import type { User } from "@supabase/supabase-js";

interface UserProfileDropdownProps {
  isMobile?: boolean;
  onMenuClose?: () => void;
}

type AuthRoleInfo = {
  isAdmin: boolean;
  isOrganizer: boolean;
  isJudge: boolean;
  organizerRole: string | null;
  displayName: string | null;
};

function homeForRole(info: AuthRoleInfo | null): string {
  if (!info) return "/dashboard";
  if (info.isOrganizer) return staffHome(info.organizerRole);
  if (info.isJudge) return "/judge";
  return "/dashboard";
}

function labelForRole(info: AuthRoleInfo | null): string {
  if (!info) return "Dashboard";
  if (info.isAdmin) return "Admin";
  if (info.isOrganizer) return "Staff portal";
  if (info.isJudge) return "Judge portal";
  return "Dashboard";
}

export default function UserProfileDropdown({ isMobile = false, onMenuClose }: UserProfileDropdownProps) {
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [roleInfo, setRoleInfo] = useState<AuthRoleInfo | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        setUser(authUser);

        if (!authUser) {
          setRoleInfo(null);
          setFirstName("");
          return;
        }

        const [roleRes, applicantRes] = await Promise.all([
          fetch("/api/auth/user").then((r) => r.json()),
          supabase
            .from("applicants")
            .select("first_name")
            .eq("user_id", authUser.id)
            .maybeSingle(),
        ]);

        const info: AuthRoleInfo = {
          isAdmin: !!roleRes.isAdmin,
          isOrganizer: !!roleRes.isOrganizer,
          isJudge: !!roleRes.isJudge && !roleRes.isOrganizer,
          organizerRole: roleRes.organizerRole ?? null,
          displayName: roleRes.user?.full_name ?? null,
        };
        // Admins/organizers who are also judges still go to staff home
        if (roleRes.isOrganizer) {
          info.isJudge = false;
        }
        setRoleInfo(info);

        if (applicantRes.data?.first_name) {
          setFirstName(applicantRes.data.first_name);
        } else if (info.displayName) {
          setFirstName(String(info.displayName).split(/\s+/)[0]);
        } else {
          setFirstName(authUser.email?.split("@")[0] || "User");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setFirstName("");
        setRoleInfo(null);
      } else {
        // Refresh role home after login / invite redeem
        loadProfile();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setDropdownOpen(false);
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const homeHref = homeForRole(roleInfo);
  const homeLabel = labelForRole(roleInfo);

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-rh-yellow to-rh-orange hover:from-rh-orange hover:to-rh-yellow transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
        aria-label="Sign in"
      >
        <FiUser size={20} className="text-rh-navy" />
      </Link>
    );
  }

  if (isMobile) {
    return (
      <div className="flex flex-col space-y-1 border-t border-white/10 pt-4 mt-4">
        <div className={`${terminal.className} text-yellow-400 text-center py-3 text-sm tracking-wider`}>
          Hello, {firstName}!
        </div>
        <Link
          href={homeHref}
          onClick={onMenuClose}
          className={`
            ${terminal.className}
            text-lg font-medium tracking-wider
            text-white hover:text-yellow-400
            transition-all duration-200
            py-4 px-6 text-center
            border-b border-white/10
            hover:bg-white/5
            active:bg-white/10
            flex items-center justify-center gap-3
          `}
        >
          <MdDashboard size={20} />
          {homeLabel.toUpperCase()}
        </Link>
        <button
          onClick={() => {
            handleLogout();
            onMenuClose?.();
          }}
          className={`
            ${terminal.className}
            text-lg font-medium tracking-wider
            text-white hover:text-red-400
            transition-all duration-200
            py-4 px-6 text-center
            border-b border-white/10
            hover:bg-white/5
            active:bg-white/10
            flex items-center justify-center gap-3
          `}
        >
          <FiLogOut size={20} />
          LOG OUT
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-rh-yellow to-rh-orange hover:from-rh-orange hover:to-rh-yellow transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
        aria-label="User profile menu"
        aria-expanded={dropdownOpen}
      >
        <FiUser size={20} className="text-rh-navy" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-rh-navy/95 backdrop-blur-md border border-rh-yellow/20 rounded-lg shadow-xl overflow-hidden animate-fade-in z-50">
          <div className={`${terminal.className} px-4 py-3 border-b border-white/10 bg-gradient-to-r from-rh-yellow/10 to-rh-orange/10`}>
            <p className="text-rh-yellow text-sm tracking-wider">
              Hello, {firstName}!
            </p>
          </div>

          <div className="py-2">
            <Link
              href={homeHref}
              onClick={() => setDropdownOpen(false)}
              className={`
                ${terminal.className}
                flex items-center gap-3 px-4 py-3
                text-rh-white hover:text-rh-yellow
                hover:bg-white/5
                transition-all duration-200
                text-sm tracking-wider
              `}
            >
              <MdDashboard size={18} />
              {homeLabel}
            </Link>

            <button
              onClick={handleLogout}
              className={`
                ${terminal.className}
                flex items-center gap-3 px-4 py-3
                text-rh-white hover:text-red-400
                hover:bg-white/5
                transition-all duration-200
                text-sm tracking-wider
                w-full text-left
              `}
            >
              <FiLogOut size={18} />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
