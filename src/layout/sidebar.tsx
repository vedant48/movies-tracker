import {
  LayoutDashboard,
  Activity,
  Search,
  User,
  Compass,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Sidebar({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Activity", icon: Activity, path: "/activity" },
    { name: "Explore", icon: Compass, path: "/explore" },
    { name: "Search", icon: Search, path: "/search" },
    { name: "Profile", icon: User, path: "/profile" },
  ];

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-black dark:text-white">
      {/* Top Section */}
      <div className="flex justify-between items-center p-2 border-b dark:border-gray-700">
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </Button>
        )}
        {mobile && <span className="text-lg font-semibold pl-2">Menu</span>}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-2 flex-1">
        {navItems.map(({ name, icon: Icon, path }) => {
          const LinkContent = (
            <Link
              to={path}
              className={`flex items-center gap-3 text-sm font-medium px-3 py-2 rounded 
                hover:bg-gray-100 dark:hover:bg-gray-800 
                ${isActive(path) ? "bg-gray-200 dark:bg-gray-700 font-bold" : ""}`}
            >
              <Icon size={18} />
              {(!collapsed || mobile) && <span>{name}</span>}
            </Link>
          );

          return mobile ? (
            <SheetClose key={name} asChild>
              {LinkContent}
            </SheetClose>
          ) : (
            <div key={name}>{LinkContent}</div>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-2 border-t dark:border-gray-700">
        {mobile ? (
          <SheetClose asChild>
            <Button onClick={onLogout} variant="destructive" className="w-full">
              Logout
            </Button>
          </SheetClose>
        ) : (
          <Button onClick={onLogout} variant="destructive" className="w-full">
            {collapsed ? <LogOut size={18} /> : "Logout"}
          </Button>
        )}
      </div>

      {/* Theme Toggle */}
      {!collapsed && (
        <div className="p-2 flex justify-end border-t dark:border-gray-700">
          <ThemeToggle />
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="md:hidden p-2 border-b dark:border-gray-700 bg-white dark:bg-gray-900">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 dark:bg-gray-900">
            <SidebarContent mobile />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div
        className={`hidden md:flex flex-col h-screen border-r dark:border-gray-700 
        bg-white dark:bg-gray-900 transition-all duration-300 fixed left-0 top-0 z-10 
        ${collapsed ? "w-16" : "w-64"}`}
      >
        <SidebarContent />
      </div>
    </>
  );
}
