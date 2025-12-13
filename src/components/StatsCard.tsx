interface StatsCardProps {
  count: number;
  label: string;
  color: "orange" | "blue" | "green";
}

const StatsCard = ({ count, label, color }: StatsCardProps) => {
  const colorClasses = {
    orange: "text-orange-500",
    blue: "text-blue-500",
    green: "text-green-600",
  };

  return (
    <div className="flex flex-col items-center">
      <span className={`text-2xl font-bold ${colorClasses[color]}`}>{count}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
};

export default StatsCard;
