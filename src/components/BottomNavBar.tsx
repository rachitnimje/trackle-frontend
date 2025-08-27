"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DumbbellIcon,
  ClipboardListIcon,
  CalendarIcon,
  BarChartIcon,
  UserIcon,
} from "@/components/Icons";

const BottomNavBar = () => {
  const pathname = usePathname();

  // Navigation items
  const navItems = [
    {
      name: "Exercises",
      href: "/exercises",
      icon: <DumbbellIcon className="w-5 h-5" />,
    },
    {
      name: "Templates",
      href: "/templates",
      icon: <ClipboardListIcon className="w-5 h-5" />,
    },
    {
      name: "Workouts",
      href: "/workouts",
      icon: <CalendarIcon className="w-5 h-5" />,
    },
    {
      name: "Stats",
      href: "/statistics",
      icon: <BarChartIcon className="w-5 h-5" />,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: <UserIcon className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 w-full border-t bg-background z-10">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 min-w-[64px] ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavBar;
