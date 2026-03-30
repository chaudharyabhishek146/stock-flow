'use client';

export default function LogoutButton() {
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full text-left px-2 py-1.5 text-sm text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
    >
      Sign out
    </button>
  );
}
