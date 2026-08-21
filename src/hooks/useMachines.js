import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { MACHINES as BUILT_IN_MACHINES } from "@/lib/machines";

const CUSTOM_KEY = "custom_machines";
const HIDDEN_KEY = "hidden_machines";

async function getSetting(key) {
  const results = await base44.entities.Setting.filter({ key });
  return results && results.length > 0 ? results[0] : null;
}

async function saveSetting(key, value) {
  const existing = await getSetting(key);
  if (existing) {
    await base44.entities.Setting.update(existing.id, { value });
  } else {
    await base44.entities.Setting.create({ key, value });
  }
}

/**
 * Loads the machine list from the Setting entity, merging built-in machines
 * (minus any hidden ones) with admin-added custom machines.
 * Returns { machines, loading, addMachine, removeMachine, isCustom, isHidden, restoreMachine }.
 */
export function useMachines() {
  const [customMachines, setCustomMachines] = useState([]);
  const [hiddenMachines, setHiddenMachines] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [custom, hidden] = await Promise.all([
        getSetting(CUSTOM_KEY),
        getSetting(HIDDEN_KEY),
      ]);
      setCustomMachines(custom ? JSON.parse(custom.value) : []);
      setHiddenMachines(hidden ? JSON.parse(hidden.value) : []);
    } catch (e) {
      console.error("Failed to load machine settings", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const machines = [
    ...BUILT_IN_MACHINES.filter((m) => !hiddenMachines.includes(m.name)),
    ...customMachines,
  ];

  const isCustom = (name) => customMachines.some((m) => m.name === name);
  const isHidden = (name) => hiddenMachines.includes(name);

  const addMachine = useCallback(async (machine) => {
    const updated = [...customMachines, machine];
    setCustomMachines(updated);
    await saveSetting(CUSTOM_KEY, JSON.stringify(updated));
  }, [customMachines]);

  const removeMachine = useCallback(async (machineName) => {
    if (customMachines.some((m) => m.name === machineName)) {
      const updated = customMachines.filter((m) => m.name !== machineName);
      setCustomMachines(updated);
      await saveSetting(CUSTOM_KEY, JSON.stringify(updated));
    } else {
      const updated = [...hiddenMachines, machineName];
      setHiddenMachines(updated);
      await saveSetting(HIDDEN_KEY, JSON.stringify(updated));
    }
  }, [customMachines, hiddenMachines]);

  const restoreMachine = useCallback(async (machineName) => {
    const updated = hiddenMachines.filter((n) => n !== machineName);
    setHiddenMachines(updated);
    await saveSetting(HIDDEN_KEY, JSON.stringify(updated));
  }, [hiddenMachines]);

  return { machines, loading, addMachine, removeMachine, restoreMachine, isCustom, isHidden, hiddenMachines, customMachines };
}