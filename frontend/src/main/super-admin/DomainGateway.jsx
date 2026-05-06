// Department: Super Admin Core
// Owner: lead-governance
// DO NOT MODIFY WITHOUT APPROVAL

import React from 'react';
import { motion } from 'framer-motion';

import {
    LayoutGrid,
    ExternalLink,
    Users,
    Truck,
    Briefcase,
    CreditCard,
    Settings,
    ArrowUpRight,
    Search,
    Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const domains = [
    {
        category: "Human Capital Management",
        items: [
            { name: "Recruitment (HR1)", url: import.meta.env.VITE_HR1_FRONTEND, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
            { name: "Time & Attendance (HR2)", url: import.meta.env.VITE_HR2_FRONTEND, icon: Users, color: "text-indigo-500", bg: "bg-indigo-500/10" },
            { name: "Workforce Ops (HR3)", url: import.meta.env.VITE_HR3_FRONTEND, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
            { name: "Employee Engagement (HR4)", url: import.meta.env.VITE_HR4_FRONTEND, icon: Users, color: "text-pink-500", bg: "bg-pink-500/10" },
        ]
    },
    {
        category: "Operational Logistics",
        items: [
            { name: "Dispatch Tracking (QR Log 1)", url: import.meta.env.VITE_LOGISTICSI_FRONTEND, icon: Truck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { name: "Fleet Management (FMS 2)", url: import.meta.env.VITE_FLEET_FRONTEND, icon: Truck, color: "text-teal-500", bg: "bg-teal-500/10" },
        ]
    },
    {
        category: "Commercial & Travel",
        items: [
            { name: "Tour Booking (CT1)", url: import.meta.env.VITE_CT1_FRONTEND, icon: Globe, color: "text-amber-500", bg: "bg-amber-500/10" },
            { name: "Agency Portal (CT2)", url: import.meta.env.VITE_CT2_FRONTEND, icon: Globe, color: "text-orange-500", bg: "bg-orange-500/10" },
        ]
    },
    {
        category: "Corporate Services",
        items: [
            { name: "Financial Oversight (TechFince)", url: import.meta.env.VITE_FIN_FRONTEND, icon: CreditCard, color: "text-rose-500", bg: "bg-rose-500/10" },
            { name: "Corporate Operations (ADM)", url: import.meta.env.VITE_ADM_FRONTEND, icon: Settings, color: "text-zinc-500", bg: "bg-zinc-500/10" },
        ]
    }
];

export default function DomainGateway() {
    return (
        <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">
                        <span className="p-1 leading-[24px] font-bold text-center border overflow-hidden rounded-md bg-zinc-900 text-neutral-100 flex items-center justify-center">
                            <LayoutGrid className="h-4 w-4" />
                        </span>
                        <h3 className="text-xl font-bold tracking-tight">Domain Access Gateway</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Unified access to enterprise domain ecosystems.</p>
                </div>
                <div className="relative w-full md:w-64 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search domains..."
                        className="pl-10 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200/60 focus-visible:ring-primary/50"
                    />
                </div>
            </div>

            <Separator className="bg-zinc-200/60 dark:bg-zinc-800/60" />

            {/* Domain Grid */}
            <div className="space-y-12">
                {domains.map((group, idx) => (
                    <div key={idx} className="space-y-6">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xs uppercase font-bold tracking-[0.2em] text-muted-foreground whitespace-nowrap">
                                {group.category}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {group.items.map((item, itemIdx) => (
                                <motion.div
                                    key={itemIdx}
                                    whileHover={{ scale: 1.02, translateY: -4 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <Card
                                        className="group relative rounded-3xl border-zinc-200/60 dark:bg-zinc-900/40 overflow-hidden transition-all hover:shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-500/40 dark:hover:shadow-none h-full"
                                    >
                                        <CardHeader className="bg-zinc-50/50 dark:bg-zinc-800/10 border-b border-zinc-100 dark:border-zinc-800/60 p-6 mb-4">
                                            <div className={`h-12 w-12 rounded-2xl ${item.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300 shadow-sm`}>
                                                <item.icon className={`h-6 w-6 ${item.color} drop-shadow-[0_0_8px_rgba(var(--primary),0.2)]`} />
                                            </div>
                                            <CardTitle className="text-lg font-bold tracking-tight">{item.name}</CardTitle>
                                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 truncate">{item.url || 'URL not configured'}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-6 pt-0">
                                            <Button
                                                className="w-full rounded-2xl bg-indigo-600 dark:bg-indigo-800 hover:bg-zinc-900 text-white shadow-lg shadow-indigo-900/20 focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all font-bold uppercase tracking-tighter"
                                                disabled={!item.url}
                                                onClick={() => window.open(item.url, '_blank')}
                                            >
                                                Access Domain <ArrowUpRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </CardContent>

                                        {/* Glass reflection effect */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ zIndex: 0 }} />
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions Footer */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                className="relative"
            >
                <Card className="rounded-[2.5rem] bg-indigo-700 dark:bg-indigo-800 text-white p-10 overflow-hidden border-none shadow-2xl shadow-indigo-500/20 max-w-[80vw]">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="space-y-3 text-center md:text-left">
                            <h3 className="text-3xl font-black uppercase tracking-tighter">Domain Not Listed?</h3>
                            <p className="text-indigo-100/90 font-bold italic">Request access to a new domain or report a synchronization issue.</p>
                        </div>
                        <Button className="rounded-2xl bg-white text-indigo-700 hover:bg-slate-50 h-14 px-10 font-black uppercase tracking-widest text-xs transition-all shadow-xl">
                            Contact IT Support
                        </Button>
                    </div>
                </Card>
            </motion.div>
        </div >
    );
}
