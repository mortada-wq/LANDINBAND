import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Wand2, 
  Layers, 
  Download, 
  RefreshCw, 
  AlertCircle,
  Check,
  Loader2,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import { useApp } from "@/App";

export const ControlPanel = ({
  currentStage,
  uploadedImage,
  uploadedPdf,
  stageOutputs,
  processing,
  onProcessStage1,
  onProcessStage2,
  onProcessStage3,
  onDownload,
  onReset,
}) => {
  const { settings } = useApp();

  const canProcessStage1 = uploadedImage && settings.geminiKeySet && !processing;
  const canProcessStage2 = stageOutputs.stage1 && settings.visionKeySet && !processing;
  const canProcessStage3 = stageOutputs.stage2 && !processing;
  const canDownload = stageOutputs.stage3;

  return (
    <aside 
      className="w-80 border-l border-white/10 bg-zinc-950/50 backdrop-blur-xl flex flex-col"
      data-testid="control-panel"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Controls</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Process your skyline artwork
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* API Status */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            API Status
          </h3>
          <div className="space-y-2">
            <div className={`
              flex items-center gap-3 p-3 rounded-lg border
              ${settings.geminiKeySet 
                ? "bg-emerald-500/5 border-emerald-500/20" 
                : "bg-amber-500/5 border-amber-500/20"}
            `}>
              <div className={`
                w-2 h-2 rounded-full
                ${settings.geminiKeySet ? "bg-emerald-500" : "bg-amber-500"}
              `} />
              <span className="text-sm text-zinc-300">Gemini API</span>
              <span className={`
                ml-auto text-xs
                ${settings.geminiKeySet ? "text-emerald-400" : "text-amber-400"}
              `}>
                {settings.geminiKeySet ? "Connected" : "Not Set"}
              </span>
            </div>
            <div className={`
              flex items-center gap-3 p-3 rounded-lg border
              ${settings.visionKeySet 
                ? "bg-emerald-500/5 border-emerald-500/20" 
                : "bg-amber-500/5 border-amber-500/20"}
            `}>
              <div className={`
                w-2 h-2 rounded-full
                ${settings.visionKeySet ? "bg-emerald-500" : "bg-amber-500"}
              `} />
              <span className="text-sm text-zinc-300">Vision API</span>
              <span className={`
                ml-auto text-xs
                ${settings.visionKeySet ? "text-emerald-400" : "text-amber-400"}
              `}>
                {settings.visionKeySet ? "Connected" : "Not Set"}
              </span>
            </div>
          </div>
        </div>

        {/* Uploads Summary */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Files
          </h3>
          <div className="space-y-2">
            <div className={`
              flex items-center gap-3 p-3 rounded-lg border border-white/10
              ${uploadedImage ? "bg-zinc-900/50" : "bg-zinc-900/20"}
            `}>
              <ImageIcon className={`w-4 h-4 ${uploadedImage ? "text-violet-400" : "text-zinc-600"}`} />
              <span className="text-sm text-zinc-300 truncate flex-1">
                {uploadedImage?.name || "No image"}
              </span>
              {uploadedImage && <Check className="w-4 h-4 text-emerald-500" />}
            </div>
            <div className={`
              flex items-center gap-3 p-3 rounded-lg border border-white/10
              ${uploadedPdf ? "bg-zinc-900/50" : "bg-zinc-900/20"}
            `}>
              <FileText className={`w-4 h-4 ${uploadedPdf ? "text-amber-400" : "text-zinc-600"}`} />
              <span className="text-sm text-zinc-300 truncate flex-1">
                {uploadedPdf?.name || "No style PDF"}
              </span>
              {uploadedPdf && <Check className="w-4 h-4 text-emerald-500" />}
            </div>
          </div>
        </div>

        {/* Processing Buttons */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Processing
          </h3>
          
          {/* Stage 1 Button */}
          <motion.div whileHover={canProcessStage1 ? { scale: 1.02 } : {}}>
            <Button
              className={`
                w-full justify-start gap-3 h-12
                ${stageOutputs.stage1 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                  : canProcessStage1 
                    ? "bg-violet-600 hover:bg-violet-700 text-white shadow-[0_0_20px_-5px_rgba(139,92,246,0.5)]" 
                    : "bg-zinc-800 text-zinc-500"}
              `}
              onClick={onProcessStage1}
              disabled={!canProcessStage1}
              data-testid="process-stage1-btn"
            >
              {processing && currentStage === 1 ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : stageOutputs.stage1 ? (
                <Check className="w-5 h-5" />
              ) : (
                <Wand2 className="w-5 h-5" />
              )}
              <span className="flex-1 text-left">
                {stageOutputs.stage1 ? "Stage 1 Complete" : "Apply Vector Style"}
              </span>
            </Button>
          </motion.div>

          {/* Stage 2 Button */}
          <motion.div whileHover={canProcessStage2 ? { scale: 1.02 } : {}}>
            <Button
              className={`
                w-full justify-start gap-3 h-12
                ${stageOutputs.stage2 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                  : canProcessStage2 
                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-[0_0_20px_-5px_rgba(245,158,11,0.5)]" 
                    : "bg-zinc-800 text-zinc-500"}
              `}
              onClick={onProcessStage2}
              disabled={!canProcessStage2}
              data-testid="process-stage2-btn"
            >
              {processing && currentStage === 2 ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : stageOutputs.stage2 ? (
                <Check className="w-5 h-5" />
              ) : (
                <Layers className="w-5 h-5" />
              )}
              <span className="flex-1 text-left">
                {stageOutputs.stage2 ? "Stage 2 Complete" : "Detect & Layer Buildings"}
              </span>
            </Button>
          </motion.div>

          {/* Stage 3 Button */}
          <motion.div whileHover={canProcessStage3 ? { scale: 1.02 } : {}}>
            <Button
              className={`
                w-full justify-start gap-3 h-12
                ${stageOutputs.stage3 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                  : canProcessStage3 
                    ? "bg-cyan-500 hover:bg-cyan-600 text-white shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]" 
                    : "bg-zinc-800 text-zinc-500"}
              `}
              onClick={onProcessStage3}
              disabled={!canProcessStage3}
              data-testid="process-stage3-btn"
            >
              {processing && currentStage === 3 ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : stageOutputs.stage3 ? (
                <Check className="w-5 h-5" />
              ) : (
                <Layers className="w-5 h-5" />
              )}
              <span className="flex-1 text-left">
                {stageOutputs.stage3 ? "Stage 3 Complete" : "Create Composite"}
              </span>
            </Button>
          </motion.div>
        </div>

        {/* Layer Info */}
        {stageOutputs.stage2 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Layer Breakdown
            </h3>
            <div className="space-y-2">
              {stageOutputs.stage2.layers?.map((layer, idx) => (
                <div 
                  key={idx}
                  className={`
                    p-3 rounded-lg border
                    ${idx === 0 ? "layer-far border-blue-500/30" : 
                      idx === 1 ? "layer-mid border-amber-500/30" : 
                      "layer-front border-red-500/30"}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">
                      {layer.layer_name}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {layer.building_count} buildings
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-white/10 space-y-3">
        {canDownload && (
          <Button
            className="w-full h-12 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white font-semibold"
            onClick={onDownload}
            data-testid="download-btn"
          >
            <Download className="w-5 h-5 mr-2" />
            Save & Download PNG
          </Button>
        )}
        
        <Button
          variant="ghost"
          className="w-full text-zinc-400 hover:text-white hover:bg-white/5"
          onClick={onReset}
          data-testid="reset-btn"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Start New Project
        </Button>
      </div>
    </aside>
  );
};
