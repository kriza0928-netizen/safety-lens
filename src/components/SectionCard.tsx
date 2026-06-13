interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "warning" | "danger";
}

const variantStyles = {
  default: "border-slate-200 bg-white",
  warning: "border-amber-200 bg-amber-50/50",
  danger: "border-red-200 bg-red-50/50",
};

export default function SectionCard({
  title,
  icon,
  children,
  variant = "default",
}: SectionCardProps) {
  return (
    <section
      className={`rounded-2xl border p-4 shadow-sm ${variantStyles[variant]}`}
    >
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}
