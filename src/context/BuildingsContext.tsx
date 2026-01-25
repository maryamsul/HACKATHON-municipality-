import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { BuildingAtRisk, BuildingStatus } from "@/types/building";
import { supabase } from "@/integrations/supabase/client";

interface BuildingsContextType {
  buildings: BuildingAtRisk[];
  loading: boolean;
  refetchBuildings: () => Promise<void>;
}

const BuildingsContext = createContext<BuildingsContextType | undefined>(undefined);

// Database has exact statuses: pending | Critical | Under Inspection | Resolved
// No normalization needed - values are stored as-is
const normalizeStatus = (status: string): BuildingStatus => {
  // Only accept exact DB values
  if (status === "pending" || status === "Critical" || status === "Under Inspection" || status === "Resolved") {
    return status;
  }
  // Fallback for any unexpected legacy data
  return "pending";
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
