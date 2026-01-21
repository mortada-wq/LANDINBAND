import { Settings, Plus, Layers, Home } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Sidebar = ({ onSettingsClick, onNewProject }) => {
  return (
    <aside className="w-16 border-r border-white/10 bg-zinc-950/50 backdrop-blur-xl flex flex-col items-center py-6 gap-4">
      {/* Logo */}
      <div className="mb-4" data-testid="sidebar-logo">
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center shadow-lg glow-violet"
        >
          <Layers className="w-5 h-5 text-white" />
        </motion.div>
      </div>

      {/* Nav Items */}
      <TooltipProvider delayDuration={100}>
        <nav className="flex flex-col gap-2 flex-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 text-zinc-400 hover:text-white hover:bg-white/5"
                data-testid="sidebar-home-btn"
              >
                <Home className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Home</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 text-zinc-400 hover:text-white hover:bg-white/5"
                onClick={onNewProject}
                data-testid="sidebar-new-project-btn"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>New Project</p>
            </TooltipContent>
          </Tooltip>
        </nav>

        {/* Settings at bottom */}
        <div className="mt-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 text-zinc-400 hover:text-white hover:bg-white/5"
                onClick={onSettingsClick}
                data-testid="sidebar-settings-btn"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>API Settings</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </aside>
  );
};
