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

// Database now has exact statuses: pending | critical | under_maintenance | resolved
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

    // ✅ Single realtime subscription that merges payloads directly
    const channel = supabase
      .channel("buildings-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "buildings_at_risk" }, (payload) => {
        if (payload.eventType === "UPDATE") {
          setBuildings((prev) => prev.map((b) => (b.id === payload.new.id ? { ...b, ...payload.new } : b)));
        } else if (payload.eventType === "INSERT") {
          setBuildings((prev) => [payload.new as BuildingAtRisk, ...prev]);
        } else if (payload.eventType === "DELETE") {
          setBuildings((prev) => prev.filter((b) => b.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
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
