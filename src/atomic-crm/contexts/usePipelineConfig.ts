/**
 * Hook to access pipeline configuration (stages, categories)
 *
 * Use this when you need opportunity/deal stage info - prevents re-renders
 * when branding or form options change.
 */
import { useContext } from "react";
import { PipelineConfigContext } from "./PipelineConfigContext";

export const usePipelineConfig = () => useContext(PipelineConfigContext);
