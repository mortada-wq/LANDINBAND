import { motion } from "framer-motion";
import { Upload, Wand2, Layers, Download, Check, Loader2 } from "lucide-react";

const stages = [
  { id: 0, label: "Upload", icon: Upload },
  { id: 1, label: "Style", icon: Wand2 },
  { id: 2, label: "Layer", icon: Layers },
  { id: 3, label: "Export", icon: Download },
];

export const StageProgress = ({ 
  currentStage, 
  processing,
  hasImage,
  hasStage1,
  hasStage2,
  hasStage3 
}) => {
  const getStageStatus = (stageId) => {
    if (stageId === 0) return hasImage ? "complete" : currentStage === 0 ? "active" : "pending";
    if (stageId === 1) return hasStage1 ? "complete" : currentStage === 1 ? "active" : "pending";
    if (stageId === 2) return hasStage2 ? "complete" : currentStage === 2 ? "active" : "pending";
    if (stageId === 3) return hasStage3 ? "complete" : currentStage === 3 ? "active" : "pending";
    return "pending";
  };

  return (
    <header className="border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl px-8 py-4" data-testid="stage-progress">
      <div className="flex items-center justify-between">
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Skyline Art Layerizer
          </h1>
          <p className="text-sm text-zinc-500">
            Transform cityscapes into layered vector art
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {stages.map((stage, index) => {
            const status = getStageStatus(stage.id);
            const Icon = stage.icon;
            const isProcessing = processing && currentStage === stage.id;

            return (
              <div key={stage.id} className="flex items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: status === "active" ? 1.05 : 1,
                  }}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg
                    ${status === "complete" 
                      ? "bg-emerald-500/10 text-emerald-400" 
                      : status === "active"
                        ? "bg-violet-500/10 text-violet-400"
                        : "bg-zinc-900/50 text-zinc-600"
                    }
                    transition-colors duration-300
                  `}
                  data-testid={`stage-${stage.id}`}
                >
                  <div className="relative">
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : status === "complete" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{stage.label}</span>
                </motion.div>

                {index < stages.length - 1 && (
                  <div className={`
                    w-8 h-px mx-1
                    ${status === "complete" ? "bg-emerald-500/50" : "bg-zinc-800"}
                  `} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
};
