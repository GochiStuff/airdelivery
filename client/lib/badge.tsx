export function Badge({ children, color }: { children: React.ReactNode; color: "green" | "yellow" | "gray" | "red" }) {
  const base = "inline-flex items-center rounded-full font-semibold text-xs px-3 py-1 border";
  const colors: Record<string, string> = {
    green: "bg-green-100 text-green-800 border-green-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    gray: "bg-zinc-100 text-zinc-800 border-zinc-200",
    red: "bg-red-100 text-red-800 border-red-200",
    
  };
  return <span className={`${base} ${colors[color]} transition`}>{children}</span>;
}