import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { BuildingAtRisk, BuildingStatus } from "@/types/building";
import { supabase } from "@/integrations/supabase/client";

interface BuildingsContextType {
  buildings: BuildingAtRisk[];
  loading: boolean;
  refetchBuildings: () => Promise<void>;
}

const BuildingsContext = createContext<BuildingsContextType | undefined>(undefined);

// Normalize status values to ensure consistency
const normalizeStatus = (status: string): BuildingStatus => {
  const statusMap: Record<string, BuildingStatus> = {
    "pending": "pending",
    "under_inspection": "under_inspection",
    "reported": "pending",
    "critical": "under_inspection",
    "resolved": "resolved",
  };
  return statusMap[status] || "pending";
};

export const BuildingsProvider = ({ children }: { children: ReactNode }) => {
  const [buildings, setBuildings] = useState<BuildingAtRisk[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBuildings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("buildings_at_risk")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching buildings at risk:", error);
    } else {
      // Map database columns to BuildingAtRisk type with UI-friendly building_name
      const normalizedBuildings = (data || []).map((building) => ({
        ...building,
        status: normalizeStatus(building.status),
        building_name: building.title || "Unknown Building",
      })) as BuildingAtRisk[];
      setBuildings(normalizedBuildings);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBuildings();

    // Subscribe to realtime updates
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
