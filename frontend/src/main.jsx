import "./index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { Toaster } from "@/components/ui/sonner";

import { AuthProvider } from "./context/AuthProvider.jsx";
import { ThemeProvider } from "./context/theme-provider";

import LandingPage from "./main/landing";
import BookingPage from "./main/booking.jsx";
import LoginPage from "./main/login";
import NotFound from "./main/not-found";
import RegisterPage from "./main/register";
import MyBookingsPage from "./main/my-bookings.jsx";
import JobPortal from "./main/jobportal";
import PackagesPage from "./main/packages.jsx";

// Super Admin Views
import SuperAdminLayout from "./layout/SuperAdminLayout";
import UserManagement from "./main/super-admin/UserManagement";
import SuperAdminDashboard from "./main/super-admin/Dashboard";
import DomainGateway from "./main/super-admin/DomainGateway";
import AuditLogs from "./main/super-admin/AuditLogs";

// Logistics I Components (Moved from qrlog1)
import AssetDeploymentTracker from "./logistics1/AssetDeploymentTracker";
import LogisticsReports from "./logistics1/LogisticsReports";


// ✅ Floating AI Support Bubble (global)
import AiSupportBubble from "@/components/ai-support/AiSupportBubble";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Toaster richColors />
        <AiSupportBubble />

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/booking/:tourId" element={<BookingPage />} />

          {/* ✅ Tour Packages */}
          <Route path="/packages" element={<PackagesPage />} />

          <Route path="/login" index element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/jobportal" element={<JobPortal />} />

          {/* Super Admin Workspace */}
          <Route path="/sa" element={<SuperAdminLayout allowedRoles={["Super Admin"]} />}>
            <Route index element={<SuperAdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="domains" element={<DomainGateway />} />
            <Route path="audit-logs" element={<AuditLogs />} />

            {/* Project Logistic Tracker & Logistics Records */}
            <Route path="AssetDeploymentTracker" element={<AssetDeploymentTracker />} />
            <Route path="LogisticsReports" element={<LogisticsReports />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  </BrowserRouter>
);
