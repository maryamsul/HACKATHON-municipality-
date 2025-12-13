import { LucideIcon } from "lucide-react";

interface CategoryItemProps {
  icon: LucideIcon;
  label: string;
  iconColor?: string;
  iconBgColor?: string;
}

const CategoryItem = ({ icon: Icon, label, iconColor = "text-blue-600", iconBgColor = "bg-blue-100" }: CategoryItemProps) => {
  return (
    <button className="flex flex-col items-center gap-2 p-4 hover:bg-accent rounded-xl transition-colors">
      <div className={`w-14 h-14 ${iconBgColor} rounded-2xl flex items-center justify-center`}>
        <Icon className={`w-7 h-7 ${iconColor}`} />
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  );
};

export default CategoryItem;
