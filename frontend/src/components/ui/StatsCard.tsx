import { LucideIcon } from "lucide-react";

export interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  activeClass?: string;
  onClick?: () => void;
  animationDelay?: number;
}

export default function StatsCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  activeClass = "",
  onClick,
  animationDelay = 0,
}: StatsCardProps) {
  function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const normalizedX =
      rect.width > 0 ? (e.clientX - centerX) / (rect.width / 2) : 0;
    const tiltY = Math.max(-5, Math.min(5, normalizedX * 5));
    const tiltZ = Math.max(-5, Math.min(5, normalizedX * 5));
    el.style.setProperty("--card-tilt-y", `${tiltY}deg`);
    el.style.setProperty("--card-tilt-z", `${tiltZ}deg`);
  }

  function handleMouseLeave(e: React.MouseEvent<HTMLButtonElement>) {
    const el = e.currentTarget;
    el.style.setProperty("--card-tilt-y", "0deg");
    el.style.setProperty("--card-tilt-z", "0deg");
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`stats-card p-4 text-left w-full cursor-pointer animate-slide-up ${activeClass}`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex items-center justify-between">
          <p className={`text-sm font-medium ${iconColor}`}>{label}</p>
          <p className="text-2xl font-display font-bold text-black">
            {value}
          </p>
        {/* <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
        >
          <Icon size={24} className={iconColor} />
        </div> */}
      </div>
    </button>
  );
}
