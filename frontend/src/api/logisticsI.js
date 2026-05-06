import { configureEcho } from "@laravel/echo-react";
import Echo from "laravel-echo";

const echoConfig = {
    wsPort: 6061,
    wssPort: 6061,
    broadcaster: "reverb",
    key: "luoioknoyyzonvz8gf6o",
    wsHost: "localhost",
    forceTLS: typeof window !== 'undefined' && window.location.protocol === "https:",
    enabledTransports: ["ws", "wss"],
};

// Resolve backend URI with fallback and clear console warning if missing
let backendUri = 'http://localhost:8000';
try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_LOGISTICSI_BACKEND) {
        backendUri = import.meta.env.VITE_LOGISTICSI_BACKEND;
    }
} catch (e) {
    console.warn('[logisticsI] Error reading VITE_LOGISTICSI_BACKEND, using default.', e);
}

export const logisticsI = {
    reverb: {
        ...echoConfig,
        config: () => configureEcho(echoConfig)
    },

    backend: {
        uri: backendUri,
        api: {
            // ============================
            // Smart Warehousing System (SWS)
            // ============================

            // Equipment Routes
            equipment: `${backendUri}/api/equipment`,
            equipmentSearch: `${backendUri}/api/equipment/search`,
            equipmentAdd: `${backendUri}/api/equipment/add`,
            equipmentUpdate: `${backendUri}/api/equipment/change/{id}`,
            equipmentArchive: `${backendUri}/api/equipment/archive/{id}`,
            equipmentActivate: `${backendUri}/api/equipment/activate/{id}`,
            inactiveEquipmentReactivate: `${backendUri}/api/inactive-equipment/{id}/reactivate`,
            equipmentUpdateStock: `${backendUri}/api/equipment/{id}/update-stock`,
            assetUpdateStock: `${backendUri}/api/asset/update-stock`,
            lowStockAlert: `${backendUri}/api/low-stock-alert`,
            overStockAlert: `${backendUri}/api/overstock-alert`,
            categorizeEquipment: `${backendUri}/api/equipment/{equipmentId}/categorize/{categoryId}`,
            archiveOldEquipment: `${backendUri}/api/equipment/{id}/archive-old`,
            // Low stock requests (created from frontend)
            lowStockRequests: `${backendUri}/api/lowstock-requests`,
            // Equipment issues (problem / broke reports)
            equipmentIssues: `${backendUri}/api/equipment-issues`,
            // Equipment issue single-item endpoints
            equipmentIssueShow: `${backendUri}/api/equipment-issues/{id}`,
            equipmentIssueUpdate: `${backendUri}/api/equipment-issues/{id}`,
            equipmentIssueDelete: `${backendUri}/api/equipment-issues/{id}`,

            // Equipment Category Routes
            equipmentCategory: `${backendUri}/api/equipment-category`,
            equipmentCategoryAdd: `${backendUri}/api/equipment-category/add`,
            equipmentCategoryUpdate: `${backendUri}/api/equipment-category/change/{id}`,
            equipmentCategoryArchive: `${backendUri}/api/equipment-category/archive/{id}`,

            // Storage Location Routes
            storageLocation: `${backendUri}/api/storage-location`,
            storageLocationAdd: `${backendUri}/api/storage-location/add`,
            storageLocationUpdate: `${backendUri}/api/storage-location/change/{id}`,
            storageLocationArchive: `${backendUri}/api/storage-location/archive/{id}`,
            storageLocationDelete: `${backendUri}/api/storage-location/{id}`,

            // ================================
            // Procurement & Sourcing Management (PSM)
            // ================================

            // Supplier Management Routes
            suppliers: `${backendUri}/api/suppliers`,
            supplierAdd: `${backendUri}/api/suppliers/add`,
            supplierUpdate: `${backendUri}/api/suppliers/{id}`,
            supplierContact: `${backendUri}/api/suppliers/{supplierId}/contact`,
            supplierRate: `${backendUri}/api/suppliers/{supplierId}/rate`,
            supplierArchive: `${backendUri}/api/suppliers/{id}/archive`,
            supplierActivate: `${backendUri}/api/suppliers/{id}/activate`,
            supplierRequests: `${backendUri}/api/supplier-requests`,
            approveSupplierRequest: `${backendUri}/api/supplier-requests/{id}/approve`,
            rejectSupplierRequest: `${backendUri}/api/supplier-requests/{id}/reject`,
            supplierItems: `${backendUri}/api/supplier-items`,
            supplierItemUpdate: `${backendUri}/api/supplier-items/{id}`,
            core2Suppliers: `${backendUri}/api/core2-suppliers`,
            addSupplier: `${backendUri}/api/core2-suppliers/{id}/add`,
            // Removed accidental duplicates
            // Purchase Request Routes (Procurement)
            purchaseRequests: `${backendUri}/api/purchase-requests`,
            purchaseRequestAdd: `${backendUri}/api/purchase-requests`,
            purchaseRequestUpdate: `${backendUri}/api/purchase-requests/{id}`,
            purchaseRequestApprove: `${backendUri}/api/purchase-requests/{requestId}/approve`,

            // Purchase Order Routes
            purchaseOrders: `${backendUri}/api/purchase-orders`,
            // Issue purchase order: POST /purchase-orders/{requestId}
            purchaseOrderAdd: `${backendUri}/api/purchase-orders/{requestId}`,
            purchaseOrderUpdate: `${backendUri}/api/purchase-orders/{id}`,

            // Order Items Routes
            orderItems: `${backendUri}/api/order-items`,
            orderItemsAdd: `${backendUri}/api/order-items`,
            orderItemCancel: `${backendUri}/api/order-items/{id}/cancel`,
            orderItemReplacement: `${backendUri}/api/order-items/{id}/replacement`,
            orderItemReplaceReceive: `${backendUri}/api/order-items/{id}/replace-receive`,
            orderItemRefund: `${backendUri}/api/order-items/{id}/refund`,

            // Order Reports Routes
            orderReports: `${backendUri}/api/order-reports`,
            orderReportAdd: `${backendUri}/api/order-reports`,
            orderReportUpdate: `${backendUri}/api/order-reports/{id}`,
            orderReportArchive: `${backendUri}/api/order-reports/{id}/archive`,

            // Received Orders Routes
            receivedOrders: `${backendUri}/api/received-orders`,
            receivedOrderAdd: `${backendUri}/api/received-orders`,
            receivedOrderUpdate: `${backendUri}/api/received-orders/{id}`,
            receivedOrderArchive: `${backendUri}/api/received-orders/{id}/archive`,



            // Expense Records Routes
            expenseRecords: `${backendUri}/api/expenses`,
            expenseRecordAdd: `${backendUri}/api/expenses/{orderItemId}/amount`,
            expenseRecordUpdate: `${backendUri}/api/expenses/{id}`,

            // ================================
            // Project Logistic Tracker (PLT)
            // ================================

            // Equipment Scheduling Routes
            equipmentSchedules: `${backendUri}/api/equipment-schedule`,
            equipmentScheduleAdd: `${backendUri}/api/assign-equipment-to-tour`,
            equipmentScheduleUpdate: `${backendUri}/api/equipment-schedule/{id}`,
            equipmentScheduleApprove: `${backendUri}/api/equipment-schedule/{id}/approve`,
            equipmentScheduleProcurementRequest: `${backendUri}/api/equipment-schedule/procurement-request`,
            equipmentScheduleStatusUpdate: `${backendUri}/api/equipment-schedule/{id}/status`,
            equipmentSchedulesByProject: `${backendUri}/api/equipment-schedule/project/{projectId}`,
            equipmentSchedulesByDateRange: `${backendUri}/api/equipment-schedule/date-range`,
            equipmentAvailability: `${backendUri}/api/equipment-availability`,

            // Delivery & Transport Routes
            deliveries: `${backendUri}/api/delivery`,
            deliveryAdd: `${backendUri}/api/delivery`,
            deliveryUpdate: `${backendUri}/api/delivery/{id}`,
            markDelivered: `${backendUri}/api/delivery/{id}/mark-delivered`,

            // ================================
            // Asset Lifecycle & Maintenance (ALMS)
            // ================================

            // Asset Registration & QR Tagging
            assets: `${backendUri}/api/asset`,
            assetAdd: `${backendUri}/api/asset/register`,
            assetUpdate: `${backendUri}/api/asset/{id}`,
            assetArchive: `${backendUri}/api/asset/archive/{id}`,
            projects: `${backendUri}/api/projects`,
            downloadQRCodes: `${backendUri}/api/download-qr-codes`,

            // Maintenance Routes
            maintenance: `${backendUri}/api/maintenance`,
            maintenanceSchedules: `${backendUri}/api/maintenance`,
            maintenanceAdd: `${backendUri}/api/maintenance`,
            maintenanceUpdate: `${backendUri}/api/maintenance/{id}`,
            maintenanceArchive: `${backendUri}/api/maintenance/archive/{id}`,

            // Maintenance Alert Routes
            maintenanceAlerts: `${backendUri}/api/maintenance-alerts`,
            maintenanceAlertsRemind: `${backendUri}/api/maintenance-alerts/remind`,
            maintenanceAlertAdd: `${backendUri}/api/maintenance-alert`,
            maintenanceAlertResolve: `${backendUri}/api/maintenance-alert/{id}/resolve`,
            maintenanceAlertProblemDescriptions: `${backendUri}/api/maintenance-alert/problem-descriptions`,
            maintenanceAlertProblemDescription: `${backendUri}/api/maintenance-alert/{alertId}/problem-description`,
            maintenanceAlertRequestBudget: `${backendUri}/api/maintenance-alert/{id}/request-budget`,
            maintenanceSuggestions: `${backendUri}/api/maintenance-suggestions`,

            // Vehicle Maintenance Routes
            vehicleMaintenanceAlerts: `${backendUri}/api/vehicle-maintenance/alerts`,
            vehicleMaintenanceAlertResolve: `${backendUri}/api/vehicle-maintenance/alerts/{id}/resolve`,
            vehicleMaintenanceProblemDescriptions: `${backendUri}/api/vehicle-maintenance/problem-descriptions`,
            vehicleMaintenanceProblemDescription: `${backendUri}/api/vehicle-maintenance/alerts/{alertId}/problem-description`,
            vehicleMaintenanceRequestBudget: `${backendUri}/api/vehicle-maintenance/alerts/{id}/request-budget`,
            vehicleMaintenanceHistory: `${backendUri}/api/vehicle-maintenance/history`,

            // Vehicle Repair Request Routes
            vehicleRepairRequests: `${backendUri}/api/vehicle-repair-requests`,
            vehicleRepairRequestShow: `${backendUri}/api/vehicle-repair-requests/{id}`,
            vehicleRepairRequestUpdate: `${backendUri}/api/vehicle-repair-requests/{id}`,
            vehicleRepairRequestStatus: `${backendUri}/api/vehicle-repair-requests/{id}/status`,
            vehicleRepairRequestStart: `${backendUri}/api/vehicle-repair-requests/{id}/start`,
            vehicleRepairRequestComplete: `${backendUri}/api/vehicle-repair-requests/{id}/complete`,
            vehicleRepairRequestMarkAvailable: `${backendUri}/api/vehicle-repair-requests/{id}/mark-available`,

            // ================================
            // Document Tracking & Logistics Records (DTRS)
            // ================================

            // Delivery Receipts Routes
            deliveryReceipts: `${backendUri}/api/delivery-receipts`,
            deliveryReceiptAdd: `${backendUri}/api/delivery-receipts`,
            deliveryReceiptUpdate: `${backendUri}/api/delivery-receipts/{id}`,
            deliveryReceiptArchive: `${backendUri}/api/delivery-receipts/archive/{id}`,

            // Equipment Logs Routes
            equipmentLogs: `${backendUri}/api/equipment-logs`,
            equipmentLogAdd: `${backendUri}/api/equipment-logs`,
            equipmentLogUpdate: `${backendUri}/api/equipment-logs/{id}`,
            equipmentLogArchive: `${backendUri}/api/equipment-logs/archive/{id}`,

            // Logistics Reports Routes
            logisticsReports: `${backendUri}/api/logistics-reports`,
            logisticsReportAdd: `${backendUri}/api/logistics-reports`,
            logisticsReportUpdate: `${backendUri}/api/logistics-reports/{id}`,
            logisticsReportArchive: `${backendUri}/api/logistics-reports/archive/{id}`,

            // Fleet Documents Routes
            fleetDocuments: `${backendUri}/api/fleet-documents`,
            fleetDocumentAdd: `${backendUri}/api/fleet-documents`,
            fleetDocumentUpdate: `${backendUri}/api/fleet-documents/{id}`,
            fleetDocumentArchive: `${backendUri}/api/fleet-documents/archive/{id}`,

            // QR Code APIs
            qrAssets: `${backendUri}/api/assets`,
            qrAssetAdd: `${backendUri}/api/assets`,
            qrAssetShow: `${backendUri}/api/assets/{token}`,

            // Vehicle Management APIs
            vehicles: `${backendUri}/api/vehicles`,
            vehiclesAdd: `${backendUri}/api/vehicles`,
            vehiclesUpdate: `${backendUri}/api/vehicles/{vehicle_uuid}`,
            vehiclesPaginate: `${backendUri}/api/vehicles/paginate`,
            vehicleSearch: `${backendUri}/api/vehicles/{vehicle_uuid}`,
            vehiclesDownloadCR: `${backendUri}/api/vehicles/{vehicle_uuid}/download-cr`,

            // Vendor Portal APIs
            vendorRegister: `${backendUri}/api/vendor/register`,
            // health/status endpoint optional, can be used to detect backend availability
            backendHealth: `${backendUri}/api/health`,
            adminVendors: `${backendUri}/api/admin/vendors`,
            adminVendorStatus: `${backendUri}/api/admin/vendors/{id}/status`,
            adminVendorDetails: `${backendUri}/api/admin/vendors/{id}/details`,
            adminVendorContract: `${backendUri}/api/admin/vendors/{id}/contract`,
            adminPendingRequests: `${backendUri}/api/admin/vendors/pending-requests`,
            adminComplianceAlerts: `${backendUri}/api/admin/vendors/compliance-alerts`,
            adminVendorPerformance: `${backendUri}/api/admin/vendors/{id}/performance`,
            adminVendorRating: `${backendUri}/api/admin/vendors/{id}/rating`,
            adminVendorPreference: `${backendUri}/api/admin/vendors/{id}/preference`,
            adminActivityLogs: `${backendUri}/api/admin/activity-logs`,
            adminActivityLogsSummary: `${backendUri}/api/admin/activity-logs/summary`,
            adminActivityLogsExport: `${backendUri}/api/admin/activity-logs/export`,
            adminActivityLogsDailySummary: `${backendUri}/api/admin/activity-logs/daily-summary`,
            adminActivityLogsDailySummaryDownload: `${backendUri}/api/admin/activity-logs/daily-summary/download`,

            supplierNotifications: `${backendUri}/api/supplier/notifications`,
            supplierNotificationRead: `${backendUri}/api/supplier/notifications/{id}/read`,
            supplierNotificationReadAll: `${backendUri}/api/supplier/notifications/read-all`,
            supplierPurchaseOrders: `${backendUri}/api/supplier/purchase-orders`,
            supplierBroadcastRequests: `${backendUri}/api/supplier/broadcast-requests`,
            supplierSubmitInterest: `${backendUri}/api/supplier/submit-interest`,
            supplierProcessOrder: `${backendUri}/api/supplier/purchase-orders/{id}/process`,
            supplierCancelOrder: `${backendUri}/api/supplier/purchase-orders/{id}/cancel`,
            adminPurchaseOrders: `${backendUri}/api/admin/purchase-orders`,
            adminPendingApprovals: `${backendUri}/api/admin/purchase-orders/pending-approvals`,
            supplierBroadcastRequest: `${backendUri}/api/admin/supplier/broadcast-request`,
            adminBroadcastRequests: `${backendUri}/api/admin/supplier/broadcast-requests`,
            adminBroadcastEndBidding: `${backendUri}/api/admin/supplier/broadcast-requests/{id}/end-bidding`,
            adminBroadcastInterests: `${backendUri}/api/admin/broadcast-interests`,
            adminProcessInterestAction: `${backendUri}/api/admin/broadcast-interests/{id}/action`,

            // ================================
            // Finance System Integration (External)
            // ================================
            finance: {
                budgetAllocation: `${backendUri}/api/finance-external-sync?target=budget`,
                accountsReceivable: `${backendUri}/api/finance-external-sync?target=receivable`,
                collections: `${backendUri}/api/finance-external-sync?target=collections`,
                disbursement: `${backendUri}/api/finance-external-sync?target=disbursement`,
                payable: `${backendUri}/api/finance-external-sync?target=payable`
            }
        }
    },
    getImageSrc: (path) => {
        if (!path || typeof path !== 'string') return '';
        if (path.startsWith('data:')) return path;
        if (path.startsWith('http')) return path;
        if (path.startsWith('/storage') || path.startsWith('/uploads')) return `${backendUri}${path}`;
        if (path.startsWith('storage/') || path.startsWith('uploads/')) return `${backendUri}/${path}`;
        return `${backendUri}/storage/${path.startsWith('/') ? path.substring(1) : path}`;
    }
};
