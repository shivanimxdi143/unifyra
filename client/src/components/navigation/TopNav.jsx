import React, { useState, useEffect, useCallback } from 'react';
import {
  Menu,
  Search,
  Bell,
  Sparkles,
  RotateCcw,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MessageSquare,
  Leaf,
  ChevronDown,
  LogOut,
  Loader2
} from 'lucide-react';
import { BRAND_PROFILE } from '../../services/mockData';
import { ROLE_CONFIGS } from '../../services/authService';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/api';

function notifIcon(type) {
  if (type === 'approved') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (type === 'rejected') return <XCircle className="w-4 h-4 text-rose-500" />;
  if (type === 'changes_requested') return <AlertTriangle className="w-4 h-4 text-orange-500" />;
  if (type === 'submission_received' || type === 'resubmission_received')
    return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  if (type === 'comment_added' || type === 'reply_added')
    return <MessageSquare className="w-4 h-4 text-indigo-500" />;
  return <Sparkles className="w-4 h-4 text-indigo-500" />;
}

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function TopNav({
  onToggleSidebar,
  currentRole = 'Brand Manager',
  onRoleChange,
  onResetData,
  onLogout
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  const roles = [
    { id: 'manager', label: 'Brand Manager', desc: 'Manage guidelines & monitor compliance' },
    { id: 'employee', label: 'Employee', desc: 'Submit content & apply AI corrections' },
    { id: 'reviewer', label: 'Reviewer', desc: 'Review AI findings & approve/reject' }
  ];

  const persona = ROLE_CONFIGS[currentRole] || ROLE_CONFIGS['Brand Manager'];

  const fetchNotifications = useCallback(async () => {
    if (!currentRole) return;
    setIsLoadingNotifs(true);
    try {
      const res = await getNotifications({ recipientRole: currentRole, limit: 20 });
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // silent — notifications are non-critical
    } finally {
      setIsLoadingNotifs(false);
    }
  }, [currentRole]);

  // Fetch on mount and when role changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen for data-updated events (e.g. after submissions/comments)
  useEffect(() => {
    const handler = () => fetchNotifications();
    window.addEventListener('unifyra-data-updated', handler);
    return () => window.removeEventListener('unifyra-data-updated', handler);
  }, [fetchNotifications]);

  const handleBellClick = () => {
    const opening = !showNotifications;
    setShowNotifications(opening);
    setShowRoleMenu(false);
    if (opening) fetchNotifications();
  };

  const handleMarkRead = async (n) => {
    if (n.read) return;
    try {
      await markNotificationRead(n._id, currentRole);
      await fetchNotifications();
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(currentRole);
      await fetchNotifications();
    } catch {
      // silent
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & Brand Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Selector Badge with subtle purple/blue and fresh accents */}
        <div className="hidden sm:flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-slate-50 border border-slate-200/90 text-xs text-slate-800 shadow-2xs">
          <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px]">
            <Leaf className="w-3 h-3" />
          </div>
          <span className="font-semibold text-slate-900">{BRAND_PROFILE.name}</span>
          <span className="text-slate-400 font-mono text-[11px]">• 48 Outlets</span>
          <span className="inline-block px-1.5 py-0.2 rounded text-[10px] bg-indigo-50 font-semibold text-indigo-700 border border-indigo-200/60">
            Active Workspace
          </span>
        </div>
      </div>

      {/* Middle: Quick Search */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search guidelines, campaigns, or rules (e.g. BG-201, claims)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-xs rounded-xl pl-9 pr-4 py-2 text-slate-900 placeholder:text-slate-400 transition-all outline-none"
          />
        </div>
      </div>

      {/* Right controls: Demo Reset, Role Switcher, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Reset Mock Data button */}
        <button
          onClick={onResetData}
          title="Reset Demo Mock Data"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Demo</span>
        </button>

        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200/80 transition-colors border border-slate-200 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline text-slate-500 font-normal">Role:</span>
            <span className="text-indigo-700 font-semibold">{currentRole}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-scale-up">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">Switch Demo Role</p>
                <p className="text-[11px] text-slate-500">Test different permissions and viewpoints</p>
              </div>
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    if (onRoleChange) onRoleChange(r.label);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors flex flex-col cursor-pointer ${
                    currentRole === r.label ? 'bg-indigo-50/70 font-semibold' : ''
                  }`}
                >
                  <span className={currentRole === r.label ? 'text-indigo-800' : 'text-slate-800'}>
                    {r.label}
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">{r.desc}</span>
                </button>
              ))}

              {onLogout && (
                <div className="pt-1.5 mt-1.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoleMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 cursor-pointer font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Exit Demo Session</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Exit Demo Quick Action */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Exit Demo Session (Return to Login)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200/80 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Exit Demo</span>
          </button>
        )}

        {/* Notification Center */}
        <div className="relative">
          <button
            onClick={handleBellClick}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-scale-up">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900">Governance Alerts</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    {unreadCount} unread
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-slate-500 hover:text-indigo-600 font-medium cursor-pointer transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {isLoadingNotifs && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                  </div>
                )}

                {!isLoadingNotifs && notifications.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400 italic">
                    No governance alerts for your role.
                  </div>
                )}

                {!isLoadingNotifs && notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => handleMarkRead(n)}
                    className={`p-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer ${
                      !n.read ? 'bg-indigo-50/40' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {notifIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{relativeTime(n.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar with dynamic role persona */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-slate-100 shadow-2xs">
            {persona.personaInitials}
          </div>
          <div className="hidden lg:block text-left">
            <span className="text-xs font-bold text-slate-900 block leading-tight">{persona.personaName}</span>
            <span className="text-[10px] text-slate-500 block leading-none">{persona.personaSubtitle}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
