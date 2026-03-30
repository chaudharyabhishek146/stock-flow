'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Props {
  orgName: string;
  email: string;
  children: React.ReactNode;
}

export default function AppShell({ orgName, email, children }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen flex flex-col bg-white border-r border-gray-200 z-20 transition-all duration-200 overflow-hidden ${
          open ? 'w-56' : 'w-14'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-gray-100">
          <div className={`min-w-0 overflow-hidden transition-all duration-200 ${open ? 'w-36 opacity-100 ml-2' : 'w-0 opacity-0'}`}>
            <span className="text-base font-bold text-indigo-600 whitespace-nowrap">StockFlow</span>
            <p className="mt-0.5 text-xs text-gray-400 truncate">{orgName}</p>
          </div>
          <button
            onClick={() => setOpen(!open)}
            title={open ? 'Collapse sidebar' : 'Expand sidebar'}
            className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={open ? 'M11 19l-7-7 7-7M19 19l-7-7 7-7' : 'M13 5l7 7-7 7M5 5l7 7-7 7'} />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          <NavLink href="/dashboard" open={open} title="Dashboard">
            <DashboardIcon />
            <span className={`transition-all duration-200 ${open ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
              Dashboard
            </span>
          </NavLink>
          <NavLink href="/products" open={open} title="Products">
            <BoxIcon />
            <span className={`transition-all duration-200 ${open ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
              Products
            </span>
          </NavLink>
          <NavLink href="/settings" open={open} title="Settings">
            <SettingsIcon />
            <span className={`transition-all duration-200 ${open ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
              Settings
            </span>
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="px-2 py-4 border-t border-gray-100">
          <p className={`px-2 mb-1 text-xs text-gray-400 truncate transition-all duration-200 ${open ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'}`}>
            {email}
          </p>
          <LogoutButton open={open} />
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`flex-1 overflow-y-auto min-h-screen transition-all duration-200 ${
          open ? 'ml-56' : 'ml-14'
        }`}
      >
        <div className="px-6 py-8">{children}</div>
      </main>
    </div>
  );
}

function NavLink({
  href,
  open,
  title,
  children,
}: {
  href: string;
  open: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={!open ? title : undefined}
      className={`flex items-center gap-2.5 py-1.5 text-sm text-gray-700 rounded-md hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${
        open ? 'px-2' : 'px-2.5 justify-center'
      }`}
    >
      {children}
    </Link>
  );
}

function LogoutButton({ open }: { open: boolean }) {
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <button
      onClick={handleLogout}
      title={!open ? 'Sign out' : undefined}
      className={`flex w-full items-center gap-2.5 py-1.5 text-sm text-gray-700 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors ${
        open ? 'px-2' : 'px-2.5 justify-center'
      }`}
    >
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
      </svg>
      <span className={`transition-all duration-200 whitespace-nowrap overflow-hidden ${open ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
        Sign out
      </span>
    </button>
  );
}

function DashboardIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
