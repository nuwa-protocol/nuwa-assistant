'use client';
import Script from 'next/script';
import { FloatingSidebarLayout } from '@/components/floating-sidebar';

export const experimental_ppr = true;

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <FloatingSidebarLayout>
        {children}
      </FloatingSidebarLayout>
    </>
  );
}
