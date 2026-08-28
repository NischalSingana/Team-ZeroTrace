"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command-palette";
import { useRouter } from "next/navigation";
import { Search, GitBranch, Database, ShieldAlert, LayoutDashboard, Brain } from "lucide-react";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const [cmdOpen, setCmdOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (action: () => void) => {
    setCmdOpen(false);
    action();
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#080b0f]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar alertCount={5} />
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden"
          id="main-content"
          role="main"
        >
          {children}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => router.push("/overview"))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Overview
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/explorer"))}>
              <Search className="mr-2 h-4 w-4" />
              Log Explorer
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/detections"))}>
              <ShieldAlert className="mr-2 h-4 w-4" />
              Detections
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Management">
            <CommandItem onSelect={() => runCommand(() => router.push("/sources"))}>
              <Database className="mr-2 h-4 w-4" />
              Sources
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/parsers"))}>
              <GitBranch className="mr-2 h-4 w-4" />
              Parser Registry
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/ai-mapping"))}>
              <Brain className="mr-2 h-4 w-4 text-[#8b5cf6]" />
              AI Mapping
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
