import { Link, useLocation } from "react-router-dom";
import {
  IconHome,
  IconMovie,
  IconDeviceTvOld,
  IconSearch,
  IconUserCircle,
  IconListDetails,
  IconChartBar,
  IconDots,
  IconCompass,
  IconUsers,
  IconActivity,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function BottomNav() {
  const location = useLocation();

  // Define all navigation items with hierarchy
  const navMain = [
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
      icon: IconSearch,
    },
    {
      title: "Profile",
      url: "/profile",
      icon: IconUserCircle,
    },
    {
      title: "Leaderboard",
      url: "/users",
      icon: IconUsers,
    },
  ];

  // Primary items for bottom nav (max 4)
  const primaryItems = [
    navMain[0], // Dashboard
    navMain[1], // Activity
    navMain[2], // Explore
    navMain[3], // Search
  ];

  // Secondary items go in the "More" menu
  const secondaryItems = [
    navMain[4], // Profile
    navMain[5], // Leaderboard
  ];

  // Check active state with path prefix matching
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  // Check if any child is active
  const isParentActive = (children: any[]) => children?.some((child) => isActive(child.url));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-border md:hidden shadow-lg">
      <div className="relative flex items-center h-16">
        {primaryItems.map((item) => {
          const active = item.url ? isActive(item.url) : isParentActive(item.children);

          return (
            <div key={item.title} className="flex-1 flex justify-center">
              <Link
                to={item.url || (item.children ? item.children[0].url : "#")}
                className={cn(
                  "relative flex flex-col items-center justify-center w-full h-full transition-colors duration-200 z-10",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Active indicator
                {active && (
                  <motion.div
                    className="absolute -top-3 w-14 h-14 rounded-full bg-primary/10 dark:bg-primary/20"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                )} */}

                <motion.div
                  animate={{ y: active ? -4 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="flex flex-col items-center"
                >
                  <item.icon
                    className={cn(
                      "size-5 mb-1 transition-all z-20",
                      active ? "stroke-[2.5] scale-110" : "stroke-[1.8]"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs tracking-tight z-20 transition-all",
                      active ? "font-semibold scale-105" : "font-medium"
                    )}
                  >
                    {item.title}
                  </span>
                </motion.div>
              </Link>
            </div>
          );
        })}

        {/* More menu for secondary items */}
        <div className="flex-1 flex justify-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="relative flex flex-col items-center justify-center w-full h-full p-0">
                {/* Active indicator for secondary items */}
                {secondaryItems.some((item) => (item.url ? isActive(item.url) : isParentActive(item.children))) && (
                  <motion.div
                    className="absolute -top-3 w-14 h-14 rounded-full bg-primary/10 dark:bg-primary/20"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                )}

                <motion.div className="flex flex-col items-center">
                  <IconDots
                    className={cn(
                      "size-5 mb-1 transition-all z-20",
                      secondaryItems.some((item) => (item.url ? isActive(item.url) : isParentActive(item.children)))
                        ? "stroke-[2.5] scale-110"
                        : "stroke-[1.8]"
                    )}
                  />
                  <span className={cn("text-xs tracking-tight z-20 transition-all font-medium")}>More</span>
                </motion.div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2 mb-2 rounded-xl">
              <div className="grid gap-1">
                {secondaryItems.map((item) => {
                  const active = item.url ? isActive(item.url) : isParentActive(item.children);

                  if (item.children) {
                    return (
                      <div key={item.title} className="space-y-1">
                        <div
                          className={cn(
                            "px-3 py-2 rounded-lg text-sm font-medium",
                            active ? "bg-primary/10 text-primary" : "text-foreground"
                          )}
                        >
                          {item.title}
                        </div>
                        <div className="pl-4 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.title}
                              to={child.url}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                                isActive(child.url)
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground hover:bg-accent"
                              )}
                            >
                              <child.icon className="size-4" />
                              {child.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.title}
                      to={item.url || "#"}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                        active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent"
                      )}
                    >
                      <item.icon className="size-4" />
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </nav>
  );
}
