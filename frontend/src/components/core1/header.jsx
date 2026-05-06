import FadeIn from "@/components/core1/fade-in";

import { Button } from "@/components/ui/button";
import logo from "@/assets/finallogo.avif";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import React, { useContext } from "react";
import { Link } from "react-router";
import AuthContext from "@/context/AuthProvider";

export default function Header() {
  const { auth, logout } = useContext(AuthContext);

  const mainNavItems = [
    { label: "Destination", href: "/booking" },
    { label: "Why Us", href: "#" },
    { label: "Packages", href: "/packages" },
    { label: "Reviews", href: "#" },
    { label: "FAQ", href: "#" },
    { label: "Careers", href: "/jobportal", external: false },
  ];

  const displayName =
    auth?.name ||
    auth?.full_name ||
    auth?.first_name ||
    auth?.email ||
    "Customer";

  const navLinkClass =
    "text-sm font-semibold text-gray-900 hover:text-(--primary) transition";

  return (
    <FadeIn className="flex items-center m-4 justify-between lg:relative">
      <div className="flex items-center bg-white pr-8 rounded-lg shadow-sm">
        <Link to="/">
          <img src={logo} className="w-30" alt="Logo" />
        </Link>
        <h1 className="text-(--primary) text-[20px] font-bold">
          Travel & Tours
        </h1>
      </div>

      {/* ================= DESKTOP ================= */}
      <div className="xl:block hidden bg-white px-8 py-4 rounded-lg shadow-sm">
        <div className="flex gap-10 items-center">
          {mainNavItems.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={navLinkClass}
              >
                {item.label}
              </a>
            ) : (
              <Link key={item.label} to={item.href} className={navLinkClass}>
                {item.label}
              </Link>
            )
          )}

          <div className="flex gap-3 items-center">
            <Button
              variant="outline"
              className="cursor-pointer text-gray-900 border-gray-300 hover:bg-gray-50"
            >
              Contact
            </Button>

            <a
              href="https://front.qrlog1.jampzdev.com/vendor-login"
              target="_blank"
              rel="noopener noreferrer"
              className="text-(--primary) hover:underline text-sm font-semibold"
            >
              Become Our Supplier
            </a>

            {!auth ? (
              <>
                {/* ✅ Register */}
                <Link to="/register">
                  <Button
                    variant="outline"
                    className="cursor-pointer text-gray-900 border-gray-300 hover:bg-gray-50"
                  >
                    Register
                  </Button>
                </Link>

                {/* ✅ Login */}
                <Link to="/login">
                  <Button className="cursor-pointer bg-(--primary) text-white hover:opacity-90">
                    Login
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/my-bookings">
                  <Button
                    variant="outline"
                    className="cursor-pointer text-gray-900 border-gray-300 hover:bg-gray-50"
                  >
                    My Bookings
                  </Button>
                </Link>

                <span className="text-sm font-semibold text-(--primary) bg-(--primary)/10 px-3 py-1 rounded-full">
                  Hi, {displayName}
                </span>

                <Button
                  className="cursor-pointer bg-(--primary) text-white hover:opacity-90 shadow-sm"
                  onClick={logout}
                >
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ================= MOBILE ================= */}
      <div className="xl:hidden bg-white px-6 py-3 rounded-lg shadow-sm">
        <div className="p-2 bg-(--primary) rounded-[5px]">
          <DropdownMenu>
            <DropdownMenuTrigger className="text-white font-semibold">
              Menu
            </DropdownMenuTrigger>

            <DropdownMenuContent className="mr-4 mt-5 w-[240px]">
              {mainNavItems.map((item) => (
                <DropdownMenuItem key={item.label} className="text-gray-900">
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-gray-900 font-semibold"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      className="w-full text-gray-900 font-semibold"
                    >
                      {item.label}
                    </Link>
                  )}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />

              <div className="flex flex-col gap-2 p-2">
                <Button
                  variant="outline"
                  className="cursor-pointer text-gray-900 border-gray-300 hover:bg-gray-50"
                >
                  Contact
                </Button>

                <a
                  href="https://front.qrlog1.jampzdev.com/vendor-login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-(--primary) hover:underline block px-2 py-1 text-sm font-semibold"
                >
                  Become Our Supplier
                </a>

                {!auth ? (
                  <>
                    {/* ✅ Register (mobile) */}
                    <Link to="/register">
                      <Button
                        variant="outline"
                        className="cursor-pointer w-full text-gray-900 border-gray-300 hover:bg-gray-50"
                      >
                        Register
                      </Button>
                    </Link>

                    {/* ✅ Login (mobile) */}
                    <Link to="/login">
                      <Button className="cursor-pointer w-full bg-(--primary) text-white hover:opacity-90">
                        Login
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/my-bookings">
                      <Button
                        variant="outline"
                        className="cursor-pointer w-full text-gray-900 border-gray-300 hover:bg-gray-50"
                      >
                        My Bookings
                      </Button>
                    </Link>

                    <div className="px-2 py-1 text-sm font-semibold text-(--primary) bg-(--primary)/10 rounded-full">
                      Hi, {displayName}
                    </div>

                    <Button
                      className="cursor-pointer w-full bg-(--primary) text-white hover:opacity-90"
                      onClick={logout}
                    >
                      Logout
                    </Button>
                  </>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </FadeIn>
  );
}
