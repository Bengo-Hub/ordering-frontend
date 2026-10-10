// Staff pages get the admin shell (dashboard/staff/layout.tsx), which carries the
// subscription banner; the customer dashboard stays on the storefront shell.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
