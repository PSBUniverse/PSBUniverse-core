"use client";

import AuthProvider from "@/core/auth/AuthProvider";
import AppLayout from "@/shared/components/layout/AppLayout";
import { GlobalToastHost } from "@/shared/components/ui";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <GlobalToastHost />
      <AppLayout>{children}</AppLayout>
    </AuthProvider>
  );
}
