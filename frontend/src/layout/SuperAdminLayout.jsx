import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { ModeToggle } from "@/components/theme-toggler"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Outlet } from "react-router"
import { useContext, useEffect, useState, createContext } from "react"
import { useNavigate } from "react-router"
import AuthContext from "../context/AuthProvider"

import logo from '@/assets/joli_cropped.png'

export default function SuperAdminLayout({ allowedRoles }) {
  const { auth, loading, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [authorized, setAuthorized] = useState(null)

  useEffect(() => {
    if (!loading) {
      if (!auth) {
        setAuthorized(false)
        const timer = setTimeout(() => {
          logout()
        }, 2500)
        return () => clearTimeout(timer)
      } else if (!allowedRoles.includes(auth.role)) {
        setAuthorized(false)
        toast.error("Unauthorized User! Redirecting to login...", {
          position: "top-center",
        });

        const timer = setTimeout(() => {
          logout();
        }, 2500)

        return () => clearTimeout(timer)
      } else {
        setAuthorized(true)
      }
    }
  }, [auth, loading, allowedRoles, logout, navigate])

  if (loading || authorized === null) {
    return (
      <SidebarProvider>
        <title>Loading...</title>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <img src={logo} className="h-10  object-scale-down" alt="" />
            </div>
          </header>

          {/** Main Div */}
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <Skeleton className="h-1/3 w-full" />
            <Skeleton className="h-2/3 w-full" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (authorized === false) {
    return (
      <>
        <p className="p-4">Unauthorized access, redirecting...</p>
      </>
    )
  }

  return (
    <>
      <SidebarProvider>
        <title>JOLI - Admin</title>
        <AppSidebar fixed />
        <SidebarInset className="bg-zinc-50/50 dark:bg-zinc-950/50">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-10 transition-all">
            <div className="flex justify-between w-full items-center px-4">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="h-4 bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tracking-tight text-zinc-500 uppercase">Governance</span>
                  <span className="text-zinc-300 dark:text-zinc-700">/</span>
                  <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">Enterprise Directory</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ModeToggle />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>

        </SidebarInset>
      </SidebarProvider>
    </>
  );
}