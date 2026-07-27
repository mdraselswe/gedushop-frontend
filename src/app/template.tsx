/**
 * Re-mounts on every route change, giving each page a soft fade/rise-in so
 * navigation feels composed instead of content popping in.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div style={{ animation: "page-in 0.28s cubic-bezier(0.22,1,0.36,1)" }}>{children}</div>;
}
