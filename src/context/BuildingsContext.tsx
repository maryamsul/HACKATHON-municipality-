import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { BuildingAtRisk, BuildingStatus } from "@/types/building";
import { supabase } from "@/integrations/supabase/client";

interface BuildingsContextType {
  buildings: BuildingAtRisk[];
  loading: boolean;
  refetchBuildings: () => Promise<void>;
}

const BuildingsContext = createContext<BuildingsContextType | undefined>(undefined);

// Normalize legacy status values - now includes "pending" as valid status
const normalizeStatus = (status: string): BuildingStatus => {
  const statusMap: Record<string, BuildingStatus> = {
    // Pending is now a first-class status for new reports
    pending: "pending",
    reported: "pending",

    // Critical status
    under_review: "critical",
    critical: "critical",

    // Under maintenance
    under_inspection: "under_maintenance",
    in_progress: "under_maintenance",
    "in-progress": "under_maintenance",
    under_maintenance: "under_maintenance",

    // Resolved
    resolved: "resolved",
  };

  return statusMap[status] || "pending";
};

export const BuildingsProvider = ({ children }: { children: ReactNode }) => {
  const [buildings, setBuildings] = useState<BuildingAtRisk[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBuildings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("buildings_at_risk")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching buildings at risk:", error);
        setBuildings([]);
      } else {
        // Map database columns to BuildingAtRisk type with UI-friendly building_name
        const normalizedBuildings = (data || []).map((building) => ({
          ...building,
          status: normalizeStatus(building.status),
          building_name: building.title || "Unknown Building",
        })) as BuildingAtRisk[];
        setBuildings(normalizedBuildings);
      }
    } catch (err) {
      console.error("Unexpected error fetching buildings:", err);
      setBuildings([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBuildings();

    // Subscribe to realtime updates for immediate display of new reports
    const channel = supabase
      .channel("buildings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "buildings_at_risk" },
        () => {
          fetchBuildings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <BuildingsContext.Provider value={{ buildings, loading, refetchBuildings: fetchBuildings }}>
      {children}
    </BuildingsContext.Provider>
  );
};

export const useBuildings = () => {
  const context = useContext(BuildingsContext);
  if (!context) {
    throw new Error("useBuildings must be used within BuildingsProvider");
  }
  return context;
};
