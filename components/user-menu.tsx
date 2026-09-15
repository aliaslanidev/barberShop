"use client";

import { LogOut, Settings, User as UserIcon } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type UserMenuItem = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
};

interface UserMenuProps {
  name: string;
  role?: string;
  avatarUrl?: string;
  items?: UserMenuItem[];
  onLogout: () => void;
}

export function UserMenu({
  name,
  role,
  avatarUrl,
  items = [],
  onLogout,
}: UserMenuProps) {
  const initial = name?.trim()?.charAt(0) || "?";

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="
            flex
            items-center
            gap-2
            rounded-full
            bg-white/[0.03]
            p-1
            pl-3
            transition-colors
            hover:bg-primary/[0.08]
          "
        >
          <div className="flex flex-col items-end leading-tight">
            <span className="text-sm font-medium text-foreground">
              {name}
            </span>
            {role && (
              <span className="text-xs text-muted-foreground">{role}</span>
            )}
          </div>

          <Avatar className="h-9 w-9">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
            <AvatarFallback className="bg-primary text-sm font-bold text-[#02100d]">
              {initial}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="text-sm font-medium">{name}</span>
          {role && (
            <span className="text-xs font-normal text-muted-foreground">
              {role}
            </span>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {items.map((item) => (
          <DropdownMenuItem
            key={item.label}
            onClick={item.onClick}
            className="cursor-pointer gap-2"
          >
            {item.icon ?? <UserIcon className="h-4 w-4" />}
            <span>{item.label}</span>
          </DropdownMenuItem>
        ))}

        {items.length > 0 && <DropdownMenuSeparator />}

        <DropdownMenuItem
          onClick={onLogout}
          className="cursor-pointer gap-2 text-red-400 focus:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          <span>خروج از حساب</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}