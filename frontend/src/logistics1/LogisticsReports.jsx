// LogisticsReports.jsx - activity monitoring dashboard
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { logisticsI } from "@/api/logisticsI";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Download } from "lucide-react";

const PER_PAGE = 50;

const MODULE_GROUPS = [
  { value: "all", label: "All Modules", modules: [] },
  {
    value: "inventory",
    label: "Inventory and Stock",
    modules: [
      "equipment",
      "equipment-category",
      "storage-location",
      "lowstock-requests",
      "inactive-equipment",
      "equipment-issues",
    ],
  },
  { value: "department-requests", label: "Department Requests", modules: ["department-requests"] },
  {
    value: "assets",
    label: "Assets and Maintenance",
    modules: [
      "asset",
      "assets",
      "maintenance",
      "maintenance-alert",
      "maintenance-alerts",
      "damage-reports",
      "asset-loss",
    ],
  },
  { value: "asset-repair", label: "Asset Repair", modules: ["asset-repair-requests"] },
  {
    value: "deployment",
    label: "Deployment",
    modules: ["asset-deployment", "equipment-schedule", "assign-equipment-to-tour"],
  },
  {
    value: "vehicles",
    label: "Vehicle Management",
    modules: [
      "vehicles",
      "vehicle-maintenance",
      "vehicle-repair-requests",
      "vehicle-loss",
      "vehicle-disposal-data",
    ],
  },
  {
    value: "vendor",
    label: "Vendor and Supplier",
    modules: [
      "admin/vendors",
      "vendor",
      "supplier",
      "supplier-portal",
      "supplier-portal-simple",
      "supplier-requests",
      "supplier-items",
      "core2-suppliers",
      "bidding",
      "admin/bidding-requests",
      "admin/supplier",
    ],
  },
  {
    value: "procurement",
    label: "Procurement",
    modules: [
      "purchase-requests",
      "purchase-orders",
      "order-items",
      "order-reports",
      "received-orders",
      "expenses",
    ],
  },
  {
    value: "reports",
    label: "Reports and Documents",
    modules: ["dtrs", "logistics-reports", "delivery-receipts", "equipment-logs", "fleet-documents"],
  },
  { value: "delivery", label: "Delivery", modules: ["delivery", "deliveries"] },
];

const ACTION_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "success", label: "Success" },
  { value: "error", label: "Error" },
];

const getLocalDateInputValue = (date = new Date()) => {
  const tzOffsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 10);
};

