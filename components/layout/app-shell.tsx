"use client";

import { Suspense, useState } from "react";
import { MenuIcon, PanelLeftCloseIcon, PanelLeftIcon, PanelRightCloseIcon, PanelRightIcon } from "lucide-react";

import { SessionSidebar } from "./session-sidebar";
import { InspectorPanel } from "./inspector-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [mobileLeft, setMobileLeft] = useState(false);
  const [mobileRight, setMobileRight] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 md:hidden">
        <Button
          aria-label="Toggle sessions"
          size="icon-sm"
          variant="outline"
          onClick={() => setMobileLeft((v) => !v)}
        >
          <MenuIcon className="size-4" aria-hidden="true" />
        </Button>
        <span className="text-sm font-semibold text-foreground">Jobbot</span>
        <Button
          aria-label="Toggle inspector"
          size="icon-sm"
          variant="outline"
          onClick={() => setMobileRight((v) => !v)}
        >
          <PanelRightIcon className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="flex flex-1 gap-3 px-3 pb-3 md:px-4 md:pb-4">
        {/* Left sidebar (desktop) */}
        <div
          className={cn(
            "hidden shrink-0 transition-all duration-300 md:block",
            leftOpen ? "w-72" : "w-0 overflow-hidden"
          )}
        >
          {leftOpen ? (
          <Suspense fallback={null}>
            <SessionSidebar className="h-[calc(100dvh-1.5rem)]" />
          </Suspense>
        ) : null}
        </div>

        {/* Mobile left drawer */}
        {mobileLeft ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              aria-label="Close sessions"
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileLeft(false)}
              type="button"
            />
            <div className="absolute left-0 top-0 h-full w-72 p-3">
              <Suspense fallback={null}>
                <SessionSidebar className="h-full" />
              </Suspense>
            </div>
          </div>
        ) : null}

        {/* Center */}
        <main id="main-content" className="flex min-w-0 flex-1 flex-col">
          <div className="mb-2 hidden items-center justify-end gap-2 md:flex">
            <Button
              aria-label={leftOpen ? "Hide sessions" : "Show sessions"}
              size="icon-sm"
              variant="ghost"
              onClick={() => setLeftOpen((v) => !v)}
            >
              {leftOpen ? (
                <PanelLeftCloseIcon className="size-4" aria-hidden="true" />
              ) : (
                <PanelLeftIcon className="size-4" aria-hidden="true" />
              )}
            </Button>
            <Button
              aria-label={rightOpen ? "Hide inspector" : "Show inspector"}
              size="icon-sm"
              variant="ghost"
              onClick={() => setRightOpen((v) => !v)}
            >
              {rightOpen ? (
                <PanelRightCloseIcon className="size-4" aria-hidden="true" />
              ) : (
                <PanelRightIcon className="size-4" aria-hidden="true" />
              )}
            </Button>
          </div>
          {children}
        </main>

        {/* Right sidebar (desktop) */}
        <div
          className={cn(
            "hidden shrink-0 transition-all duration-300 xl:block",
            rightOpen ? "w-80" : "w-0 overflow-hidden"
          )}
        >
          {rightOpen ? (
          <Suspense fallback={null}>
            <InspectorPanel className="h-[calc(100dvh-1.5rem)]" />
          </Suspense>
        ) : null}
        </div>

        {/* Mobile right drawer */}
        {mobileRight ? (
          <div className="fixed inset-0 z-40 xl:hidden">
            <button
              aria-label="Close inspector"
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileRight(false)}
              type="button"
            />
            <div className="absolute right-0 top-0 h-full w-80 p-3">
              <Suspense fallback={null}>
                <InspectorPanel className="h-full" />
              </Suspense>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}