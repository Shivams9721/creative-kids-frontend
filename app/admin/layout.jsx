"use client";
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ListOrdered, Tag, PackagePlus, BarChart2, Ticket, RefreshCcw, LogOut, ShieldAlert } from 'lucide-react';

const NAV = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ListOrdered },
  { href: '/admin/products', label: 'Inventory', icon: Tag },
  { href: '/admin/products/new', label: 'List Product', icon: PackagePlus },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/returns', label: 'Returns', icon: RefreshCcw },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  // Client-side auth guard fallback
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) router.replace('/admin/login');
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    document.cookie = 'adminToken=; path=/; max-age=0';
    router.replace('/admin/login');
  };

  return (
    <div className="fixed inset-0 z-[100] flex bg-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[#0f172a] text-slate-300 flex flex-col border-r border-slate-800">
        <div className="p-6 pb-4 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShieldAlert size={16} className="text-white" />
          </div>
          <span className="text-sm font-bold tracking-widest uppercase text-white">Workspace</span>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-semibold tracking-wider transition-all ${
                pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'hover:text-white hover:bg-white/10'
              }`}>
              <Icon size={17} /> {label}
            </Link>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-800">
          <button onClick={handleLogout}
            className="flex items-center gap-3 text-[12px] font-semibold tracking-wider text-slate-400 hover:text-white transition-colors w-full">
            <LogOut size={17} /> Secure Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
