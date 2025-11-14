"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FiUser, FiLogOut } from "react-icons/fi";
import { MdDashboard } from "react-icons/md";
import { createClient } from "@/lib/supabase/client";
import { terminal } from "../../app/fonts/fonts";
import type { User } from "@supabase/supabase-js";

interface UserProfileDropdownProps {
  isMobile?: boolean;
  onMenuClose?: () => void;
}

export default function UserProfileDropdown({ isMobile = false, onMenuClose }: UserProfileDropdownProps) {
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Fetch user's first name from applicants table
          const { data: applicantData } = await supabase
            .from("applicants")
            .select("first_name")
            .eq("user_id", user.id)
            .single();

          if (applicantData?.first_name) {
            setFirstName(applicantData.first_name);
          } else {
            // Fallback to email username if no first name
            setFirstName(user.email?.split("@")[0] || "User");
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setFirstName("");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Close dropdown when clicking outside
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

  if (loading) {
    return null;
  }

  // If no user, show login button
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

  // Mobile version - integrated into hamburger menu
  if (isMobile) {
    return (
      <div className="flex flex-col space-y-1 border-t border-white/10 pt-4 mt-4">
        <div className={`${terminal.className} text-yellow-400 text-center py-3 text-sm tracking-wider`}>
          Hello, {firstName}!
        </div>
        <Link
          href="/dashboard"
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
          DASHBOARD
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

  // Desktop version - dropdown menu
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
          {/* Greeting */}
          <div className={`${terminal.className} px-4 py-3 border-b border-white/10 bg-gradient-to-r from-rh-yellow/10 to-rh-orange/10`}>
            <p className="text-rh-yellow text-sm tracking-wider">
              Hello, {firstName}!
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/dashboard"
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
              Dashboard
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