export default function LogisticsReports() {
  const DEFAULT_ACTOR_NAME = "System";
  const DEFAULT_ACTOR_EMAIL = "";

  const [activityStartDate, setActivityStartDate] = useState(() => getLocalDateInputValue());
  const [activityEndDate, setActivityEndDate] = useState(() => getLocalDateInputValue());
  const [activityRangeMode, setActivityRangeMode] = useState("range");
  const [activityModuleGroup, setActivityModuleGroup] = useState("all");
  const [activityActionFilter, setActivityActionFilter] = useState("all");
  const [activityStatusFilter, setActivityStatusFilter] = useState("all");
  const [activitySearch, setActivitySearch] = useState("");
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityMeta, setActivityMeta] = useState({ current_page: 1, last_page: 1, per_page: PER_PAGE, total: 0 });
  const [activityPage, setActivityPage] = useState(1);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState("");
  const [activitySummary, setActivitySummary] = useState(null);

  const activityFetchingRef = useRef(false);
  const activitySearchDidMountRef = useRef(false);

  useEffect(() => {
    if (activityRangeMode !== "all" && activityStartDate && activityEndDate && activityStartDate > activityEndDate) {
      setActivityEndDate(activityStartDate);
    }
  }, [activityStartDate, activityEndDate, activityRangeMode]);

  useEffect(() => {
    fetchActivityLogs(1);
    fetchActivitySummary();
    setActivityPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityRangeMode, activityStartDate, activityEndDate, activityModuleGroup, activityActionFilter, activityStatusFilter]);

  useEffect(() => {
    if (!activitySearchDidMountRef.current) {
      activitySearchDidMountRef.current = true;
      return;
    }
    const handle = setTimeout(() => {
      fetchActivityLogs(1);
      setActivityPage(1);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activitySearch]);

  function getAuthHeaders() {
    const token = localStorage.getItem("token") || "";
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }

  const buildActivityParams = (page, includePaging = true) => {
    const params = {
      search: activitySearch || undefined,
      action: activityActionFilter !== "all" ? activityActionFilter : undefined,
      status_class: activityStatusFilter !== "all" ? activityStatusFilter : undefined,
    };

    if (activityRangeMode === "all") {
      params.range = "all";
    } else {
      params.start_date = activityStartDate;
      params.end_date = activityEndDate;
    }

    const selectedGroup = MODULE_GROUPS.find((group) => group.value === activityModuleGroup);
    if (selectedGroup && selectedGroup.modules.length > 0) {
      params.module_in = selectedGroup.modules.join(",");
    }

    if (includePaging) {
      params.page = page;
      params.per_page = PER_PAGE;
    }

    return params;
  };

  async function fetchActivityLogs(page = 1) {
    if (activityFetchingRef.current) return;
    activityFetchingRef.current = true;
    setActivityLoading(true);
    setActivityError("");

    try {
      const response = await axios.get(logisticsI.backend.api.adminActivityLogs, {
        params: buildActivityParams(page, true),
        ...(getAuthHeaders()),
      });

      if (response.data?.success) {
        const meta = response.data?.meta || { current_page: page, last_page: 1, per_page: PER_PAGE, total: 0 };
        setActivityLogs(Array.isArray(response.data?.data) ? response.data.data.filter(Boolean) : []);
        setActivityMeta(meta);
        setActivityPage(Number(meta?.current_page) || page);
      } else {
        setActivityLogs([]);
        setActivityMeta({ current_page: page, last_page: 1, per_page: PER_PAGE, total: 0 });
        setActivityPage(page);
        setActivityError(response.data?.message || "Failed to fetch system activity logs.");
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to fetch system activity logs.";
      setActivityLogs([]);
      setActivityMeta({ current_page: page, last_page: 1, per_page: PER_PAGE, total: 0 });
      setActivityPage(page);
      setActivityError(message);
      console.error("Failed to fetch activity logs", error);
    } finally {
      setActivityLoading(false);
      activityFetchingRef.current = false;
    }
  }

  async function fetchActivitySummary() {
    try {
      const response = await axios.get(logisticsI.backend.api.adminActivityLogsSummary, {
        params: buildActivityParams(1, false),
        ...(getAuthHeaders()),
      });
      if (response.data?.success) {
        setActivitySummary(response.data?.data || null);
      } else {
        setActivitySummary(null);
      }
    } catch (error) {
      setActivitySummary(null);
      console.error("Failed to fetch activity summary", error);
    }
  }

  async function downloadActivityReport() {
    try {
      const response = await axios.get(logisticsI.backend.api.adminActivityLogsExport, {
        params: { ...buildActivityParams(1, false), limit: 10000 },
        responseType: "blob",
        ...(getAuthHeaders()),
      });

      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const label = activitySummary?.date || (activityRangeMode === "all" ? "all" : `${activityStartDate}-to-${activityEndDate}`);
      link.download = `activity-logs-${label}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download activity logs", error);
    }
  }

  const formatActivityDateTime = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleString();
  };

  const goToActivityPage = async (page) => {
    const target = Math.max(1, Math.min(page, Number(activityMeta?.last_page) || 1));
    setActivityPage(target);
    fetchActivityLogs(target);
  };

  const getCategoryLabel = (module) => {
    const mod = String(module || "").toLowerCase();

    if (mod.startsWith("equipment") || ["storage-location", "equipment-category", "lowstock-requests", "inactive-equipment", "equipment-issues"].includes(mod)) {
      return "Inventory";
    }
    if (mod.startsWith("asset-deployment") || mod.startsWith("equipment-schedule") || mod === "assign-equipment-to-tour") {
      return "Deployment";
    }
    if (mod.startsWith("asset-repair")) {
      return "Asset Repair";
    }
    if (mod.startsWith("asset-disposal")) {
      return "Asset Disposal";
    }
    if (mod.startsWith("asset-loss")) {
      return "Asset Loss";
    }
    if (mod.startsWith("asset") || mod === "assets") {
      return "Assets";
    }
    if (mod.startsWith("vehicle-maintenance")) {
      return "Vehicle Maintenance";
    }
    if (mod.startsWith("vehicle-repair")) {
      return "Vehicle Repair";
    }
    if (mod.startsWith("vehicle-disposal")) {
      return "Vehicle Disposal";
    }
    if (mod.startsWith("vehicle-loss")) {
      return "Vehicle Loss";
    }
    if (mod.startsWith("vehicle") || mod === "vehicles") {
      return "Vehicle";
    }
    if (mod === "admin/vendors" || mod.startsWith("vendor")) {
      return "Vendor";
    }
    if (mod.includes("supplier")) {
      return "Supplier";
    }
    if (mod.startsWith("purchase") || mod.startsWith("order") || mod.startsWith("expense") || mod.startsWith("bidding")) {
      return "Procurement";
    }
    if (mod.startsWith("maintenance")) {
      return "Maintenance";
    }
    if (mod.startsWith("delivery") || mod === "deliveries") {
      return "Delivery";
    }
    if (mod.startsWith("dtrs") || mod.startsWith("logistics-reports") || mod.startsWith("fleet-documents") || mod.startsWith("delivery-receipts") || mod.startsWith("equipment-logs")) {
      return "Reports";
    }
    if (mod.startsWith("department-requests")) {
      return "Department Requests";
    }
    return "Other";
  };

  const extractDetails = (log) => {
    let meta = {};
    try {
      if (log?.metadata && typeof log.metadata === "object") meta = log.metadata;
      else if (log?.metadata) meta = JSON.parse(log.metadata);
    } catch (e) {
      meta = {};
    }

    const payload = meta?.payload && typeof meta.payload === "object" ? meta.payload : {};
    const route = meta?.route_params && typeof meta.route_params === "object" ? meta.route_params : {};

    const pairs = [];
    const pick = (label, value) => {
      if (value === undefined || value === null || value === "") return;
      pairs.push(`${label}: ${value}`);
    };

    const name = payload.item_name || payload.equipment_name || payload.asset_name || payload.vehicle_name || payload.name || payload.title;
    pick("Item", name);
    if (payload.quantity !== undefined) pick("Qty", payload.quantity);
    if (payload.qty !== undefined) pick("Qty", payload.qty);
    if (payload.stock_quantity !== undefined) pick("Stock", payload.stock_quantity);
    if (payload.inactive_quantity !== undefined) pick("Inactive", payload.inactive_quantity);
    if (payload.reorder_level !== undefined) pick("Reorder", payload.reorder_level);
    if (payload.overstock_level !== undefined) pick("Overstock", payload.overstock_level);
    if (payload.status) pick("Status", payload.status);
    if (payload.vendor_status) pick("Vendor", payload.vendor_status);
    if (payload.priority_status) pick("Priority", payload.priority_status);
    if (payload.approval_status) pick("Approval", payload.approval_status);
    if (payload.request_status) pick("Request", payload.request_status);
    if (payload.deployment_status) pick("Deployment", payload.deployment_status);
    if (payload.disposal_status) pick("Disposal", payload.disposal_status);
    if (payload.repair_status) pick("Repair", payload.repair_status);
    if (payload.maintenance_status) pick("Maintenance", payload.maintenance_status);
    if (payload.reason) pick("Reason", payload.reason);
    if (payload.notes) pick("Notes", payload.notes);
    if (payload.description && !name) pick("Desc", payload.description);
    if (payload.approved !== undefined) pick("Approved", payload.approved);
    if (payload.rejected !== undefined) pick("Rejected", payload.rejected);
    if (payload.vehicle_uuid) pick("Vehicle", payload.vehicle_uuid);
    if (payload.asset_code) pick("Asset", payload.asset_code);
    if (payload.serial_number) pick("Serial", payload.serial_number);

    if (route?.id) pick("ID", route.id);

    return pairs.length > 0 ? pairs.join(" | ") : "--";
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans antialiased text-slate-900">
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Document Tracking and Logistics Records</p>
          <h1 className="text-3xl font-extrabold text-slate-900">Logistics Monitoring</h1>
          <p className="text-sm text-slate-500 max-w-3xl">
            Monitor inventory, assets, vendor actions, maintenance, repairs, deployment, and disposal history in one place.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col gap-5">
            <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">System Activity Monitor</h3>
                <p className="text-xs text-slate-500">All POST/PUT/PATCH/DELETE events across the platform</p>
              </div>

              <div className="flex flex-wrap gap-3 items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Range</p>
                  <Select value={activityRangeMode} onValueChange={(value) => setActivityRangeMode(value)}>
                    <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-lg px-3 text-sm">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="range">Date Range</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start</p>
                  <Input
                    type="date"
                    value={activityStartDate}
                    onChange={(e) => setActivityStartDate(e.target.value)}
                    disabled={activityRangeMode === "all"}
                    className="h-10 bg-slate-50 border-slate-200 rounded-lg px-3 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">End</p>
                  <Input
                    type="date"
                    value={activityEndDate}
                    onChange={(e) => setActivityEndDate(e.target.value)}
                    disabled={activityRangeMode === "all"}
                    className="h-10 bg-slate-50 border-slate-200 rounded-lg px-3 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Module</p>
                  <Select value={activityModuleGroup} onValueChange={(value) => setActivityModuleGroup(value)}>
                    <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-lg px-3 text-sm">
                      <SelectValue placeholder="Module group" />
                    </SelectTrigger>
                    <SelectContent>
                      {MODULE_GROUPS.map((group) => (
                        <SelectItem key={group.value} value={group.value}>
                          {group.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action</p>
                  <Select value={activityActionFilter} onValueChange={(value) => setActivityActionFilter(value)}>
                    <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-lg px-3 text-sm">
                      <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                  <Select value={activityStatusFilter} onValueChange={(value) => setActivityStatusFilter(value)}>
                    <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-lg px-3 text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search</p>
                  <Input
                    placeholder="Item, module, actor"
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    className="h-10 bg-slate-50 border-slate-200 rounded-lg px-3 text-sm max-w-xs"
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    fetchActivityLogs(1);
                    fetchActivitySummary();
                    setActivityPage(1);
                  }}
                  disabled={activityLoading}
                  className="h-10 rounded-lg border-slate-200 font-black uppercase text-[10px] tracking-widest"
                >
                  <RefreshCw size={14} className={`mr-2 ${activityLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>

                <Button
                  onClick={downloadActivityReport}
                  className="bg-slate-900 hover:bg-slate-800 h-10 rounded-lg text-white px-4 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-slate-200"
                >
                  <Download size={14} className="mr-2" />
                  Download CSV
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total events</p>
                <p className="text-lg font-black text-slate-900 tracking-tighter">{activitySummary?.total_events ?? "--"}</p>
                <p className="text-[10px] text-slate-400">Range: {activitySummary?.date || (activityRangeMode === "all" ? "all" : `${activityStartDate} to ${activityEndDate}`)}</p>
              </div>
              <div className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Success</p>
                <p className="text-lg font-black text-emerald-600 tracking-tighter">{activitySummary?.success_events ?? "--"}</p>
              </div>
              <div className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Errors</p>
                <p className="text-lg font-black text-rose-600 tracking-tighter">{activitySummary?.error_events ?? "--"}</p>
              </div>
              {(activitySummary?.by_category || []).slice(0, 6).map((item) => (
                <div key={item.category} className="px-4 py-3 rounded-xl border border-slate-200 bg-white">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.category}</p>
                  <p className="text-lg font-black text-slate-800 tracking-tighter">{item.count}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-2">
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50 border-none">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14 pl-6">Date and Time</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actor</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">
                      Loading logs...
                    </TableCell>
                  </TableRow>
                ) : activityError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-rose-600 font-bold text-xs">
                      {activityError}
                    </TableCell>
                  </TableRow>
                ) : activityLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No tracked actions for this range.
                    </TableCell>
                  </TableRow>
                ) : (
                  activityLogs.map((log) => {
                    const action = (log?.action || "unknown").toLowerCase();
                    const actionStyle = action === "create"
                      ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                      : action === "update"
                        ? "text-indigo-600 bg-indigo-50 border-indigo-100"
                        : action === "delete"
                          ? "text-rose-600 bg-rose-50 border-rose-100"
                          : "text-slate-600 bg-slate-50 border-slate-200";
                    const statusCode = Number(log?.status_code);
                    const isError = Number.isFinite(statusCode) && statusCode >= 400;

                    const displayName = log?.actor_name || log?.actor_email || DEFAULT_ACTOR_NAME;
                    const displayEmail = log?.actor_email || (log?.actor_name ? "" : DEFAULT_ACTOR_EMAIL);
                    const category = getCategoryLabel(log?.module);

                    return (
                      <TableRow key={log.id} className="hover:bg-slate-50 group border-slate-100 transition-colors">
                        <TableCell className="font-black text-slate-800 text-xs pl-6">
                          <div className="flex flex-col">
                            <span>{formatActivityDateTime(log.created_at)}</span>
                            <span className="text-[10px] text-slate-400">{log.module || "--"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-700">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600">
                            {category}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-700">
                          <div className="flex flex-col">
                            <span className="truncate max-w-[14rem]">{displayName}</span>
                            <span className="text-[10px] text-slate-500 truncate max-w-[14rem]">{displayEmail}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{log.actor_type || "unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${actionStyle}`}>
                              {action}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isError ? "text-rose-600" : "text-emerald-600"}`}>
                              {Number.isFinite(statusCode) ? `Status ${statusCode}` : "Status --"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          <div className="flex flex-col gap-2">
                            <span className="font-semibold text-slate-700">{log.description || "--"}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{extractDetails(log)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Page {Number(activityMeta?.current_page) || activityPage} of {Number(activityMeta?.last_page) || 1} - {Number(activityMeta?.total) || 0} events
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                disabled={activityLoading || (Number(activityMeta?.current_page) || activityPage) <= 1}
                onClick={() => goToActivityPage((Number(activityMeta?.current_page) || activityPage) - 1)}
                className="h-9 px-4 rounded-lg border-slate-200 font-bold text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={activityLoading || (Number(activityMeta?.current_page) || activityPage) >= (Number(activityMeta?.last_page) || 1)}
                onClick={() => goToActivityPage((Number(activityMeta?.current_page) || activityPage) + 1)}
                className="h-9 px-4 rounded-lg border-slate-200 font-bold text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
