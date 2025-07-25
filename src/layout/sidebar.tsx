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
  ChevronDown,
  Film,
  Tv,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = {
  name: string;
  icon: React.ComponentType<any>;
  path?: string;
  children?: NavItem[];
};

export default function Sidebar({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Initialize expanded sections based on current route
  useEffect(() => {
    const sections: Record<string, boolean> = {};
    navItems.forEach(item => {
      if (item.children) {
        const isActive = item.children.some(
          child => location.pathname === child.path
        );
        sections[item.name] = isActive;
      }
    });
    setExpandedSections(sections);
  }, [location.pathname]);

  const navItems: NavItem[] = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    {
      name: "Activity",
      icon: Activity,
      children: [
        { name: "Movies", icon: Film, path: "/activity/movies" },
        { name: "TV Series", icon: Tv, path: "/activity/tv" },
      ],
    },
    {
      name: "Explore",
      icon: Compass,
      children: [
        { name: "Movies", icon: Film, path: "/explore/movies" },
        { name: "TV Series", icon: Tv, path: "/explore/tv" },
      ],
    },
    { name: "Search", icon: Search, path: "/search" },
    { name: "Profile", icon: User, path: "/profile" },
  ];

  const toggleSection = (name: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const isActive = (path?: string) => {
    return path ? location.pathname === path : false;
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => {
    const renderNavItem = (item: NavItem, level = 0) => {
      const isItemActive = isActive(item.path) || 
        (item.children?.some(child => isActive(child.path)) ?? false;
      
      return (
        <div key={item.name}>
          {item.children ? (
            <>
              <button
                onClick={() => toggleSection(item.name)}
                className={cn(
                  "flex items-center gap-3 w-full text-sm font-medium px-3 py-2 rounded",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  isItemActive && "bg-gray-200 dark:bg-gray-700 font-bold",
                  mobile ? "justify-between" : "justify-start",
                  level > 0 && "pl-8"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} />
                  {(!collapsed || mobile) && <span>{item.name}</span>}
                </div>
                {(!collapsed || mobile) && (
                  <ChevronDown
                    size={16}
                    className={cn(
                      "transition-transform",
                      expandedSections[item.name] && "rotate-180"
                    )}
                  />
                )}
              </button>
              
              {expandedSections[item.name] && item.children && (
                <div className="ml-2 border-l dark:border-gray-700">
                  {item.children.map(child => renderNavItem(child, level + 1))}
                </div>
              )}
            </>
          ) : (
            <Link
              to={item.path!}
              className={cn(
                "flex items-center gap-3 text-sm font-medium px-3 py-2 rounded",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                isItemActive && "bg-gray-200 dark:bg-gray-700 font-bold",
                level > 0 && "pl-8"
              )}
            >
              <item.icon size={18} />
              {(!collapsed || mobile) && <span>{item.name}</span>}
            </Link>
          )}
        </div>
      );
    };

    return (
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
          {navItems.map(item => renderNavItem(item))}
        </nav>

        {/* Logout Button */}
        <div className="p-2 border-t dark:border-gray-700">
          <Button onClick={onLogout} variant="destructive" className="w-full">
            {collapsed && !mobile ? <LogOut size={18} /> : "Logout"}
          </Button>
        </div>

        {/* Theme Toggle */}
        {(!collapsed || mobile) && (
          <div className="p-2 flex justify-end border-t dark:border-gray-700">
            <ThemeToggle />
          </div>
        )}
      </div>
    );
  };

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
        className={cn(
          "hidden md:flex flex-col h-screen border-r dark:border-gray-700",
          "bg-white dark:bg-gray-900 transition-all duration-300 fixed left-0 top-0 z-10",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent />
      </div>
    </>
  );
}