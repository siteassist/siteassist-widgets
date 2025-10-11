import type { Project } from "@/types";
import { createContext, useContext } from "react";

export const ProjectContext = createContext<Project | null>(null);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must use insdie ProjectProvider");
  }
  return context;
};
