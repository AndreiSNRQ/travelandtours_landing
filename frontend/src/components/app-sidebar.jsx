import {
  LifeBuoy,
  BookOpenCheckIcon,
  Gauge,
  User,
  LogsIcon,
  ScrollText,
  ShieldCheck,
  LayoutGrid,
  MapIcon,
  MapPin,
  History
} from "lucide-react"

import { Link } from 'react-router'
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { NavSecondary } from "@/components/nav-secondary"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { Skeleton } from '@/components/ui/skeleton'

import AuthContext from "../context/AuthProvider"
import { useContext } from "react"

import logo from '@/assets/joli_cropped.png'

const data = {
  superAdminNav: [
    {
      NavGroup: {
        NavLabel: 'Enterprise Directory',
        NavItems: [
          {
            title: "Dashboard",
            url: "/sa",
            icon: Gauge,
          },
          {
            title: "User Management",
            url: '/sa/users',
            icon: User,
          },
          {
            title: "Domain Gateway",
            url: '/sa/domains',
            icon: LayoutGrid,
          },
        ],
      }
    },
    {
      NavGroup: {
        NavLabel: 'Human Resources Reports',
        NavItems: [
          {
            title: "HR4 Audit Logs",
            url: '/sa/audit-logs',
            icon: ScrollText,
          },
        ],
      }
    },
    {
      NavGroup: {
        NavLabel: 'Vehicle Reservations',
        NavItems: [
          {
            title: "Vehicle Reservation",
            url: '/sa/fms/vr',
            icon: MapIcon,
          },
          {
            title: "Operational Reports",
            url: '/sa/fms/or',
            icon: ShieldCheck,
          },
        ],
      }
    },
    {
      NavGroup: {
        NavLabel: 'Project Logistic Tracker',
        NavItems: [
          {
            title: "Internal Asset Deployment",
            url: '/sa/AssetDeploymentTracker',
            icon: MapPin,
          },
        ],
      }
    },
    {
      NavGroup: {
        NavLabel: 'Document Tracking & Logistics Records',
        NavItems: [
          {
            title: "Logistics Reports",
            url: '/sa/LogisticsReports',
            icon: History,
          },
        ],
      }
    },
  ],
  navSecondary: [
    {
      title: "System Logs",
      url: "/sa/audit",
      icon: LogsIcon,
    },
  ],
}

export function AppSidebar({ ...props }) {
  const { auth, logout, loading } = useContext(AuthContext)
  const user = {
    name: auth?.name,
    role: auth?.role,
    avatar: null,
    email: auth?.email
  }

  return (
    <Sidebar collapsible="icon" {...props} className="rounded-md">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link to="/" className="flex justify-center">
              <img src={logo} className="h-10  object-scale-down" alt="" />
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="flex flex-col gap-2">

        {loading ? (
          <div className="flex flex-col gap-2 px-2 h-full">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="flex-1 w-full" />
          </div>
        ) : (
          <>
            {user.role === "Super Admin" ?
              (<NavMain data={data.superAdminNav} />)
              : null}
          </>
        )
        }
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>
        {loading ?
          (<Skeleton className="w-full h-8" />) : (<NavUser user={user} logout={logout} />)
        }
      </SidebarFooter>
    </Sidebar>
  );
}
