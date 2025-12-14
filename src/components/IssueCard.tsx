import { Issue } from "@/types/issue";
import { MapPin, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface IssueCardProps {
  issue: Issue;
  index?: number;
}

const statusStyles = {
  pending: "bg-orange-100 text-orange-700",
  "in-progress": "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
};

const statusLabels = {
  pending: "Pending",
  "in-progress": "In Progress",
  resolved: "Resolved",
};

const IssueCard = ({ issue, index = 0 }: IssueCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.button
      onClick={() => navigate(`/issue/${issue.id}`)}
      className="w-full flex gap-4 p-4 bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow text-left"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ 
        scale: 1.02, 
        boxShadow: "0 8px 25px rgba(0,0,0,0.1)"
      }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.img
        src={issue.thumbnail}
        alt={issue.category}
        className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: index * 0.08 + 0.1 }}
        whileHover={{ scale: 1.05 }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground truncate">{issue.category}</h3>
          <motion.span 
            className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${statusStyles[issue.status]}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.08 + 0.15 }}
          >
            {statusLabels[issue.status]}
          </motion.span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{issue.location}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(issue.date).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.button>
  );
};

export default IssueCard;
