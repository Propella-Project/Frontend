/**
 * Dashboard Header
 * 
 * Header with navigation dropdown menu and user dropdown.
 */

import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  UserCircle,
  Map,
  Bot,
  LogOut,
  GraduationCap,
  ChevronDown,
  Menu,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  // Title is optional for future use
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Study Roadmap", href: "/study-roadmap", icon: Map },
  { name: "AI Tutor", href: "/ai-tutor", icon: Bot },
  { name: "Referrals", href: "/referrals", icon: Users },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Profile", href: "/profile", icon: UserCircle },
];

export function DashboardHeader(_props: DashboardHeaderProps) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0F0F11]/95 backdrop-blur-md border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <NavLink to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#18A0FB] to-[#0B54A0] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Propella</span>
            </NavLink>
          </div>

          {/* Navigation Dropdown - Desktop */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors outline-none">
                <Menu className="h-4 w-4" />
                Menu
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="center" 
                className="w-56 bg-[#1A1A1D] border-white/10 text-white"
              >
                <DropdownMenuLabel className="text-gray-400">Navigation</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {navigation.map((item) => (
                  <DropdownMenuItem key={item.name} asChild className="cursor-pointer focus:bg-white/5 focus:text-white">
                    <NavLink 
                      to={item.href} 
                      className={({ isActive }: { isActive: boolean }) =>
                        cn(
                          "flex items-center gap-2",
                          isActive && "text-[#18A0FB]"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </NavLink>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Navigation Dropdown */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 p-2 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-colors outline-none">
                <Menu className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-56 bg-[#1A1A1D] border-white/10 text-white"
              >
                <DropdownMenuLabel className="text-gray-400">Navigation</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {navigation.map((item) => (
                  <DropdownMenuItem key={item.name} asChild className="cursor-pointer focus:bg-white/5 focus:text-white">
                    <NavLink 
                      to={item.href}
                      className={({ isActive }: { isActive: boolean }) =>
                        cn(
                          "flex items-center gap-2",
                          isActive && "text-[#18A0FB]"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </NavLink>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors outline-none">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#18A0FB] to-[#0B54A0] flex items-center justify-center text-sm font-medium text-white">
                {user?.nickname?.charAt(0).toUpperCase() ||
                  user?.username?.charAt(0).toUpperCase() ||
                  user?.email?.charAt(0).toUpperCase() ||
                  "U"}
              </div>
              <span className="hidden sm:block text-sm font-medium text-white">
                {user?.nickname || user?.username || "User"}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-[#1A1A1D] border-white/10 text-white"
            >
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-white">
                  {user?.nickname || user?.username || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/5 focus:text-white">
                <NavLink to="/profile" className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  Profile
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
