import * as React from "react";
import {
  IconDashboard,
  IconListDetails,
  IconChartBar,
  IconSearch,
  IconUser,
  IconUsers,
  IconMovie,
  IconDeviceTvOld,
  IconInnerShadowTop,
  IconChevronDown,
  IconCompass,
  IconHome,
  IconUserCircle,
  IconActivity,
} from "@tabler/icons-react";
import { useLocation, Link } from "react-router-dom";
import { useState } from "react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "../utils/user";
import { FilmIcon } from "lucide-react";

const user = await getCurrentUser();

const data = {
  user: {
    name: user?.user_metadata?.displayName || "Guest",
    email: user?.email || "",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconHome,
    },
    {
      title: "Activity",
      icon: IconActivity,
      children: [
        { title: "Movies", url: "/activity/movies", icon: IconMovie },
        { title: "TV Series", url: "/activity/tv", icon: IconDeviceTvOld },
      ],
    },
    {
      title: "Explore",
      icon: IconCompass,
      children: [
        { title: "Movies", url: "/explore/movies", icon: IconMovie },
        { title: "TV Series", url: "/explore/tv", icon: IconDeviceTvOld },
      ],
    },
    {
      title: "Search",
      url: "/search",
      icon: IconSearch, // Changed from IconFolder to IconSearch
    },
    {
      title: "Profile",
      url: "/profile",
      icon: IconUserCircle, // Changed from IconUsers to IconUser (single person)
    },
    {
      title: "Users",
      url: "/users",
      icon: IconUsers, // Correct for multiple users
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    Activity: true,
    Explore: true,
  });

  const toggleItem = (title: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isActive = (url: string) => location.pathname === url;
  const isChildActive = (children: { url: string }[]) => children.some((child) => isActive(child.url));

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link to="/" className="flex items-center gap-2">
                <FilmIcon className="!size-5" />
                <span className="text-base font-semibold">Want2Watch</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {data.navMain.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isItemActive = item.url ? isActive(item.url) : false;
            const areChildrenActive = hasChildren ? isChildActive(item.children!) : false;
            const isActiveState = isItemActive || areChildrenActive;

            return (
              <React.Fragment key={item.title}>
                <SidebarMenuItem>
                  {hasChildren ? (
                    <SidebarMenuButton
                      onClick={() => toggleItem(item.title)}
                      className={cn(
                        "flex justify-between items-center w-full",
                        isActiveState && "bg-accent font-medium"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="size-5" />
                        <span>{item.title}</span>
                      </div>
                      <IconChevronDown
                        className={cn("size-4 transition-transform", expandedItems[item.title] && "rotate-180")}
                      />
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.url!}
                        className={cn("flex items-center gap-3", isActiveState && "bg-accent font-medium")}
                      >
                        <item.icon className="size-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>

                {hasChildren && expandedItems[item.title] && (
                  <div className="ml-6 pl-2 border-l border-gray-200 dark:border-gray-700">
                    {item.children!.map((child) => (
                      <SidebarMenuItem key={child.title}>
                        <SidebarMenuButton asChild>
                          <Link
                            to={child.url}
                            className={cn(
                              "flex items-center gap-3 pl-8",
                              isActive(child.url) && "bg-accent font-medium"
                            )}
                          >
                            <child.icon className="size-5" />
                            <span>{child.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
