'use client';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import Script from 'next/script';
import { useSettingsStore } from '@/lib/stores/settings-store';

export const experimental_ppr = true;

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarCollapsed = useSettingsStore(state => state.sidebarCollapsed);

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SidebarProvider defaultOpen={!sidebarCollapsed}>
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </>
  );
}
