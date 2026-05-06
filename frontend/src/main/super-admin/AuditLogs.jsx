import { useState, useEffect, cloneElement } from 'react';
import { Search, Download, RefreshCw, Filter, X, Calendar, User, Activity, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';

// section header component used throughout the premium design system
function SectionTitle({ icon, title, subtitle }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">
        <span className="p-1 leading-[24px] font-bold text-center border overflow-hidden rounded-md bg-zinc-900 text-neutral-100 flex items-center justify-center">
          {icon && cloneElement(icon, { className: 'h-4 w-4' })}
        </span>
        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      </div>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      <Separator className="bg-zinc-200/60 dark:bg-zinc-800/60" />
    </div>
  );
}


const BACKEND_BASE = import.meta.env.VITE_HR4_BACKEND || 'https://back.hr4armai.jampzdev.com';


export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [viewArchived, setViewArchived] = useState(false); // Toggle between active and archived
  const [filters, setFilters] = useState({
    action: '',
    entity_type: '',
    user_email: '',
    date_from: '',
    date_to: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 50,
    total: 0,
    last_page: 1,
  });
  const [filterOptions, setFilterOptions] = useState({
    actions: [],
    entity_types: [],
    users: [],
  });
  const [statistics, setStatistics] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
    fetchFilterOptions();
    fetchStatistics();
  }, [pagination.current_page, filters, viewArchived]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.current_page,
        per_page: pagination.per_page,
        search,
        ...filters,
      });

      const endpoint = viewArchived 
        ? `/api/system-settings/archived-audit-logs?${params}`
        : `/api/audit-logs?${params}`;

      const res = await fetch(`${BACKEND_BASE}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });
      const data = await res.json();

      if (data.success) {
        setLogs(data.data);
        setPagination({
          current_page: data.current_page,
          per_page: data.per_page,
          total: data.total,
          last_page: data.last_page,
        });
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/audit-logs/filter-options`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setFilterOptions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/audit-logs/statistics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ ...filters });
      window.open(`${BACKEND_BASE}/api/audit-logs/export?${params}`, '_blank');
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, current_page: 1 });
    fetchLogs();
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      entity_type: '',
      user_email: '',
      date_from: '',
      date_to: '',
    });
    setSearch('');
  };

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'UPDATE':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'DELETE':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'VIEW':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case 'EXPORT':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-[var(--vivid-indigo)]/10 text-[var(--vivid-neon-pink)] border-[var(--vivid-neon-pink)]/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background p-6 space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
        <SectionTitle
          icon={<Activity />}
          title={viewArchived ? 'Archived Audit Logs' : 'Audit Logs'}
          subtitle={viewArchived ? 'View archived system activities' : 'Track all system activities and changes'}
        />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-6"
        >
          <button
            onClick={() => {
              setViewArchived(!viewArchived);
              setPagination({ ...pagination, current_page: 1 });
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 text-white hover:bg-amber-600 transition-colors text-md"
          >
            <Archive className="w-4 h-4" />
            {viewArchived ? 'View Active Logs' : 'View Archived'}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-md"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-indigo-500 text-indigo-500 hover:bg-indigo-500/10 transition-colors text-md"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => fetchLogs()}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-zinc-200/60 text-foreground hover:bg-zinc-100 transition-colors text-md"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </motion.div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-8"
        >
          <div className="bg-zinc-50 backdrop-blur-sm rounded-2xl border border-zinc-200/60 p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  Total Logs
                </p>
                <p className="text-2xl font-[family-name:var(--font-poppins-semibold)] text-foreground">
                  {statistics.total_logs?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-50 backdrop-blur-sm rounded-2xl border border-zinc-200/60 p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                <Activity className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  Creates
                </p>
                <p className="text-2xl font-[family-name:var(--font-poppins-semibold)] text-foreground">
                  {statistics.by_action?.CREATE || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 backdrop-blur-sm rounded-2xl border border-zinc-200/60 p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  Updates
                </p>
                <p className="text-2xl font-[family-name:var(--font-poppins-semibold)] text-foreground">
                  {statistics.by_action?.UPDATE || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 backdrop-blur-sm rounded-2xl border border-zinc-200/60 p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                <Activity className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  Deletes
                </p>
                <p className="text-2xl font-[family-name:var(--font-poppins-semibold)] text-foreground">
                  {statistics.by_action?.DELETE || 0}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-50 backdrop-blur-sm rounded-2xl border border-zinc-200/60 p-6 space-y-4"
      >
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by user, entity, or description..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200/60 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 text-md"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-3 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-md"
          >
            Search
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 pt-4 border-t border-zinc-200/60"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Action</label>
                <select
                  value={filters.action}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                  className="w-full px-3 py-2 rounded-2xl border border-zinc-200/60 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 text-md"
                >
                  <option value="">All Actions</option>
                  {filterOptions.actions.map((action) => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Entity Type</label>
                <select
                  value={filters.entity_type}
                  onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-2xl border border-zinc-200/60 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 text-md"
                >
                  <option value="">All Entities</option>
                  {filterOptions.entity_types.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Date From</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                  className="w-full px-3 py-2 rounded-2xl border border-zinc-200/60 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 text-md"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Date To</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                  className="w-full px-3 py-2 rounded-2xl border border-zinc-200/60 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 text-md"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 rounded-2xl border border-zinc-200/60 text-foreground hover:bg-accent transition-colors text-md flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </div>
              </motion.div>
            )}
          </motion.div>
      <div className="bg-zinc-50 backdrop-blur-sm rounded-2xl border border-zinc-200/60 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-indigo-50/50 border-b border-zinc-200/60">
              <tr>
                <th className="px-6 py-4 text-left text-md font-[family-name:var(--font-poppins-semibold)] text-foreground">
                  User
                </th>
                <th className="px-6 py-4 text-left text-md font-[family-name:var(--font-poppins-semibold)] text-foreground">
                  Action
                </th>
                <th className="px-6 py-4 text-left text-md font-[family-name:var(--font-poppins-semibold)] text-foreground">
                  Entity
                </th>
                <th className="px-6 py-4 text-left text-md font-[family-name:var(--font-poppins-semibold)] text-foreground">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-md font-[family-name:var(--font-poppins-semibold)] text-foreground">
                  IP Address
                </th>
                <th className="px-6 py-4 text-left text-md font-[family-name:var(--font-poppins-semibold)] text-foreground">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <RefreshCw className="w-5 h-5 animate-spin text-[var(--vivid-neon-pink)]" />
                      <span className="text-md text-muted-foreground">Loading audit logs...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <p className="text-md text-muted-foreground">No audit logs found</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-indigo-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[var(--vivid-indigo)]/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-[var(--vivid-neon-pink)]" />
                        </div>
                        <div>
                          <p className="text-md font-medium text-foreground">{log.user_name}</p>
                          <p className="text-sm text-muted-foreground">{log.user_role || 'Unknown Role'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-md border text-sm font-medium ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-md text-foreground">{log.entity_type}</p>
                        {log.entity_id && (
                          <p className="text-sm text-muted-foreground">ID: {log.entity_id}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-md text-foreground line-clamp-2">{log.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-md text-muted-foreground">{log.ip_address || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        {viewArchived ? (
                          <>
                            <p className="text-md text-foreground">
                              {log.original_created_at ? format(new Date(log.original_created_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Archived: {log.archived_at ? format(new Date(log.archived_at), 'MMM dd, HH:mm') : 'N/A'}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-md text-foreground">{log.created_at_human}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                            </p>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <p className="text-md text-muted-foreground">
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
              {pagination.total} results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, current_page: pagination.current_page - 1 })}
                disabled={pagination.current_page === 1}
                className="px-4 py-2 rounded-2xl border border-zinc-200/60 text-foreground hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-md"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, current_page: pagination.current_page + 1 })}
                disabled={pagination.current_page === pagination.last_page}
                className="px-4 py-2 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-md"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-zinc-50 backdrop-blur-sm rounded-3xl border border-zinc-200/60 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-zinc-50 backdrop-blur-sm border-b border-zinc-200/60 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-[family-name:var(--font-poppins-semibold)] text-foreground">
                Audit Log Details
              </h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-md hover:bg-accent transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">User</p>
                  <p className="text-md font-medium text-foreground">{selectedLog.user_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedLog.user_role || 'Unknown Role'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Action</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-md border text-sm font-medium ${getActionBadgeColor(selectedLog.action)}`}>
                    {selectedLog.action_label}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Entity Type</p>
                  <p className="text-md text-foreground">{selectedLog.entity_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Entity ID</p>
                  <p className="text-md text-foreground">{selectedLog.entity_id || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">IP Address</p>
                  <p className="text-md text-foreground">{selectedLog.ip_address || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Timestamp</p>
                  <p className="text-md text-foreground">
                    {format(new Date(selectedLog.created_at), 'MMM dd, yyyy HH:mm:ss')}
                  </p>
                </div>
              </div>

              {selectedLog.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-md text-foreground bg-zinc-50/50 p-4 rounded-2xl border border-zinc-200/60">
                    {selectedLog.description}
                  </p>
                </div>
              )}

              {Object.keys(selectedLog.changed_fields || {}).length > 0 && (
                <div>
                  <p className="text-md font-[family-name:var(--font-poppins-semibold)] text-foreground mb-3">
                    Changed Fields
                  </p>
                  <div className="space-y-3">
                    {Object.entries(selectedLog.changed_fields).map(([field, values]) => (
                      <div key={field} className="bg-zinc-50/50 p-4 rounded-2xl border border-zinc-200/60">
                        <p className="text-sm font-medium text-indigo-600 mb-2">
                          {field}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Old Value</p>
                            <p className="text-md text-foreground font-mono">
                              {JSON.stringify(values.old)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">New Value</p>
                            <p className="text-md text-foreground font-mono">
                              {JSON.stringify(values.new)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.user_agent && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">User Agent</p>
                  <p className="text-sm text-foreground bg-zinc-50/50 p-4 rounded-2xl font-mono break-all border border-zinc-200/60">
                    {selectedLog.user_agent}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
