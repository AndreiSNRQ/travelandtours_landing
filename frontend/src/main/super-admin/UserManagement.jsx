// System: Admin Core
// Owner: lead-governance
// Simplified for clarity

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import {
    Users,
    Search,
    Filter,
    MoreVertical,
    UserPlus,
    Shield,
    Mail,
    CheckCircle2,
    Building2,
    RefreshCw,
    Pencil,
    Trash2,
    Lock,
    Briefcase,
    Calendar,
    ChevronRight,
    SearchX
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
    getEnterpriseUsers,
    updateUserRole,
    createEnterpriseUser,
    getUserMetadata,
    getUnmappedEmployees
} from '@/api/user';
import { format } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const FMS_REGISTER_URL = import.meta.env.VITE_FLEET_BACKEND + "/api/register";

const UserActionModal = React.memo(({
    isOpen,
    onOpenChange,
    isCreate,
    formData,
    setFormData,
    onSuccess,
    roles,
    selectedUser,
    isProcessing,
    resetForm,
    unmappedEmployees = []
}) => {
    const handleEmployeeSelect = (employeeCode) => {
        const emp = unmappedEmployees.find(e => e.employee_code === employeeCode);
        if (emp) {
            setFormData(prev => ({
                ...prev,
                name: emp.name,
                email: emp.email,
                employee_code: emp.employee_code
            }));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onOpenChange(false); resetForm(); } }}>
            <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                <form onSubmit={onSuccess}>
                    <DialogHeader className="p-8 pb-4">
                        <DialogTitle className="text-2xl font-bold text-zinc-900 uppercase tracking-tight">
                            {isCreate ? "Create New User" : "Update User Details"}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 font-medium">
                            {isCreate ? "Fill in the details to create a new system account." : `Modifying access for ${selectedUser?.name}`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="px-8 pb-6 flex flex-col">
                        {isCreate && unmappedEmployees.length > 0 && (
                            <div className="space-y-1.5 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                                <label className="text-[10px] font-bold uppercase text-indigo-500 ml-1">Import from HR Employee Data</label>
                                <Select onValueChange={handleEmployeeSelect}>
                                    <SelectTrigger className="h-11 rounded-xl bg-white border-indigo-200">
                                        <SelectValue placeholder="Select HR Employee" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {unmappedEmployees.map((emp) => (
                                            <SelectItem key={emp.employee_code} value={emp.employee_code}>
                                                <div className="flex flex-col items-start">
                                                    <span className="font-bold text-xs">{emp.name}</span>
                                                    <span className="text-[10px]">{emp.employee_code} • {emp.email}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase text-zinc-400 ml-1">Full Name</label>
                                <Input
                                    required
                                    className="h-11 rounded-xl bg-zinc-50 border-zinc-200"
                                    placeholder="Juan Dela Cruz"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase text-zinc-400 ml-1">Employee Code</label>
                                <Input
                                    className="h-11 rounded-xl bg-zinc-50 border-zinc-200"
                                    placeholder="EMP-000"
                                    value={formData.employee_code}
                                    readOnly={isCreate && !!formData.employee_code && unmappedEmployees.some(e => e.employee_code === formData.employee_code)}
                                    onChange={(e) => setFormData(prev => ({ ...prev, employee_code: e.target.value.toUpperCase() }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-zinc-400 ml-1">Email Address</label>
                            <Input
                                required
                                type="email"
                                className="h-11 rounded-xl bg-zinc-50 border-zinc-200"
                                placeholder="user@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-zinc-400 ml-1">
                                {isCreate ? "Account Password" : "New Password (Optional)"}
                            </label>
                            <div className="relative">
                                <Input
                                    required={isCreate}
                                    type="password"
                                    className="h-11 rounded-xl bg-zinc-50 border-zinc-200 pl-10"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                />
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-zinc-400 ml-1">Access Role</label>
                            <Select value={formData.role} onValueChange={(val) => setFormData(prev => ({ ...prev, role: val }))}>
                                <SelectTrigger className="w-full h-11 rounded-xl bg-zinc-50 border-zinc-200">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl max-h-[250px] w-[var(--radix-select-trigger-width)]">
                                    {roles.map((role) => (
                                        <SelectItem key={role} value={role} className="font-bold text-xs uppercase">{role}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="p-8 pt-0 flex gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            className="flex-1 h-11 rounded-xl font-bold uppercase text-xs"
                            onClick={() => { onOpenChange(false); resetForm(); }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase text-xs shadow-lg shadow-indigo-200"
                            disabled={isProcessing}
                        >
                            {isProcessing ? "Processing..." : (isCreate ? "Create Account" : "Save Changes")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
});

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreate, setIsCreate] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Employee',
        employee_code: ''
    });

    const [availableRoles, setAvailableRoles] = useState([]);
    const [availableDepartments, setAvailableDepartments] = useState([]);
    const [unmappedEmployees, setUnmappedEmployees] = useState([]);
    const [departmentFilter, setDepartmentFilter] = useState('All');

    const fmsRoles = ['Fleet Manager', 'LogisticsI Admin', 'Driver'];

    const getRoleBadgeStyle = (role) => {
        const r = role.toLowerCase();
        if (r.includes('hr') || r.includes('trainer'))
            return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
        if (r.includes('logistics') || r.includes('fleet') || r.includes('driver'))
            return "bg-orange-500/10 text-orange-600 border-orange-500/20";
        if (r.includes('facility') || r.includes('legal') || r.includes('front desk'))
            return "bg-purple-500/10 text-purple-600 border-purple-500/20";
        if (r.includes('super admin'))
            return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
        if (r.includes('finance'))
            return "bg-pink-500/10 text-pink-600 border-pink-500/20";
        if (r.includes('manager') || r.includes('staff') || r.includes('customer') || r.includes('employee'))
            return "bg-blue-500/10 text-blue-600 border-blue-500/20";

        return "bg-zinc-500/10 text-zinc-600 border-zinc-500/20";
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await getEnterpriseUsers();
            setUsers(res.data);
        } catch (error) {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const fetchMetadata = async () => {
        try {
            const [metaRes, unmappedRes] = await Promise.all([
                getUserMetadata(),
                getUnmappedEmployees()
            ]);
            setAvailableRoles(metaRes.data.roles);
            setAvailableDepartments(metaRes.data.departments);
            setUnmappedEmployees(unmappedRes.data);
        } catch (error) {
            console.error("Failed to load metadata", error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchMetadata();
    }, []);

    const syncWithFMS = async (userData) => {
        if (fmsRoles.includes(userData.role)) {
            try {
                await axios.post(FMS_REGISTER_URL, {
                    name: userData.name,
                    email: userData.email,
                    password: userData.password,
                    role: userData.role
                });
                toast.success("Synced with FMS successfully");
            } catch (err) {
                console.error("FMS sync failed:", err);
                toast.warning("User created but FMS sync failed");
            }
        }
    };

    const handleAction = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        try {
            if (isCreate) {
                await createEnterpriseUser(formData);
                await syncWithFMS(formData);
                toast.success("User created successfully");
            } else {
                await updateUserRole(selectedUser.id, formData.role);
                toast.success("User updated successfully");
            }
            setIsModalOpen(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        } finally {
            setIsProcessing(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', password: '', role: 'Employee', employee_code: '' });
        setSelectedUser(null);
    };

    const openCreateModal = () => {
        setIsCreate(true);
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (user) => {
        setIsCreate(false);
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            employee_code: user.employee_code || ''
        });
        setIsModalOpen(true);
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.employee_code && user.employee_code.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesDepartment = departmentFilter === 'All' || user.domain === departmentFilter;

            return matchesSearch && matchesDepartment;
        });
    }, [users, searchQuery, departmentFilter]);

    const verifiedUsersCount = users.filter(u => u.verified).length;

    return (
        <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="p-1 leading-[24px] font-bold text-center border overflow-hidden rounded-md bg-zinc-900 text-neutral-100 flex items-center justify-center">
                            <Users className="h-4 w-4" />
                        </span>
                        <h1 className="text-xl font-bold tracking-tight text-zinc-900">User Management</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">Manage system users and access levels across domains.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-zinc-200/60" onClick={fetchUsers} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 text-zinc-500 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-lg shadow-indigo-100"
                        onClick={openCreateModal}
                    >
                        <UserPlus className="mr-2 h-4 w-4" /> Create User Account
                    </Button>
                </div>
            </div>

            <Separator className="bg-zinc-200/60" />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-2xl border-zinc-200/60 bg-white/50">
                    <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Total System Accounts</CardTitle>
                        <Users className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-zinc-900">{users.length}</div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-zinc-200/60 bg-white/50">
                    <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Unmapped HR Employees</CardTitle>
                        <Briefcase className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-zinc-900">{unmappedEmployees.length}</div>
                    </CardContent>
                </Card>
            </div>

            {unmappedEmployees.length > 0 && (
                <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-900">Found {unmappedEmployees.length} Employees with no accounts</p>
                            <p className="text-xs text-amber-700">These employees are in HR but not registered in the system.</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="text-amber-700 hover:bg-amber-100 font-bold uppercase text-[10px] tracking-widest gap-2"
                        onClick={openCreateModal}
                    >
                        Provision accounts <ChevronRight className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {/* Filters & Table */}
            <Card className="rounded-3xl border-zinc-200/60 overflow-hidden shadow-sm">
                <CardHeader className="p-6 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <Input
                                placeholder="Search by name, email or role..."
                                className="h-11 pl-11 rounded-2xl bg-zinc-50/50 border-zinc-200/60"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="w-64">
                            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                <SelectTrigger className="h-11 rounded-2xl bg-zinc-50/50 border-zinc-200/60">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                                        <SelectValue placeholder="All Departments" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="All">All Departments</SelectItem>
                                    {availableDepartments.map(dept => (
                                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <Table>
                    <TableHeader className="bg-zinc-50/50">
                        <TableRow>
                            <TableHead className="font-bold uppercase text-[10px] text-zinc-500 px-6">User Details</TableHead>
                            <TableHead className="font-bold uppercase text-[10px] text-zinc-500">Access Role</TableHead>
                            <TableHead className="font-bold uppercase text-[10px] text-zinc-500">Identity Status</TableHead>
                            <TableHead className="font-bold uppercase text-[10px] text-zinc-500">Member Since</TableHead>
                            <TableHead className="text-right pr-6"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-8 w-8 border-4 border-indigo-600/20 border-b-indigo-600 rounded-full animate-spin"></div>
                                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Loading Users</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground uppercase text-[10px] font-bold tracking-widest">No users found.</TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id} className="hover:bg-indigo-50/30 transition-colors border-zinc-100">
                                    <TableCell className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center font-bold text-zinc-500">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-zinc-900">{user.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                                    {user.employee_code && (
                                                        <>
                                                            <span className="text-zinc-300">•</span>
                                                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-wider">{user.employee_code}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`rounded-lg py-0.5 px-2 font-bold uppercase text-[9px] ${getRoleBadgeStyle(user.role)}`}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={`rounded-full px-3 py-0.5 font-bold uppercase text-[9px] ${user.verified
                                                ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                                                : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                                                }`}
                                        >
                                            {user.verified ? 'Verified' : 'Pending'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                                            <span className="text-xs text-zinc-600">{format(new Date(user.created_at), 'MMM d, yyyy')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-zinc-100">
                                                    <MoreVertical className="h-4 w-4 text-zinc-500" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl border-zinc-200 shadow-xl p-1 w-48">
                                                <DropdownMenuItem className="gap-2 font-bold text-[10px] uppercase cursor-pointer rounded-lg px-3 py-2" onClick={() => openEditModal(user)}>
                                                    <Pencil className="h-3.5 w-3.5" /> Edit Details
                                                </DropdownMenuItem>
                                                <Separator className="my-1 opacity-50" />
                                                <DropdownMenuItem className="gap-2 font-bold text-[10px] uppercase text-red-600 cursor-pointer rounded-lg px-3 py-2 hover:bg-red-50">
                                                    <Trash2 className="h-3.5 w-3.5" /> Remove User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            <UserActionModal
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                isCreate={isCreate}
                formData={formData}
                setFormData={setFormData}
                onSuccess={handleAction}
                roles={availableRoles}
                selectedUser={selectedUser}
                isProcessing={isProcessing}
                resetForm={resetForm}
                unmappedEmployees={unmappedEmployees}
            />
        </div>
    );
}

