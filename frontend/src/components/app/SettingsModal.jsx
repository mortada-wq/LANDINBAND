import { useState } from "react";
import { motion } from "framer-motion";
import { useApp, API } from "@/App";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Check, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const SettingsModal = ({ open, onOpenChange }) => {
  const { settings, fetchSettings } = useApp();
  const [geminiKey, setGeminiKey] = useState("");
  const [visionKey, setVisionKey] = useState("");
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showVisionKey, setShowVisionKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!geminiKey && !visionKey) {
      toast.error("Please enter at least one API key");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gemini_api_key: geminiKey || "",
          vision_api_key: visionKey || "",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to save settings");
      }

      await fetchSettings();
      toast.success("API keys saved successfully");
      setGeminiKey("");
      setVisionKey("");
      onOpenChange(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-zinc-950 border-white/10" data-testid="settings-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">API Settings</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Configure your Google Cloud API keys to enable processing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Gemini API Key */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="gemini-key" className="text-sm font-medium text-zinc-300">
                Google Gemini API Key
              </Label>
              {settings.geminiKeySet && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <Check className="w-3 h-3" />
                  Configured
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                id="gemini-key"
                type={showGeminiKey ? "text" : "password"}
                placeholder={settings.geminiKeySet ? "••••••••••••••••" : "Enter your Gemini API key"}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="bg-zinc-900 border-zinc-800 pr-10 font-mono text-sm"
                data-testid="gemini-key-input"
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              Used for Stage 1: Style transformation
            </p>
          </div>

          {/* Vision API Key */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="vision-key" className="text-sm font-medium text-zinc-300">
                Google Cloud Vision API Key
              </Label>
              {settings.visionKeySet && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <Check className="w-3 h-3" />
                  Configured
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                id="vision-key"
                type={showVisionKey ? "text" : "password"}
                placeholder={settings.visionKeySet ? "••••••••••••••••" : "Enter your Vision API key"}
                value={visionKey}
                onChange={(e) => setVisionKey(e.target.value)}
                className="bg-zinc-900 border-zinc-800 pr-10 font-mono text-sm"
                data-testid="vision-key-input"
              />
              <button
                type="button"
                onClick={() => setShowVisionKey(!showVisionKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showVisionKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              Used for Stage 2: Building detection
            </p>
          </div>

          {/* Help Links */}
          <div className="p-4 rounded-lg bg-zinc-900/50 border border-white/10 space-y-3">
            <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              How to get API keys
            </h4>
            <div className="space-y-2 text-sm">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Get Gemini API Key (Google AI Studio)
              </a>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Get Vision API Key (Google Cloud Console)
              </a>
            </div>
            <p className="text-xs text-zinc-500">
              Note: Vision API requires a Google Cloud project with billing enabled.
              The Vision API must be enabled for your project.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="ghost"
            className="flex-1 text-zinc-400 hover:text-white"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
            onClick={handleSave}
            disabled={saving || (!geminiKey && !visionKey)}
            data-testid="save-settings-btn"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
