import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { BuildingAtRisk, BuildingStatus } from "@/types/building";
import { supabase } from "@/integrations/supabase/client";

interface BuildingsContextType {
  buildings: BuildingAtRisk[];
  loading: boolean;
  refetchBuildings: () => Promise<void>;
  updateBuildingOptimistic: (buildingId: string, updates: Partial<BuildingAtRisk>) => void;
}

const BuildingsContext = createContext<BuildingsContextType | undefined>(undefined);

// Database statuses: pending | critical | under_maintenance | resolved
const normalizeStatus = (status: string): BuildingStatus => {
  if (status === "pending" || status === "critical" || status === "under_maintenance" || status === "resolved") {
    return status;
  }
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

  // Optimistic update for a single building
  const updateBuildingOptimistic = useCallback((buildingId: string, updates: Partial<BuildingAtRisk>) => {
    setBuildings((prevBuildings) =>
      prevBuildings.map((building) => (building.id === buildingId ? { ...building, ...updates } : building)),
    );
  }, []);

  useEffect(() => {
    fetchBuildings();

    // Subscribe to realtime updates - debounce to avoid overwriting optimistic updates
    let refetchTimeout: NodeJS.Timeout | null = null;
    
    const channel = supabase
      .channel("buildings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "buildings_at_risk" },
        () => {
          // Debounce refetch to avoid race conditions with optimistic updates
          if (refetchTimeout) clearTimeout(refetchTimeout);
          refetchTimeout = setTimeout(() => {
            fetchBuildings();
          }, 500); // Wait 500ms before refetching
        }
      )
      .subscribe();

    return () => {
      if (refetchTimeout) clearTimeout(refetchTimeout);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <BuildingsContext.Provider
      value={{ buildings, loading, refetchBuildings: fetchBuildings, updateBuildingOptimistic }}
    >
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
