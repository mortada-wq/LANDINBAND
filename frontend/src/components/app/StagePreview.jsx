import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export const StagePreview = ({ stage, originalImage, stageOutputs, processing }) => {
  if (processing) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6" data-testid="stage-preview-loading">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div className="w-24 h-24 rounded-2xl bg-violet-500/10 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
          </div>
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-violet-500/30"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        <div className="text-center">
          <p className="text-lg font-semibold text-white">
            {stage === 1 && "Applying vector style transformation..."}
            {stage === 2 && "Detecting buildings and creating layers..."}
            {stage === 3 && "Compositing layered artwork..."}
          </p>
          <p className="text-sm text-zinc-500 mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  // Stage 1 Preview - Split View
  if (stage === 1 && stageOutputs.stage1) {
    return (
      <div className="h-full flex flex-col gap-6" data-testid="stage1-preview">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Stage 1: Vector Style Applied</h2>
          <p className="text-zinc-400 mt-1">Your cityscape transformed into vector line art</p>
        </div>
        
        <div className="flex-1 grid grid-cols-2 gap-6">
          {/* Original */}
          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-zinc-900/50">
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-xs text-zinc-300">
              Original
            </div>
            {originalImage?.preview && (
              <img 
                src={originalImage.preview} 
                alt="Original" 
                className="w-full h-full object-contain"
              />
            )}
          </div>
          
          {/* Styled */}
          <div className="relative rounded-xl overflow-hidden border border-violet-500/30 bg-zinc-900/50 glow-violet">
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-violet-500/20 backdrop-blur-sm text-xs text-violet-300">
              Vector Style
            </div>
            <img 
              src={`data:image/png;base64,${stageOutputs.stage1.data}`}
              alt="Styled" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>
    );
  }

  // Stage 2 Preview - Layer Breakdown
  if (stage === 2 && stageOutputs.stage2) {
    return (
      <div className="h-full flex flex-col gap-6" data-testid="stage2-preview">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Stage 2: Building Layers Detected</h2>
          <p className="text-zinc-400 mt-1">
            {stageOutputs.stage2.totalDetections} buildings segmented into 3 depth layers
          </p>
        </div>

        {/* Layer visualization */}
        <div className="flex-1 flex flex-col gap-4 max-w-2xl mx-auto w-full">
          {stageOutputs.stage2.layers?.map((layer, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.15 }}
              className={`
                flex-1 rounded-xl border-2 p-6 flex items-center justify-between
                ${idx === 0 ? "layer-far border-blue-500/50" : 
                  idx === 1 ? "layer-mid border-amber-500/50" : 
                  "layer-front border-red-500/50"}
              `}
            >
              <div>
                <h3 className="text-xl font-bold text-white">{layer.layer_name}</h3>
                <p className="text-zinc-400 mt-1">
                  {idx === 0 && "Distant skyscrapers and tall buildings"}
                  {idx === 1 && "Medium-height structures in the middle"}
                  {idx === 2 && "Closest buildings to the viewer"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold" style={{ color: layer.color }}>
                  {layer.building_count}
                </p>
                <p className="text-sm text-zinc-500">buildings</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Visual representation */}
        <div className="flex justify-center gap-4">
          <div className="flex items-end gap-1 p-4 rounded-xl bg-zinc-900/50 border border-white/10">
            <div className="w-6 bg-blue-500/30 border border-blue-500/50 rounded-t" style={{ height: '80px' }} />
            <div className="w-6 bg-blue-500/30 border border-blue-500/50 rounded-t" style={{ height: '100px' }} />
            <div className="w-6 bg-amber-500/30 border border-amber-500/50 rounded-t" style={{ height: '60px' }} />
            <div className="w-6 bg-amber-500/30 border border-amber-500/50 rounded-t" style={{ height: '50px' }} />
            <div className="w-6 bg-red-500/30 border border-red-500/50 rounded-t" style={{ height: '30px' }} />
            <div className="w-6 bg-red-500/30 border border-red-500/50 rounded-t" style={{ height: '25px' }} />
          </div>
          <div className="flex flex-col justify-center text-sm text-zinc-500 gap-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500/50" />
              <span>Layer 3 (Far)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-500/50" />
              <span>Layer 2 (Mid)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500/50" />
              <span>Layer 1 (Front)</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stage 3 Preview - Final Composite
  if (stage === 3 && stageOutputs.stage3) {
    return (
      <div className="h-full flex flex-col gap-6" data-testid="stage3-preview">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Stage 3: Layered Composite Complete</h2>
          <p className="text-zinc-400 mt-1">Your stacked vector skyline artwork is ready</p>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-3xl w-full"
          >
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-500/20 via-cyan-500/20 to-amber-500/20 blur-xl" />
            <div className="relative rounded-xl overflow-hidden border border-white/20 bg-zinc-900/50">
              <img 
                src={`data:image/png;base64,${stageOutputs.stage3.data}`}
                alt="Final Composite" 
                className="w-full h-auto"
              />
            </div>
          </motion.div>
        </div>

        <div className="text-center text-sm text-zinc-500">
          Click "Save & Download PNG" to export your artwork
        </div>
      </div>
    );
  }

  // Default view
  return (
    <div className="h-full flex items-center justify-center text-zinc-500" data-testid="stage-preview-empty">
      <p>Processing stage {stage}...</p>
    </div>
  );
};
