import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { logisticsI } from '../api/logisticsI';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
    Package,
    MapPin,
    Search,
    Filter,
    RefreshCw,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Wrench,
    Trash2,
    Clock,
    Send,
    Eye,
    ArrowLeft,
    PackagePlus,
    X,
    Building2,
    User,
    CalendarClock,
    History,
    ShieldCheck,
    Mail,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
    Plus,
    Check,
    ChevronsUpDown,
    Tags,
    ClipboardList,
    ChevronRight,
    PackageCheck
} from "lucide-react";

const AssetDeploymentTracker = () => {
    const historyFetchingRef = useRef(false);
    const requestsFetchingRef = useRef(false);
    const availableAssetsFetchingRef = useRef(false);
    const deploymentsFetchingRef = useRef(false);
    const statisticsFetchingRef = useRef(false);

    // State management
    const [assets, setAssets] = useState([]);

    const [deployments, setDeployments] = useState([]);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [selectedAssets, setSelectedAssets] = useState([]);
    const [deploymentForm, setDeploymentForm] = useState({
        asset_id: '',
        department: '',
        floor: '',
        admin_in_charge: '',
        deployment_location: '',
        deployment_purpose: '',
        deployed_by: '',
        deployment_date: new Date().toISOString().split('T')[0],
        expected_return_date: '',
        deployment_type: 'permanent', // 'temporary' or 'permanent'
        notes: '',
        quantity: 1,
        department_request_id: null,
        item_type: 'non-consumable',
        admin_email: ''
    });

    // UI states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('requests');
    const [searchTerm, setSearchTerm] = useState('');
    const [assetSearchTerm, setAssetSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showDeployModal, setShowDeployModal] = useState(false);
    const [showBulkDeployModal, setShowBulkDeployModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedDeployment, setSelectedDeployment] = useState(null);
    const [showRemindersModal, setShowRemindersModal] = useState(false); // NEW
    const [sendingReminders, setSendingReminders] = useState(false); // NEW
    const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);

    // Department Requests State
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    // History Table State
    const [historyData, setHistoryData] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Statistics
    const [statistics, setStatistics] = useState({
        total_deployed: 0,
        in_use: 0,
        dispatched: 0,
        received: 0,
        in_repair: 0,
        under_maintenance: 0,
        lost: 0,
        disposed: 0
    });

    // State for Return Modal
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [selectedDeploymentForReturn, setSelectedDeploymentForReturn] = useState(null);
    const [returnNotes, setReturnNotes] = useState('');


    // Handle Return Asset Confirmation
    const handleConfirmReturn = async () => {
        if (!selectedDeploymentForReturn) return;

        try {
            setLoading(true);
            setError('');

            await axios.put(
                `${logisticsI.backend.uri}/api/asset-deployment/${selectedDeploymentForReturn.id}/return`,
                {
                    notes: returnNotes,
                    returned_by: 'Admin'
                }
            );

            setSuccess('Asset returned successfully!');

            await fetchDeployments();
            await fetchAvailableAssets();

            setShowReturnModal(false);
            setReturnNotes('');
            setSelectedDeploymentForReturn(null);

            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            console.error('Error returning asset:', err);
            setError(err.response?.data?.message || 'Failed to return asset');
        } finally {
            setLoading(false);
        }
    };

    const handleSendReminders = async (deploymentIds) => {
        if (!deploymentIds || deploymentIds.length === 0) return;

        setSendingReminders(true);
        try {
            const response = await axios.post(`${logisticsI.backend.uri}/api/asset-deployment/remind-maintenance`, {
                deployment_ids: deploymentIds
            });

            if (response.data) {
                setSuccess(`Successfully sent ${response.data.emails_sent} reminder emails!`);
                setShowRemindersModal(false);
                fetchDeployments(); // Refresh deployments to update any status changes
            }
        } catch (err) {
            console.error('Error sending reminders:', err);
            setError(err.response?.data?.message || 'Failed to send reminders. Please try again.');
        } finally {
            setSendingReminders(false);
            setTimeout(() => setSuccess(''), 5000);
            setTimeout(() => setError(''), 5000);
        }
    };

    // Load initial data
    useEffect(() => {
        fetchAvailableAssets();
        if (activeTab === 'deployed') {
            fetchDeployments();
        }
        if (activeTab === 'requests') {
            fetchPendingRequests();
        }
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchHistory = async () => {
        if (historyFetchingRef.current) return;
        historyFetchingRef.current = true;
        try {
            setLoadingHistory(true);
            const response = await axios.get(`${logisticsI.backend.uri}/api/asset-deployment/history`);
            setHistoryData(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Error fetching history:', err);
            setHistoryData([]);
        } finally {
            setLoadingHistory(false);
            historyFetchingRef.current = false;
        }
    };



    const fetchPendingRequests = async () => {
        if (requestsFetchingRef.current) return;
        requestsFetchingRef.current = true;
        try {
            setLoadingRequests(true);
            const response = await axios.get(`${logisticsI.backend.uri}/api/asset-deployment/pending-requests`);
            setPendingRequests(response.data || []);
        } catch (err) {
            console.error('Error fetching requests:', err);
        } finally {
            setLoadingRequests(false);
            requestsFetchingRef.current = false;
        }
    };


    // Fetch available assets for deployment
    const fetchAvailableAssets = async () => {
        if (availableAssetsFetchingRef.current) return;
        availableAssetsFetchingRef.current = true;
        try {
            setLoading(true);
            setError('');

            const response = await axios.get(`${logisticsI.backend.uri}/api/asset-deployment/available`);
            const assetData = Array.isArray(response.data) ? response.data : response.data.data || [];

            setAssets(assetData);

            await fetchStatistics();
        } catch (err) {
            console.error('Error fetching assets:', err);
            setError('Failed to load available assets. Please try again.');
        } finally {
            setLoading(false);
            availableAssetsFetchingRef.current = false;
        }
    };


    // Fetch deployments
    const fetchDeployments = async () => {
        if (deploymentsFetchingRef.current) return;
        deploymentsFetchingRef.current = true;
        try {
            setLoading(true);
            const response = await axios.get(`${logisticsI.backend.uri}/api/asset-deployment/deployments`);
            const deploymentData = Array.isArray(response.data) ? response.data : response.data.data || [];

            setDeployments(deploymentData);
        } catch (err) {
            console.error('Error fetching deployments:', err);
            setError('Failed to load deployments.');
        } finally {
            setLoading(false);
            deploymentsFetchingRef.current = false;
        }
    };


    // Fetch statistics
    const fetchStatistics = async () => {
        if (statisticsFetchingRef.current) return;
        statisticsFetchingRef.current = true;
        try {
            const response = await axios.get(`${logisticsI.backend.uri}/api/asset-deployment/statistics`);
            const stats = response.data.statistics || {};

            setStatistics({
                total_deployed: stats.total_deployed || 0,
                in_use: stats.in_use || 0,
                dispatched: stats.dispatched || 0,
                received: stats.received || 0,
                in_repair: stats.in_repair || 0,
                under_maintenance: stats.under_maintenance || 0,
                lost: stats.lost || 0,
                disposed: stats.disposed || 0
            });
        } catch (err) {
            console.error('Error fetching statistics:', err);
        } finally {
            statisticsFetchingRef.current = false;
        }
    };


    // Handle asset deployment
    const handleDeployAsset = async (e) => {
        e.preventDefault();

        if (!selectedAsset) {
            setError('Please select an asset first');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const submissionData = {
                ...deploymentForm,
                asset_id: selectedAsset.is_consumable ? null : selectedAsset.id,
                equipment_id: selectedAsset.is_consumable ? selectedAsset.id : selectedAsset.equipment_id,
                item_type: selectedAsset.is_consumable ? 'consumable' : 'non-consumable',
                quantity: selectedAsset.is_consumable ? deploymentForm.quantity || 1 : 1,
                deployment_location: `${deploymentForm.department} - Floor ${deploymentForm.floor}`,
                expected_return_date: (deploymentForm.deployment_type === 'permanent' || selectedAsset.is_consumable) ? null : deploymentForm.expected_return_date,
                department_request_id: deploymentForm.department_request_id
            };

            await axios.post(
                `${logisticsI.backend.uri}/api/asset-deployment/deploy`,
                submissionData
            );

            if (selectedRequest) {
                // If this deployment was from a request, we might want to update the request status
                // For simplicity, we assume one item fulfillment per request link for now
                // Or user can manually mark it fulfilled in the requests tab
            }

            setSuccess(`${selectedAsset.is_consumable ? 'Consumable' : 'Asset'} ${selectedAsset.asset_code || selectedAsset.equipment_name} deployed successfully!`);

            // Reset form
            setDeploymentForm({
                asset_id: '',
                department: '',
                floor: '',
                admin_in_charge: '',
                admin_email: '',
                deployment_location: '',
                deployment_purpose: '',
                deployed_by: '',
                deployment_date: new Date().toISOString().split('T')[0],
                expected_return_date: '',
                deployment_type: 'permanent',
                notes: '',
                quantity: 1,
                department_request_id: null,
                item_type: 'non-consumable'
            });
            setSelectedAsset(null);
            setSelectedRequest(null);
            setShowDeployModal(false);

            // Refresh data
            await fetchAvailableAssets();

            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            console.error('Error deploying asset:', err);
            setError(err.response?.data?.message || 'Failed to deploy asset');
        } finally {
            setLoading(false);
        }
    };

    const [selectedEquipment, setSelectedEquipment] = useState([]);

    // Group assets by equipment for the dropdown
    const groupedAssets = React.useMemo(() => {
        if (deploymentForm.item_type === 'consumable') {
            return assets.filter(a => a.is_consumable);
        }

        // Group non-consumables by equipment_id
        const groups = {};
        assets.filter(a => !a.is_consumable).forEach(asset => {
            const id = asset.equipment_id || 'unknown';
            if (!groups[id]) {
                groups[id] = {
                    id: asset.equipment_id,
                    name: asset.equipment_name,
                    category: asset.category,
                    count: 0,
                    assets: []
                };
            }
            groups[id].count++;
            groups[id].assets.push(asset);
        });
        return Object.values(groups);
    }, [assets, deploymentForm.item_type]);

    // Handle bulk deployment
    const handleBulkDeploy = async (e) => {
        e.preventDefault();

        if (selectedEquipment.length === 0) {
            setError('Please select at least one item type to deploy');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // Iterate through selected equipment groups
            for (const item of selectedEquipment) {
                if (deploymentForm.item_type === 'consumable') {
                    // Consumable logic (simple quantity)
                    await axios.post(
                        `${logisticsI.backend.uri}/api/asset-deployment/deploy`,
                        {
                            ...deploymentForm,
                            asset_id: null,
                            equipment_id: item.id,
                            item_type: 'consumable',
                            quantity: item.quantity,
                            deployment_location: `${deploymentForm.department} - ${deploymentForm.floor}`, // Construct location string
                            department: deploymentForm.department,
                            floor: deploymentForm.floor, // Ensure separated fields are also sent if backend needs them (it does)
                            expected_return_date: null,
                            department_request_id: selectedRequest?.id || null
                        }
                    );
                } else {
                    // Non-consumable logic (Automatic Asset Assignment)
                    // Find 'quantity' number of available assets for this equipment
                    const group = groupedAssets.find(g => g.id === item.id);
                    if (!group || group.assets.length < item.quantity) {
                        throw new Error(`Not enough available assets for ${item.name}`);
                    }

                    // Take the first X assets
                    const assetsToDeploy = group.assets.slice(0, item.quantity);

                    // Execute sequentially to avoid deadlocks
                    for (const asset of assetsToDeploy) {
                        await axios.post(
                            `${logisticsI.backend.uri}/api/asset-deployment/deploy`,
                            {
                                ...deploymentForm,
                                asset_id: asset.id,
                                equipment_id: asset.equipment_id,
                                item_type: 'non-consumable',
                                quantity: 1,
                                deployment_location: `${deploymentForm.department} - ${deploymentForm.floor}`,
                                department: deploymentForm.department,
                                floor: deploymentForm.floor,
                                department_request_id: selectedRequest?.id || null
                            }
                        );
                    }
                }
            }

            setSuccess(`Successfully deployed items!`);

            // Reset form
            setDeploymentForm({
                asset_id: '',
                department: '',
                floor: '',
                admin_in_charge: '',
                admin_email: '',
                deployment_location: '',
                deployment_purpose: '',
                deployed_by: '',
                deployment_date: new Date().toISOString().split('T')[0],
                expected_return_date: '',
                deployment_type: 'permanent',
                notes: '',
                quantity: 1,
                department_request_id: null,
                item_type: 'non-consumable'
            });
            setSelectedEquipment([]);
            setAssetSearchTerm('');
            setShowBulkDeployModal(false);
            setSelectedRequest(null);

            // Refresh data
            await fetchAvailableAssets();
            if (activeTab === 'deployed') fetchDeployments();

            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            console.error('Error bulk deploying assets:', err);
            setError(err.response?.data?.message || err.message || 'Failed to deploy assets');
        } finally {
            setLoading(false);
        }
    };

    // Handle Reject Request
    const handleRejectRequest = async () => {
        if (!selectedRequest || !rejectionReason.trim()) {
            setError('Please provide a rejection reason.');
            return;
        }

        try {
            setLoading(true);
            await axios.post(`${logisticsI.backend.uri}/api/asset-deployment/requests/${selectedRequest.id}/reject`, {
                rejection_reason: rejectionReason,
                rejected_by: 'Admin'
            });

            setSuccess('Request rejected successfully');
            setShowRejectModal(false);
            setRejectionReason('');
            setSelectedRequest(null);
            fetchPendingRequests();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            console.error('Error rejecting request:', err);
            setError(err.response?.data?.message || 'Failed to reject request');
        } finally {
            setLoading(false);
        }
    };

    // Update deployment status (e.g., mark as received)
    const updateStatus = async (id, newStatus, notes = '') => {
        try {
            await axios.post(`${logisticsI.backend.uri}/api/asset-deployment/status/${id}`, {
                status: newStatus,
                notes: notes || 'Status updated from tracker'
            });
            setSuccess(`Deployment marked as ${newStatus}`);
            fetchDeployments();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to update status');
        }
    };

    // Handle return asset
    const handleReturnAsset = async (deploymentId) => {
        try {
            setLoading(true);
            setError('');

            await axios.put(
                `${logisticsI.backend.uri}/api/asset-deployment/${deploymentId}/return`
            );

            setSuccess('Asset returned successfully!');

            await fetchDeployments();
            await fetchAvailableAssets();

            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            console.error('Error returning asset:', err);
            setError(err.response?.data?.message || 'Failed to return asset');
        } finally {
            setLoading(false);
        }
    };


    // Toggle equipment selection
    const toggleEquipmentSelection = (item) => {
        setSelectedEquipment(prev => {
            const exists = prev.find(p => p.id === item.id);
            if (exists) {
                return prev.filter(p => p.id !== item.id);
            } else {
                return [...prev, {
                    id: item.id,
                    name: deploymentForm.item_type === 'consumable' ? item.equipment_name : item.name,
                    quantity: 1,
                    maxQuantity: deploymentForm.item_type === 'consumable' ? item.stock_quantity : item.count
                }];
            }
        });
    };

    // Update quantity for selected equipment
    const updateEquipmentQuantity = (id, newQty) => {
        setSelectedEquipment(prev => prev.map(item => {
            if (item.id === id) {
                const validQty = Math.max(1, Math.min(newQty, item.maxQuantity));
                return { ...item, quantity: validQty };
            }
            return item;
        }));
    };

    // Toggle asset selection
    const toggleAssetSelection = (assetId) => {
        setSelectedAssets(prev => {
            if (prev.includes(assetId)) {
                return prev.filter(id => id !== assetId);
            } else {
                return [...prev, assetId];
            }
        });
    };

    // Filter assets
    const filteredAssets = assets.filter(asset => {
        const matchesSearch = asset.asset_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Filter assets for bulk deploy dropdown (Now filters grouped assets)
    const filteredGroupsForBulk = groupedAssets.filter(item => {
        const name = deploymentForm.item_type === 'consumable' ? item.equipment_name : item.name;
        return name?.toLowerCase().includes(assetSearchTerm.toLowerCase());
    });

    // Filter active deployments
    const activeDeployments = deployments.filter(deployment => {
        const isActive = ['in_use', 'in_repair', 'under_maintenance', 'dispatched', 'received', 'deployed', 'pending_disposal'].includes(deployment.status);
        const matchesSearch = deployment.asset_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            deployment.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            deployment.deployment_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            deployment.department?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || deployment.status === statusFilter;
        const matchesItemType = deployment.item_type === deploymentForm.item_type;
        return isActive && matchesSearch && matchesStatus && matchesItemType;
    });

    // Filter history records
    const historyRecords = (activeTab === 'history' ? historyData : deployments).filter(deployment => {
        // Handle both history table structure and deployment structure
        const code = deployment.asset_code || '';
        const equip = deployment.equipment_name || '';
        const dept = deployment.department || '';
        const admin = deployment.admin_in_charge || deployment.performed_by || ''; // History has performed_by

        const matchesSearch = code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            equip.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dept.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.toLowerCase().includes(searchTerm.toLowerCase());

        // History specific filtering could go here if needed
        return matchesSearch;
    });


    // Get status badge
    const getStatusBadge = (status) => {
        const statusConfig = {
            in_use: { variant: 'default', label: 'In Use', className: 'bg-blue-100 text-blue-800' },
            dispatched: { variant: 'secondary', label: 'Dispatched', className: 'bg-amber-100 text-amber-800' },
            received: { variant: 'default', label: 'Received', className: 'bg-green-100 text-green-800' },
            in_repair: { variant: 'secondary', label: 'In Repair', className: 'bg-orange-100 text-orange-800' },
            under_maintenance: { variant: 'secondary', label: 'Under Maintenance', className: 'bg-yellow-100 text-yellow-800' },
            lost: { variant: 'destructive', label: 'Lost', className: 'bg-red-100 text-red-800' },
            disposed: { variant: 'outline', label: 'Disposed', className: 'bg-gray-100 text-gray-800' },
            pending_disposal: { variant: 'secondary', label: 'Pending Disposal', className: 'bg-amber-100 text-amber-800' },
            available: { variant: 'default', label: 'Available', className: 'bg-green-100 text-green-800' },
            returned: { variant: 'outline', label: 'Returned', className: 'bg-emerald-100 text-emerald-800' }
        };

        const config = statusConfig[status] || statusConfig.available;
        return <Badge className={config.className}>{config.label}</Badge>;
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Internal Asset Deployment Tracker
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 font-medium">
                                Manage and track assets deployed to JOLI internal departments only (Non-Tour operations)
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {deployments.filter(d => d.item_type === 'non-consumable' && d.days_left !== null && d.days_left <= 7).length > 0 && (
                                <Button
                                    variant="destructive"
                                    className="gap-2 animate-bounce-slow"
                                    onClick={() => setShowRemindersModal(true)}
                                >
                                    <AlertTriangle className="h-4 w-4" />
                                    Maintenance Alerts
                                    <Badge className="ml-1 bg-white text-destructive hover:bg-white">
                                        {deployments.filter(d => d.item_type === 'non-consumable' && d.days_left !== null && d.days_left <= 7).length}
                                    </Badge>
                                </Button>
                            )}
                            <Button
                                onClick={() => setShowBulkDeployModal(true)}
                                className="flex items-center gap-2 bg-primary hover:bg-primary/90 shadow-sm"
                            >
                                <Plus className="h-4 w-4" />
                                New Deployment
                            </Button>
                            <Button
                                onClick={() => {
                                    fetchAvailableAssets();
                                    if (activeTab === 'deployed') fetchDeployments();
                                }}
                                variant="outline"
                                disabled={loading}
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Deployed</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_deployed}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Dispatched</CardTitle>
                            <Send className="h-4 w-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">{statistics.dispatched}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">In Use</CardTitle>
                            <ClipboardList className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{statistics.in_use}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Alerts */}
                {error && (
                    <Alert className="mb-6" variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="mb-6">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

                {/* Main Content with Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 lg:w-auto">
                        <TabsTrigger value="requests" className="relative">
                            Dept Requests
                            {pendingRequests.length > 0 && (
                                <Badge className="ml-2 bg-red-500 text-white h-5 w-5 flex items-center justify-center p-0 text-[10px] absolute -top-1 -right-1">
                                    {pendingRequests.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="deployed">Active Deployments</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>



                    {/* Department Requests Tab */}
                    <TabsContent value="requests" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Pending Department Requests
                                </CardTitle>
                                <CardDescription>Fulfill equipment and supply requests from other departments</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingRequests ? (
                                    <div className="flex justify-center p-8">
                                        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : pendingRequests.length === 0 ? (
                                    <div className="text-center p-12 bg-gray-50 rounded-lg border-2 border-dashed">
                                        <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                        <p className="text-gray-500 font-medium">No pending requests found</p>
                                    </div>
                                ) : (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/50">
                                                    <TableHead>Ref Code</TableHead>
                                                    <TableHead>Department</TableHead>
                                                    <TableHead>Requested By</TableHead>
                                                    <TableHead>Priority</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Items Requested</TableHead>
                                                    <TableHead>Date Requested</TableHead>
                                                    <TableHead>Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pendingRequests.map((req) => (
                                                    <TableRow key={req.id}>
                                                        <TableCell className="font-medium">{req.request_reference}</TableCell>
                                                        <TableCell>{req.department_name}</TableCell>
                                                        <TableCell>{req.requested_by}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={req.priority === 'high' ? 'destructive' : 'default'}>
                                                                {req.priority}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={
                                                                req.status === 'dispatched' ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-blue-100 text-blue-800'
                                                            }>
                                                                {req.status === 'dispatched' ? 'Dispatched' : 'Pending'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="text-xs space-y-1">
                                                                {req.items?.map((item, idx) => (
                                                                    <div key={idx} className="flex gap-1">
                                                                        <span className="font-semibold">{item.quantity_requested}x</span>
                                                                        <span>{item.item_name}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{req.request_date}</TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                {['pending', 'approved', 'reviewed'].includes(req.status) && (
                                                                    <Button
                                                                        size="sm"
                                                                        className="bg-blue-600 hover:bg-blue-700"
                                                                        onClick={() => {
                                                                            setSelectedRequest(req);
                                                                            setDeploymentForm(prev => ({
                                                                                ...prev,
                                                                                department: req.department_name,
                                                                                floor: req.location || '',
                                                                                deployment_location: req.location || '',
                                                                                deployment_purpose: req.purpose || '',
                                                                                admin_in_charge: req.requested_by,
                                                                                admin_email: req.contact_email || req.email || '',
                                                                                department_request_id: req.id,
                                                                                notes: `Fulfilling request ${req.request_reference}`,
                                                                                item_type: 'non-consumable'
                                                                            }));
                                                                            setShowBulkDeployModal(true);
                                                                        }}
                                                                    >
                                                                        Fulfill
                                                                    </Button>
                                                                )}
                                                                {req.status === 'pending' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => {
                                                                            setSelectedRequest(req);
                                                                            setShowRejectModal(true);
                                                                        }}
                                                                    >
                                                                        Reject
                                                                    </Button>
                                                                )}
                                                                {req.status === 'dispatched' && (
                                                                    <span className="text-xs italic text-muted-foreground">Waiting for receipt...</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Deployed Assets Tab */}
                    <TabsContent value="deployed" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5" />
                                    Active Departmental Deployments
                                </CardTitle>
                                <CardDescription>Monitor assets currently assigned to internal departments</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Search and Filter */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search deployments..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="border rounded-md px-3 py-2"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="dispatched">Dispatched (Pending Receipt)</option>
                                        <option value="received">Received</option>
                                        <option value="in_use">In Use</option>
                                        <option value="in_repair">In Repair</option>
                                        <option value="under_maintenance">Under Maintenance</option>
                                        <option value="pending_disposal">Pending Disposal</option>
                                        <option value="lost">Lost</option>
                                        <option value="disposed">Disposed</option>
                                    </select>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={deploymentForm.item_type === 'non-consumable' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setDeploymentForm({ ...deploymentForm, item_type: 'non-consumable' })}
                                        >
                                            Non-Consumable
                                        </Button>
                                        <Button
                                            variant={deploymentForm.item_type === 'consumable' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setDeploymentForm({ ...deploymentForm, item_type: 'consumable' })}
                                        >
                                            Consumables
                                        </Button>
                                    </div>
                                </div>

                                {/* Deployments Table */}
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Item Name</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Quantity</TableHead>
                                                <TableHead>Location</TableHead>
                                                <TableHead>Purpose</TableHead>
                                                <TableHead>Admin In Charge</TableHead>
                                                <TableHead>Deployed By</TableHead>
                                                <TableHead>Date Deployed</TableHead>
                                                <TableHead>Maintenance</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {activeDeployments.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                                        No active deployments found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                activeDeployments.map((deployment) => (
                                                    <TableRow key={deployment.id}>
                                                        <TableCell className="font-medium">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] text-muted-foreground uppercase">{deployment.asset_code}</span>
                                                                <span className="font-bold">{deployment.equipment_name}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={deployment.item_type === 'consumable' ? "bg-amber-50" : "bg-blue-50"}>
                                                                {deployment.item_type === 'consumable' ? "Consumable" : "Asset"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="font-medium">{deployment.quantity || 1} {deployment.unit_measure || 'pcs'}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                {deployment.deployment_location}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="max-w-[150px] truncate">{deployment.deployment_purpose || 'N/A'}</TableCell>
                                                        <TableCell className="font-medium text-blue-700 dark:text-blue-400">
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-1">
                                                                    <User className="h-3 w-3" />
                                                                    {deployment.admin_in_charge || 'N/A'}
                                                                </div>
                                                                {deployment.admin_email && (
                                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                        <Mail className="h-2.5 w-2.5" />
                                                                        {deployment.admin_email}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{deployment.deployed_by || 'N/A'}</TableCell>
                                                        <TableCell>{deployment.deployment_date ? new Date(deployment.deployment_date).toLocaleDateString() : 'N/A'}</TableCell>
                                                        <TableCell>
                                                            {deployment.item_type === 'non-consumable' && (
                                                                <div className="flex flex-col gap-1">
                                                                    {deployment.asset_status === 'maintenance' || deployment.status === 'under_maintenance' ? (
                                                                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] py-0 h-5">
                                                                            Under Maintenance
                                                                        </Badge>
                                                                    ) : deployment.days_left !== null && deployment.days_left < 0 ? (
                                                                        <Badge variant="destructive" className="animate-pulse text-[10px] py-0 h-5">
                                                                            Overdue
                                                                        </Badge>
                                                                    ) : deployment.days_left === 0 ? (
                                                                        <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-[10px] py-0 h-5">
                                                                            Due Today
                                                                        </Badge>
                                                                    ) : deployment.days_left > 0 && deployment.days_left <= 7 ? (
                                                                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] py-0 h-5">
                                                                            Upcoming
                                                                        </Badge>
                                                                    ) : (
                                                                        <span className="text-[10px] text-muted-foreground italic">
                                                                            {deployment.next_maintenance_date ? `Due: ${new Date(deployment.next_maintenance_date).toLocaleDateString()}` : 'No Schedule'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {deployment.item_type === 'consumable' && (
                                                                <span className="text-[10px] text-muted-foreground italic">N/A</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={
                                                                deployment.status === 'received' ? 'bg-green-600 text-white' :
                                                                    deployment.status === 'in_use' ? 'bg-blue-100 text-blue-800' :
                                                                        deployment.status === 'dispatched' ? 'bg-amber-100 text-amber-800' :
                                                                            deployment.status === 'in_repair' ? 'bg-orange-100 text-orange-800' :
                                                                                'bg-emerald-100 text-emerald-800'
                                                            }>
                                                                {deployment.status === 'dispatched' ? 'Dispatched' : deployment.status?.replace('_', ' ') || 'In Use'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex gap-2 justify-end">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setSelectedDeployment(deployment);
                                                                        setShowDetailsModal(true);
                                                                    }}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>

                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>


                    {/* Deployment History Tab */}
                    <TabsContent value="history" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <History className="h-5 w-5 text-primary" />
                                            Deployment History
                                        </CardTitle>
                                        <CardDescription>View all past and current deployment records</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Search and Filter */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search history (Asset, Dept, Admin, Staff)..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="border rounded-md px-3 py-2"
                                    >
                                        <option value="all">All Records</option>
                                        <option value="returned">Returned</option>
                                        <option value="in_use">In Use</option>
                                        <option value="lost">Lost</option>
                                        <option value="disposed">Disposed</option>
                                    </select>
                                </div>

                                {/* History Table */}
                                <div className="border rounded-lg overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="font-bold">Date & Time</TableHead>
                                                <TableHead className="font-bold">Asset / Equipment</TableHead>
                                                <TableHead className="font-bold">Movement Action</TableHead>
                                                <TableHead className="font-bold">Performer</TableHead>
                                                <TableHead className="font-bold">Location</TableHead>
                                                <TableHead className="font-bold">Status Change</TableHead>
                                                <TableHead className="font-bold">Notes</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loadingHistory ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-8">
                                                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
                                                        <p className="mt-2 text-sm text-gray-500">Loading movement history...</p>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (Array.isArray(historyData) ? historyData.filter(h => {
                                                const searchStr = (searchTerm || '').toLowerCase();
                                                return (h.asset_code || '').toLowerCase().includes(searchStr) ||
                                                    (h.equipment_name || '').toLowerCase().includes(searchStr) ||
                                                    (h.action || '').toLowerCase().includes(searchStr) ||
                                                    (h.performed_by || '').toLowerCase().includes(searchStr);
                                            }) : []).length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500 italic">
                                                        No movement history records found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                (Array.isArray(historyData) ? historyData.filter(h => {
                                                    const searchStr = (searchTerm || '').toLowerCase();
                                                    return (h.asset_code || '').toLowerCase().includes(searchStr) ||
                                                        (h.equipment_name || '').toLowerCase().includes(searchStr) ||
                                                        (h.action || '').toLowerCase().includes(searchStr) ||
                                                        (h.performed_by || '').toLowerCase().includes(searchStr);
                                                }) : []).map((record) => (
                                                    <TableRow key={record.id} className="hover:bg-muted/30 transition-colors text-sm">
                                                        <TableCell className="whitespace-nowrap">
                                                            {record.created_at ? new Date(record.created_at).toLocaleString() : 'N/A'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-primary text-xs">{record.asset_code || 'N/A'}</span>
                                                                <span className="font-medium">{record.equipment_name || 'Item'}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={`capitalize ${record.action === 'deployed' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                                                                record.action === 'received' ? 'border-green-200 text-green-700 bg-green-50' :
                                                                    record.action === 'returned' ? 'border-amber-200 text-amber-700 bg-amber-50' :
                                                                        'border-gray-200 text-gray-700 bg-gray-50'
                                                                }`}>
                                                                {(record.action || '').replace('_', ' ')}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-medium text-gray-700">
                                                            {record.performed_by || 'System'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col text-xs">
                                                                <span className="font-semibold">{record.department || 'N/A'}</span>
                                                                <span className="text-muted-foreground">{record.deployment_location || 'N/A'}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1 text-xs">
                                                                <span className="text-gray-400 italic">{record.status_from || 'None'}</span>
                                                                <ChevronRight className="h-3 w-3 text-gray-400" />
                                                                <span className="font-bold text-blue-800">{record.status_to || 'None'}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="max-w-[200px] truncate text-xs italic text-muted-foreground">
                                                            {record.notes || ''}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card >
                    </TabsContent >
                </Tabs >

                {/* Deploy Asset Modal */}
                < Dialog open={showDeployModal} onOpenChange={setShowDeployModal} >
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Deploy Asset</DialogTitle>
                            <DialogDescription>
                                Deploy asset: {selectedAsset?.asset_code} - {selectedAsset?.equipment_name}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleDeployAsset} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="department" className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-primary" />
                                        Department *
                                    </Label>
                                    <Input
                                        id="department"
                                        value={deploymentForm.department}
                                        onChange={(e) => setDeploymentForm({ ...deploymentForm, department: e.target.value })}
                                        placeholder="e.g., IT Department, HR"
                                        required
                                        className="h-11"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="floor" className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        Location *
                                    </Label>
                                    <Input
                                        id="floor"
                                        value={deploymentForm.floor}
                                        onChange={(e) => setDeploymentForm({ ...deploymentForm, floor: e.target.value })}
                                        placeholder="e.g., Office Site, Section A"
                                        required
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="admin_in_charge" className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-primary" />
                                        Admin in Charge *
                                    </Label>
                                    <Input
                                        id="admin_in_charge"
                                        value={deploymentForm.admin_in_charge}
                                        onChange={(e) => setDeploymentForm({ ...deploymentForm, admin_in_charge: e.target.value })}
                                        placeholder="Name of admin"
                                        required
                                        className="h-11"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="admin_email" className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-primary" />
                                        Incharge Email *
                                    </Label>
                                    <Input
                                        id="admin_email"
                                        type="email"
                                        value={deploymentForm.admin_email}
                                        onChange={(e) => setDeploymentForm({ ...deploymentForm, admin_email: e.target.value })}
                                        placeholder="email@example.com"
                                        required
                                        className="h-11"
                                    />
                                </div>



                                <div className="space-y-2">
                                    <Label htmlFor="deployment_purpose">Purpose *</Label>
                                    <Input
                                        id="deployment_purpose"
                                        value={deploymentForm.deployment_purpose}
                                        onChange={(e) => setDeploymentForm({ ...deploymentForm, deployment_purpose: e.target.value })}
                                        placeholder="e.g., Internal office use"
                                        required
                                    />
                                </div>

                                {selectedAsset?.is_consumable && (
                                    <div className="space-y-2">
                                        <Label htmlFor="quantity">Quantity to Deploy * ({selectedAsset.stock_quantity} available)</Label>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            min="1"
                                            max={selectedAsset.stock_quantity}
                                            value={deploymentForm.quantity || 1}
                                            onChange={(e) => setDeploymentForm({ ...deploymentForm, quantity: parseInt(e.target.value) })}
                                            required
                                            className="h-11"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="deployed_by">Deployed By *</Label>
                                    <Input
                                        id="deployed_by"
                                        value={deploymentForm.deployed_by}
                                        onChange={(e) => setDeploymentForm({ ...deploymentForm, deployed_by: e.target.value })}
                                        placeholder="Your name"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="deployment_date">Deployment Date *</Label>
                                    <Input
                                        id="deployment_date"
                                        type="date"
                                        value={deploymentForm.deployment_date}
                                        onChange={(e) => setDeploymentForm({ ...deploymentForm, deployment_date: e.target.value })}
                                        required
                                        className="h-11"
                                    />
                                </div>

                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={deploymentForm.notes}
                                    onChange={(e) => setDeploymentForm({ ...deploymentForm, notes: e.target.value })}
                                    placeholder="Additional notes..."
                                    rows={3}
                                />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowDeployModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                            Deploying...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Deploy Asset
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog >

                {/* Details Modal */}
                < Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal} >
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Deployment Details</DialogTitle>
                        </DialogHeader>
                        {selectedDeployment && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium">Asset Code</Label>
                                        <p className="text-sm text-gray-600">{selectedDeployment.asset_code}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Equipment</Label>
                                        <p className="text-sm text-gray-600">{selectedDeployment.equipment_name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Location</Label>
                                        <p className="text-sm text-gray-600">{selectedDeployment.deployment_location}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Purpose</Label>
                                        <p className="text-sm text-gray-600">{selectedDeployment.deployment_purpose}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Admin In Charge</Label>
                                        <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                                            {selectedDeployment.admin_in_charge || 'N/A'}
                                            {selectedDeployment.admin_email && (
                                                <span className="block text-xs text-muted-foreground">{selectedDeployment.admin_email}</span>
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Deployed By</Label>
                                        <p className="text-sm text-gray-600">{selectedDeployment.deployed_by || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Status</Label>
                                        <div>{getStatusBadge(selectedDeployment.status)}</div>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Deployment Date</Label>
                                        <p className="text-sm text-gray-600">
                                            {selectedDeployment.deployment_date ? new Date(selectedDeployment.deployment_date).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    {selectedDeployment.item_type === 'non-consumable' && (
                                        <div>
                                            <Label className="text-sm font-medium">Next Maintenance</Label>
                                            <p className={cn(
                                                "text-sm font-bold",
                                                selectedDeployment.days_left < 0 ? "text-red-600" :
                                                    selectedDeployment.days_left <= 7 ? "text-orange-600" :
                                                        "text-green-600"
                                            )}>
                                                {selectedDeployment.next_maintenance_date
                                                    ? `${new Date(selectedDeployment.next_maintenance_date).toLocaleDateString()} (${selectedDeployment.days_left} days left)`
                                                    : 'No schedule set'}
                                            </p>
                                        </div>
                                    )}
                                    {selectedDeployment.expected_return_date && (
                                        <div>
                                            <Label className="text-sm font-medium">Expected Return</Label>
                                            <p className="text-sm text-gray-600">
                                                {new Date(selectedDeployment.expected_return_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                {selectedDeployment.notes && (
                                    <div>
                                        <Label className="text-sm font-medium">Notes</Label>
                                        <p className="text-sm text-gray-600">{selectedDeployment.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                        <DialogFooter>
                            <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog >

                {/* Maintenance Reminders Modal */}
                <Dialog open={showRemindersModal} onOpenChange={setShowRemindersModal}>
                    <DialogContent className="w-[92vw] max-w-5xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl text-destructive font-bold">
                                <AlertTriangle className="h-6 w-6" />
                                Active Maintenance Alerts
                            </DialogTitle>
                            <DialogDescription>
                                List of deployed assets that are overdue, due today, or nearing maintenance.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4">
                            <Table className="[&_[data-slot=table-head]]:whitespace-normal [&_[data-slot=table-cell]]:whitespace-normal [&_[data-slot=table-cell]]:break-words">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Asset</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Admin In Charge</TableHead>
                                        <TableHead>Maintenance Date</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deployments
                                        .filter(d => d.item_type === 'non-consumable' && d.days_left !== null && d.days_left <= 7)
                                        .sort((a, b) => (a.days_left || 0) - (b.days_left || 0))
                                        .map((d) => (
                                            <TableRow key={d.id} className={d.days_left < 0 ? "bg-red-50/30" : ""}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{d.equipment_name}</span>
                                                        <span className="text-xs text-muted-foreground uppercase">{d.asset_code}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{d.department}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{d.admin_in_charge}</span>
                                                        <span className="text-[10px] text-muted-foreground">{d.admin_email || 'No Email'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {d.next_maintenance_date ? new Date(d.next_maintenance_date).toLocaleDateString() : 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    {d.days_left < 0 ? (
                                                        <Badge variant="destructive" className="animate-pulse">Overdue ({Math.abs(d.days_left)}d)</Badge>
                                                    ) : d.days_left === 0 ? (
                                                        <Badge className="bg-orange-600">Due Today</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-blue-500 text-blue-600">In {d.days_left} days</Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    {deployments.filter(d => d.item_type === 'non-consumable' && d.days_left !== null && d.days_left <= 7).length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No assets require immediate maintenance attention.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <DialogFooter className="flex justify-between items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground italic">
                                {deployments.filter(d => d.item_type === 'non-consumable' && d.days_left !== null && d.days_left <= 7 && d.admin_email).length} administrators will be notified.
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setShowRemindersModal(false)}>Cancel</Button>
                                <Button
                                    disabled={sendingReminders || deployments.filter(d => d.item_type === 'non-consumable' && d.days_left !== null && d.days_left <= 7 && d.admin_email).length === 0}
                                    onClick={() => {
                                        const ids = deployments
                                            .filter(d => d.item_type === 'non-consumable' && d.days_left !== null && d.days_left <= 7 && d.admin_email)
                                            .map(d => d.id);
                                        handleSendReminders(ids);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 gap-2"
                                >
                                    {sendingReminders ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    Send Reminders
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Bulk Deploy Modal */}
                < Dialog open={showBulkDeployModal} onOpenChange={setShowBulkDeployModal} >
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-primary">
                                <PackagePlus className="h-6 w-6" />
                                Bulk Departmental Deployment
                            </DialogTitle>
                            <DialogDescription className="font-medium">
                                {selectedRequest
                                    ? `Fulfilling Request: ${selectedRequest.request_reference}`
                                    : "Assign multiple assets to a specific department or office location"}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleBulkDeploy} className="space-y-6">
                            {/* Item Type Selection */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Tags className="h-5 w-5" />
                                    Select Item Type
                                </h3>
                                <div className="flex gap-4 p-1 bg-muted rounded-lg w-fit">
                                    <Button
                                        type="button"
                                        variant={deploymentForm.item_type === 'non-consumable' ? 'default' : 'ghost'}
                                        onClick={() => {
                                            setDeploymentForm({ ...deploymentForm, item_type: 'non-consumable' });
                                            setSelectedEquipment([]);
                                        }}
                                        className="h-10 px-6"
                                    >
                                        Non-Consumable (Assets)
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={deploymentForm.item_type === 'consumable' ? 'default' : 'ghost'}
                                        onClick={() => {
                                            setDeploymentForm({ ...deploymentForm, item_type: 'consumable' });
                                            setSelectedEquipment([]);
                                        }}
                                        className="h-10 px-6"
                                    >
                                        Consumable (Stock)
                                    </Button>
                                </div>
                            </div>
                            {/* Location Details */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Deployment Location
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="bulk_department" className="flex items-center gap-2 text-sm font-semibold">
                                            <Building2 className="h-4 w-4 text-primary" />
                                            Department *
                                        </Label>
                                        <Input
                                            id="bulk_department"
                                            value={deploymentForm.department}
                                            onChange={(e) => setDeploymentForm({ ...deploymentForm, department: e.target.value })}
                                            placeholder="e.g., IT Department"
                                            required
                                            className="h-11 border-primary/20 focus:border-primary transition-all shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bulk_floor" className="flex items-center gap-2 text-sm font-semibold">
                                            <MapPin className="h-4 w-4 text-primary" />
                                            Location *
                                        </Label>
                                        <Input
                                            id="bulk_floor"
                                            value={deploymentForm.floor}
                                            onChange={(e) => setDeploymentForm({ ...deploymentForm, floor: e.target.value })}
                                            placeholder="e.g., Office Site, Section A"
                                            required
                                            className="h-11 border-primary/20 focus:border-primary transition-all shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bulk_admin" className="flex items-center gap-2 text-sm font-semibold">
                                            <User className="h-4 w-4 text-primary" />
                                            Admin in Charge *
                                        </Label>
                                        <Input
                                            id="bulk_admin"
                                            value={deploymentForm.admin_in_charge}
                                            onChange={(e) => setDeploymentForm({ ...deploymentForm, admin_in_charge: e.target.value })}
                                            placeholder="Name of admin"
                                            required
                                            className="h-11 border-primary/20 focus:border-primary transition-all shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bulk_admin_email" className="flex items-center gap-2 text-sm font-semibold">
                                            <Mail className="h-4 w-4 text-primary" />
                                            Incharge Email *
                                        </Label>
                                        <Input
                                            id="bulk_admin_email"
                                            type="email"
                                            value={deploymentForm.admin_email}
                                            onChange={(e) => setDeploymentForm({ ...deploymentForm, admin_email: e.target.value })}
                                            placeholder="email@example.com"
                                            required
                                            className="h-11 border-primary/20 focus:border-primary transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Linked Request Items (If any) */}
                            {selectedRequest && (
                                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                    <h4 className="text-sm font-bold flex items-center gap-2 mb-3 text-blue-800 dark:text-blue-300">
                                        <ClipboardList className="h-4 w-4" />
                                        Expected Items from Request {selectedRequest.request_reference}:
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {selectedRequest.items?.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm bg-background/60 backdrop-blur-sm p-3 rounded-lg border shadow-sm">
                                                <span className="font-semibold">{item.item_name}</span>
                                                <Badge variant="secondary" className="font-mono">{item.quantity_requested} {item.unit || 'pcs'}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Equipment Selection */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Select Equipment ({selectedEquipment.length} types selected)
                                </h3>

                                {/* Searchable Dropdown for Equipment */}
                                <div className="space-y-2">
                                    <Popover open={isAssetDropdownOpen} onOpenChange={setIsAssetDropdownOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={isAssetDropdownOpen}
                                                className="w-full justify-between h-12 bg-background border-input hover:border-primary/50 transition-all shadow-sm"
                                            >
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <Search className="h-4 w-4 shrink-0 opacity-50" />
                                                    {selectedEquipment.length > 0
                                                        ? `${selectedEquipment.length} equipment type(s) selected`
                                                        : "Search and select equipment..."}
                                                </div>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                            <Command>
                                                <CommandInput
                                                    placeholder="Type equipment name..."
                                                    value={assetSearchTerm}
                                                    onValueChange={setAssetSearchTerm}
                                                    className="h-10"
                                                />
                                                <CommandList className="max-h-[300px]">
                                                    <CommandEmpty>No equipment found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {filteredGroupsForBulk.map((item) => {
                                                            const isSelected = selectedEquipment.some(e => e.id === item.id);
                                                            const name = deploymentForm.item_type === 'consumable' ? item.equipment_name : item.name;
                                                            const count = deploymentForm.item_type === 'consumable' ? item.stock_quantity : item.count;

                                                            return (
                                                                <CommandItem
                                                                    key={item.id}
                                                                    value={name}
                                                                    onSelect={() => toggleEquipmentSelection(item)}
                                                                    className="py-3 px-4 flex items-center justify-between group cursor-pointer"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={cn(
                                                                            "h-5 w-5 rounded border border-primary flex items-center justify-center transition-colors",
                                                                            isSelected ? "bg-primary text-primary-foreground" : "bg-transparent"
                                                                        )}>
                                                                            {isSelected && <Check className="h-3 w-3" />}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold text-sm tracking-tight">{name}</span>
                                                                            <span className="text-[10px] text-muted-foreground uppercase">
                                                                                {item.category}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <Badge variant="outline" className="ml-2">
                                                                        {count} Available
                                                                    </Badge>
                                                                </CommandItem>
                                                            );
                                                        })}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Selected Equipment Summary & Quantity Input */}
                                {selectedEquipment.length > 0 && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-3">
                                        <div className="flex items-center justify-between mb-2 border-b border-blue-200 dark:border-blue-800 pb-2">
                                            <span className="font-medium text-blue-900 dark:text-blue-100">
                                                Selected Equipment ({selectedEquipment.length})
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedEquipment([])}
                                                className="h-7 text-xs"
                                            >
                                                Clear All
                                            </Button>
                                        </div>

                                        <div className="space-y-2">
                                            {selectedEquipment.map(item => (
                                                <div key={item.id} className="flex items-center justify-between bg-white dark:bg-slate-950 p-2 rounded border shadow-sm">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="h-8 w-8 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xs">
                                                            {item.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-sm">{item.name}</span>
                                                            <span className="text-[10px] text-muted-foreground">Max: {item.maxQuantity}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Label htmlFor={`qty-${item.id}`} className="text-xs whitespace-nowrap">Qty:</Label>
                                                        <Input
                                                            id={`qty-${item.id}`}
                                                            type="number"
                                                            min="1"
                                                            max={item.maxQuantity}
                                                            value={item.quantity}
                                                            onChange={(e) => updateEquipmentQuantity(item.id, parseInt(e.target.value) || 1)}
                                                            className="w-20 h-8 text-center"
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            onClick={() => toggleEquipmentSelection({ id: item.id })}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Deployment Details */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Deployment Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="bulk_purpose">Purpose *</Label>
                                        <Input
                                            id="bulk_purpose"
                                            value={deploymentForm.deployment_purpose}
                                            onChange={(e) => setDeploymentForm({ ...deploymentForm, deployment_purpose: e.target.value })}
                                            placeholder="e.g., Office workstation setup"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bulk_deployed_by">Deployed By *</Label>
                                        <Input
                                            id="bulk_deployed_by"
                                            value={deploymentForm.deployed_by}
                                            onChange={(e) => setDeploymentForm({ ...deploymentForm, deployed_by: e.target.value })}
                                            placeholder="Your name"
                                            required
                                        />
                                    </div>


                                    <div className="space-y-2">
                                        <Label htmlFor="bulk_deployment_date" className="flex items-center gap-2 text-sm font-semibold">
                                            <CalendarClock className="h-4 w-4 text-primary" />
                                            Deployment Date *
                                        </Label>
                                        <Input
                                            id="bulk_deployment_date"
                                            type="date"
                                            value={deploymentForm.deployment_date}
                                            onChange={(e) => setDeploymentForm({ ...deploymentForm, deployment_date: e.target.value })}
                                            required
                                            className="h-11"
                                        />
                                    </div>

                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bulk_notes">Notes</Label>
                                <Textarea
                                    id="bulk_notes"
                                    value={deploymentForm.notes}
                                    onChange={(e) => setDeploymentForm({ ...deploymentForm, notes: e.target.value })}
                                    placeholder="Additional notes..."
                                    rows={3}
                                />
                            </div>

                            <DialogFooter className="mt-6">
                                <Button type="button" variant="outline" onClick={() => {
                                    setShowBulkDeployModal(false);
                                    setSelectedEquipment([]);
                                    setAssetSearchTerm('');
                                    setSelectedRequest(null);
                                }}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading || selectedEquipment.length === 0}>
                                    {loading ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                            Deploying...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Confirm Deployment
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog >

                {/* Reject Request Modal */}
                < Dialog open={showRejectModal} onOpenChange={setShowRejectModal} >
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-destructive">
                                <XCircle className="h-5 w-5" />
                                Reject Request
                            </DialogTitle>
                            <DialogDescription>
                                Please provide a reason for rejecting request {selectedRequest?.request_reference}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="rejection_reason">Reason for Rejection *</Label>
                                <Textarea
                                    id="rejection_reason"
                                    placeholder="Enter the reason why this request is being rejected..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="min-h-[120px]"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setShowRejectModal(false);
                                setRejectionReason('');
                            }}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleRejectRequest}
                                disabled={loading || !rejectionReason.trim()}
                            >
                                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                                Confirm Rejection
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Return Asset Modal */}
                <Dialog open={showReturnModal} onOpenChange={setShowReturnModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Return Asset</DialogTitle>
                            <DialogDescription>
                                Please provide details for returning this asset.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>Asset / Equipment</Label>
                                <div className="p-3 bg-muted rounded-md text-sm">
                                    <p className="font-semibold">{selectedDeploymentForReturn?.equipment_name}</p>
                                    <p className="text-muted-foreground">{selectedDeploymentForReturn?.asset_code}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="return_notes">Return Reason / Notes</Label>
                                <Textarea
                                    id="return_notes"
                                    placeholder="e.g., Project completed, Item damaged, etc."
                                    value={returnNotes}
                                    onChange={(e) => setReturnNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowReturnModal(false)}>Cancel</Button>
                            <Button onClick={handleConfirmReturn} disabled={loading}>
                                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                                Confirm Return
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>


            </div>
        </div>
    );
};

export default AssetDeploymentTracker;
