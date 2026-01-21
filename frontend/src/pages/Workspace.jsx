import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp, API } from "@/App";
import { Sidebar } from "@/components/app/Sidebar";
import { UploadZone } from "@/components/app/UploadZone";
import { StageProgress } from "@/components/app/StageProgress";
import { ControlPanel } from "@/components/app/ControlPanel";
import { StagePreview } from "@/components/app/StagePreview";
import { SettingsModal } from "@/components/app/SettingsModal";
import { toast } from "sonner";

export default function Workspace() {
  const { currentProject, setCurrentProject, setIsLoading } = useApp();
  const [showSettings, setShowSettings] = useState(false);
  const [currentStage, setCurrentStage] = useState(0); // 0 = upload, 1-3 = stages
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedPdf, setUploadedPdf] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [stageOutputs, setStageOutputs] = useState({
    stage1: null,
    stage2: null,
    stage3: null,
  });

  // Create a new project
  const createProject = async (name = "Untitled Project") => {
    try {
      const res = await fetch(`${API}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const project = await res.json();
      setCurrentProject(project);
      return project;
    } catch (e) {
      toast.error("Failed to create project");
      return null;
    }
  };

  // Handle image upload
  const handleImageUpload = useCallback(async (file) => {
    let project = currentProject;
    if (!project) {
      project = await createProject(`Skyline ${new Date().toLocaleDateString()}`);
      if (!project) return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsLoading(true);
      const res = await fetch(`${API}/upload/image/${project.id}`, {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Upload failed");
      }
      
      const data = await res.json();
      setUploadedImage({
        id: data.image_id,
        name: file.name,
        preview: URL.createObjectURL(file),
      });
      toast.success("Image uploaded successfully");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentProject, setIsLoading]);

  // Handle PDF upload
  const handlePdfUpload = useCallback(async (file) => {
    if (!currentProject) {
      toast.error("Please upload an image first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsLoading(true);
      const res = await fetch(`${API}/upload/style/${currentProject.id}`, {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Upload failed");
      }
      
      const data = await res.json();
      setUploadedPdf({
        id: data.pdf_id,
        name: file.name,
        textPreview: data.text_preview,
      });
      toast.success("Style PDF uploaded");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentProject, setIsLoading]);

  // Process Stage 1
  const processStage1 = async () => {
    if (!currentProject) return;
    
    setProcessing(true);
    setCurrentStage(1);
    
    try {
      const res = await fetch(`${API}/process/stage1/${currentProject.id}`, {
        method: "POST",
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Processing failed");
      }
      
      const data = await res.json();
      
      // Fetch the output image
      const fileRes = await fetch(`${API}/files/${data.output_id}`);
      const fileData = await fileRes.json();
      
      setStageOutputs(prev => ({
        ...prev,
        stage1: {
          id: data.output_id,
          data: fileData.data,
          response: data.gemini_response,
        },
      }));
      
      toast.success("Stage 1 complete - Vector style applied!");
    } catch (e) {
      toast.error(e.message);
      setCurrentStage(0);
    } finally {
      setProcessing(false);
    }
  };

  // Process Stage 2
  const processStage2 = async () => {
    if (!currentProject) return;
    
    setProcessing(true);
    setCurrentStage(2);
    
    try {
      const res = await fetch(`${API}/process/stage2/${currentProject.id}`, {
        method: "POST",
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Processing failed");
      }
      
      const data = await res.json();
      
      setStageOutputs(prev => ({
        ...prev,
        stage2: {
          layers: data.layers,
          totalDetections: data.total_detections,
        },
      }));
      
      toast.success("Stage 2 complete - Buildings layered!");
    } catch (e) {
      toast.error(e.message);
      setCurrentStage(1);
    } finally {
      setProcessing(false);
    }
  };

  // Process Stage 3
  const processStage3 = async () => {
    if (!currentProject) return;
    
    setProcessing(true);
    setCurrentStage(3);
    
    try {
      const res = await fetch(`${API}/process/stage3/${currentProject.id}`, {
        method: "POST",
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Processing failed");
      }
      
      const data = await res.json();
      
      // Fetch the composite image
      const fileRes = await fetch(`${API}/files/${data.composite_id}`);
      const fileData = await fileRes.json();
      
      setStageOutputs(prev => ({
        ...prev,
        stage3: {
          id: data.composite_id,
          data: fileData.data,
        },
      }));
      
      toast.success("Stage 3 complete - Composite ready!");
    } catch (e) {
      toast.error(e.message);
      setCurrentStage(2);
    } finally {
      setProcessing(false);
    }
  };

  // Download final
  const downloadFinal = async () => {
    if (!currentProject) return;
    
    window.open(`${API}/download/${currentProject.id}`, "_blank");
    toast.success("Download started!");
  };

  // Reset project
  const resetProject = () => {
    setCurrentProject(null);
    setUploadedImage(null);
    setUploadedPdf(null);
    setCurrentStage(0);
    setStageOutputs({ stage1: null, stage2: null, stage3: null });
  };

  return (
    <div className="flex h-screen overflow-hidden" data-testid="workspace">
      {/* Sidebar */}
      <Sidebar 
        onSettingsClick={() => setShowSettings(true)} 
        onNewProject={resetProject}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Stage Progress Header */}
        <StageProgress 
          currentStage={currentStage} 
          processing={processing}
          hasImage={!!uploadedImage}
          hasStage1={!!stageOutputs.stage1}
          hasStage2={!!stageOutputs.stage2}
          hasStage3={!!stageOutputs.stage3}
        />

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Stage */}
          <div className="flex-1 p-8 overflow-auto">
            <AnimatePresence mode="wait">
              {currentStage === 0 ? (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full flex flex-col gap-6"
                >
                  <UploadZone
                    type="image"
                    onUpload={handleImageUpload}
                    uploaded={uploadedImage}
                    accept="image/*"
                    maxSize={50}
                  />
                  <UploadZone
                    type="pdf"
                    onUpload={handlePdfUpload}
                    uploaded={uploadedPdf}
                    accept=".pdf"
                    maxSize={50}
                    disabled={!uploadedImage}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={`stage-${currentStage}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <StagePreview
                    stage={currentStage}
                    originalImage={uploadedImage}
                    stageOutputs={stageOutputs}
                    processing={processing}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Control Panel */}
          <ControlPanel
            currentStage={currentStage}
            uploadedImage={uploadedImage}
            uploadedPdf={uploadedPdf}
            stageOutputs={stageOutputs}
            processing={processing}
            onProcessStage1={processStage1}
            onProcessStage2={processStage2}
            onProcessStage3={processStage3}
            onDownload={downloadFinal}
            onReset={resetProject}
          />
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal 
        open={showSettings} 
        onOpenChange={setShowSettings} 
      />
    </div>
  );
}

export { Workspace };
