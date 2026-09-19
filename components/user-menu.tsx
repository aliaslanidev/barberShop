"use client";

import { LogOut, User as UserIcon } from "lucide-react";
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
          aria-label={name}
          title={name}
          className="
            flex
            items-center
            justify-center
            rounded-full
            p-0.5
            transition-colors
            hover:bg-primary/[0.08]
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-primary/50
          "
        >
          <Avatar className="h-10 w-10">
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