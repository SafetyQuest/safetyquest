// apps/web/components/admin/games/HotspotEditor.tsx
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import MediaSelector from '../MediaSelector';
import InfoTooltip from './ui/InfoTooltip';
import GameSummary from './ui/GameSummary';

// ============================================================================
// TYPES
// ============================================================================

type Hotspot = {
  x: number;        // percentage (0-100)
  y: number;        // percentage (0-100)
  radius: number;   // percentage (1-10)
  label: string;
  xp?: number;      // for lesson games
  points?: number;  // for quiz questions
};

type HotspotConfig = {
  instruction: string;
  imageUrl: string;
  hotspots: Hotspot[];
  totalXp?: number;     // calculated sum
  totalPoints?: number; // calculated sum
};

type HotspotEditorProps = {
  config: any;
  onChange: (newConfig: HotspotConfig) => void;
  isQuizQuestion: boolean;
  onClose?: () => void; // Optional — but we removed the button, so unused
};

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_RADIUS = 5;       // default hotspot radius (percentage)
const MIN_RADIUS = 1;
const MAX_RADIUS = 50;

// ============================================================================
// COMPONENT
// ============================================================================

export default function HotspotEditor({
  config,
  onChange,
  isQuizQuestion,
  // onClose — not used anymore
}: HotspotEditorProps) {
  const [selectedHotspotIndex, setSelectedHotspotIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [, setImageDimensions] = useState({ width: 0, height: 0 }); // Track for re-render
  const imageRef = useRef<HTMLDivElement>(null);
  const dragOccurredRef = useRef(false); // Use ref for synchronous access
  const lastRadiusErrorRef = useRef<number>(0); // Track last error time to prevent spam
  
  // Initialize config with proper structure - useMemo prevents recreation on every render
  const initializedConfig: HotspotConfig = useMemo(() => ({
    instruction: config.instruction || 'Click on all the correct areas in the image',
    imageUrl: config.imageUrl || '',
    hotspots: config.hotspots || [],
    ...(isQuizQuestion 
      ? { totalPoints: config.totalPoints || 0 }
      : { totalXp: config.totalXp || 0 }
    )
  }), [config, isQuizQuestion]);
  
  // Local state for instruction to prevent re-render on every keystroke
  const [localInstruction, setLocalInstruction] = useState(config.instruction || 'Click on all the correct areas in the image');
  
  // Local state for currently editing hotspot label
  const [editingLabel, setEditingLabel] = useState<string>('');
  
  // Local state for radius slider to allow smooth dragging
  const [localRadius, setLocalRadius] = useState<number>(DEFAULT_RADIUS);
  
  // Sync local instruction with config when config changes externally
  useEffect(() => {
    setLocalInstruction(config.instruction || 'Click on all the correct areas in the image');
  }, [config.instruction]);
  
  // Update editing label when selected hotspot changes
  useEffect(() => {
    if (selectedHotspotIndex !== null && initializedConfig.hotspots[selectedHotspotIndex]) {
      setEditingLabel(initializedConfig.hotspots[selectedHotspotIndex].label);
      setLocalRadius(initializedConfig.hotspots[selectedHotspotIndex].radius);
    }
  }, [selectedHotspotIndex, initializedConfig.hotspots]);
  
  // ============================================================================
  // IMAGE DIMENSION TRACKING (for circular hotspots)
  // ============================================================================
  
  const updateImageDimensions = () => {
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      setImageDimensions({ width: rect.width, height: rect.height });
    }
  };
  
  useEffect(() => {
    // Update on window resize
    window.addEventListener('resize', updateImageDimensions);
    
    // Initial update
    updateImageDimensions();
    
    return () => {
      window.removeEventListener('resize', updateImageDimensions);
    };
  }, [initializedConfig.imageUrl]);
  
  // ============================================================================
  // AUTO-CALCULATE TOTAL REWARD
  // ============================================================================
  
  useEffect(() => {
    const total = initializedConfig.hotspots.reduce((sum, hotspot) => {
      return sum + (isQuizQuestion ? (hotspot.points || 0) : (hotspot.xp || 0));
    }, 0);
    
    // Only update if total changed
    const currentTotal = isQuizQuestion ? initializedConfig.totalPoints : initializedConfig.totalXp;
    if (currentTotal !== total) {
      const updatedConfig = {
        ...initializedConfig,
        ...(isQuizQuestion ? { totalPoints: total } : { totalXp: total })
      };
      onChange(updatedConfig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Only watch the reward values and count, not labels or other fields
    initializedConfig.hotspots.length,
    JSON.stringify(initializedConfig.hotspots.map(h => 
      isQuizQuestion ? h.points : h.xp
    )),
    isQuizQuestion
  ]);
  
  // ============================================================================
  // DUPLICATE DETECTION
  // ============================================================================
  
  const checkDuplicateHotspot = (x: number, y: number, excludeIndex?: number, radius?: number): boolean => {
    const currentRadius = radius !== undefined ? radius : DEFAULT_RADIUS;
    
    return initializedConfig.hotspots.some((hotspot, index) => {
      // Skip the hotspot being dragged/checked
      if (excludeIndex !== undefined && index === excludeIndex) {
        return false;
      }
      
      // Calculate distance between centers
      const distance = Math.sqrt(
        Math.pow(hotspot.x - x, 2) + Math.pow(hotspot.y - y, 2)
      );
      
      // Minimum distance should be: sum of both radii + buffer
      // This ensures boundaries never touch
      const minDistance = hotspot.radius + currentRadius + 2; // 2% extra buffer
      
      return distance < minDistance;
    });
  };
  
  // ============================================================================
  // HOTSPOT MANAGEMENT
  // ============================================================================
  
  // Add hotspot on image click
  const handleImageClick = (e: React.MouseEvent) => {
    if (!imageRef.current || isDragging || dragOccurredRef.current) return; // Block if drag just happened
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Check for duplicates (don't check against any index since this is a new hotspot)
    if (checkDuplicateHotspot(x, y)) {
      toast.error('A hotspot already exists too close to this location. Please choose a different area.', {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }
    
    const newHotspot: Hotspot = {
      x,
      y,
      radius: DEFAULT_RADIUS,
      label: `Hotspot ${initializedConfig.hotspots.length + 1}`,
      ...(isQuizQuestion ? { points: 10 } : { xp: 10 })
    };
    
    const newConfig = {
      ...initializedConfig,
      hotspots: [...initializedConfig.hotspots, newHotspot]
    };
    
    onChange(newConfig);
    setSelectedHotspotIndex(newConfig.hotspots.length - 1);
  };
  
  // Update hotspot properties
  const updateHotspot = (index: number, updates: Partial<Hotspot>) => {
    // Safety check: ensure index is valid
    if (index < 0 || index >= initializedConfig.hotspots.length) {
      console.warn('updateHotspot: invalid index', index);
      return;
    }
    
    const currentHotspot = initializedConfig.hotspots[index];
    const newHotspot = { ...currentHotspot, ...updates };
    
    // If radius is being updated, check if new radius would cause collision
    if (updates.radius !== undefined) {
      const wouldCollide = checkDuplicateHotspot(
        newHotspot.x, 
        newHotspot.y, 
        index, 
        updates.radius
      );
      
      if (wouldCollide) {
        // Debounce error toast - only show once per second to prevent spam
        const now = Date.now();
        if (now - lastRadiusErrorRef.current > 1000) {
          toast.error('Cannot increase radius — would overlap with another hotspot', {
            duration: 2000,
            position: 'top-center',
          });
          lastRadiusErrorRef.current = now;
        }
        return; // Don't apply the update
      }
    }
    
    const newHotspots = [...initializedConfig.hotspots];
    newHotspots[index] = newHotspot;
    
    onChange({
      ...initializedConfig,
      hotspots: newHotspots
    });
  };
  
  // Delete hotspot
  const deleteHotspot = (index: number) => {
    const newHotspots = initializedConfig.hotspots.filter((_, i) => i !== index);
    
    onChange({
      ...initializedConfig,
      hotspots: newHotspots
    });
    
    setSelectedHotspotIndex(null);
  };
  
  // ============================================================================
  // DRAG TO REPOSITION
  // ============================================================================
  
  const handleHotspotMouseDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setSelectedHotspotIndex(index);
    setIsDragging(true);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || selectedHotspotIndex === null || !imageRef.current) return;
    
    // Mark that drag occurred (synchronous with ref)
    dragOccurredRef.current = true;
    
    // Safety check: ensure selected index is valid
    if (selectedHotspotIndex < 0 || selectedHotspotIndex >= initializedConfig.hotspots.length) {
      setIsDragging(false);
      setSelectedHotspotIndex(null);
      return;
    }
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    
    // Get current hotspot's radius to check collision properly
    const currentRadius = initializedConfig.hotspots[selectedHotspotIndex].radius;
    
    // Check if new position would overlap with OTHER hotspots (excluding current one being dragged)
    if (checkDuplicateHotspot(x, y, selectedHotspotIndex, currentRadius)) {
      return; // Don't move if it would overlap - SILENT during drag
    }
    
    updateHotspot(selectedHotspotIndex, { x, y });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    // Reset after a small delay to let click event check it first
    setTimeout(() => {
      dragOccurredRef.current = false;
    }, 0);
  };
  
  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedHotspotIndex !== null && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        deleteHotspot(selectedHotspotIndex);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedHotspotIndex]);
  
  // ============================================================================
  // IMAGE UPLOAD HANDLERS
  // ============================================================================
  
  const handleImageUpload = (url: string, fileInfo: any) => {
    onChange({
      ...initializedConfig,
      imageUrl: url,
      hotspots: [] // Clear all hotspots when changing image
    });
    setShowImageSelector(false);
    setSelectedHotspotIndex(null); // Clear selection
    
    toast.success('Image changed. Please add hotspots again.', {
      duration: 3000,
      position: 'top-center',
    });
  };
  
  const handleChangeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowImageSelector(true);
  };
  
  // ============================================================================
  // INSTRUCTION & REWARD HANDLERS
  // ============================================================================
  
  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newInstruction = e.target.value;
    setLocalInstruction(newInstruction);
    
    // Debounced update to parent - only call onChange after user stops typing
    // This prevents re-renders on every keystroke
  };
  
  // Update parent with instruction when user finishes typing (onBlur)
  const handleInstructionBlur = () => {
    if (localInstruction !== initializedConfig.instruction) {
      onChange({
        ...initializedConfig,
        instruction: localInstruction
      });
    }
  };
  
  // Handle label change with local state
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingLabel(e.target.value);
  };
  
  // Update parent when label input loses focus
  const handleLabelBlur = (index: number) => {
    if (editingLabel !== initializedConfig.hotspots[index]?.label) {
      updateHotspot(index, { label: editingLabel });
    }
  };
  
  // Handle radius change with local state (for smooth dragging)
  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRadius = parseFloat(e.target.value);
    setLocalRadius(newRadius);
  };
  
  // Update parent when radius slider is released
  const handleRadiusMouseUp = (index: number) => {
    if (localRadius !== initializedConfig.hotspots[index]?.radius) {
      updateHotspot(index, { radius: localRadius });
    }
  };
  
  // ============================================================================
  // CALCULATED VALUES (TypeScript-safe)
  // ============================================================================
  
  const totalReward = (isQuizQuestion ? initializedConfig.totalPoints : initializedConfig.totalXp) ?? 0;


  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div>
      {/* Instruction */}
      <div className="mb-4 relative">
        <label className="block text-sm font-medium mb-1">
          Instruction / Question <span className="text-red-500">*</span>
        </label>
        <textarea
          value={localInstruction}
          onChange={handleInstructionChange}
          onBlur={handleInstructionBlur}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="e.g., Click on all fire safety equipment in this image"
        />
        
        {/* Tips Tooltip */}
        <InfoTooltip title="💡 Hotspot Best Practices">
          <ul className="space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Click</strong> the image to add a hotspot (min. 4% radius recommended)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Drag</strong> hotspots to reposition — they'll snap to valid areas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Overlap prevention</strong>: Hotspots auto-block overlapping (with 2% buffer)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Delete</strong> with ⌦ <code className="bg-gray-100 px-1 rounded">Backspace</code> or <code className="bg-gray-100 px-1 rounded">Delete</code> key</span>
            </li>
          </ul>
        </InfoTooltip>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ===== LEFT PANEL: IMAGE AREA ===== */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Image <span className="text-red-500">*</span>
          </label>
          
          {initializedConfig.imageUrl ? (
            <div 
              className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-crosshair hover:border-blue-400 transition-colors"
              onClick={handleImageClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              ref={imageRef}
            >
              <img 
                src={initializedConfig.imageUrl}
                alt="Hotspot game"
                className="w-full select-none"
                draggable={false}
                onLoad={updateImageDimensions}
              />
              
              {/* Render hotspots */}
              {initializedConfig.hotspots.map((hotspot: Hotspot, index: number) => {
                // Calculate pixel size to maintain circular shape
                const containerWidth = imageRef.current?.getBoundingClientRect().width || 1;
                const containerHeight = imageRef.current?.getBoundingClientRect().height || 1;
                
                // Use the smaller dimension as reference to ensure circle fits
                const referenceSize = Math.min(containerWidth, containerHeight);
                const pixelRadius = (hotspot.radius / 100) * referenceSize;
                
                return (
                  <div
                    key={index}
                    className={`absolute rounded-full border-2 -translate-x-1/2 -translate-y-1/2 transition-all ${
                      selectedHotspotIndex === index 
                        ? 'bg-blue-400/50 border-blue-600 scale-110 shadow-lg' 
                        : 'bg-red-400/40 border-red-600 hover:scale-105'
                    } ${isDragging && selectedHotspotIndex === index ? 'cursor-move' : 'cursor-pointer'}`}
                    style={{
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                      width: `${pixelRadius * 2}px`,
                      height: `${pixelRadius * 2}px`,
                      zIndex: selectedHotspotIndex === index 
                        ? 1000  // Selected hotspot always on top
                        : Math.round(100 - hotspot.radius * 10), // Larger radius = lower z-index (behind)
                    }}
                    onMouseDown={(e) => handleHotspotMouseDown(e, index)}
                    title={hotspot.label}
                  >
                    {/* Hotspot label on hover */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                      {hotspot.label}
                    </div>
                  </div>
                );
              })}
              
              {/* Change Image Button */}
              <div className="absolute top-2 right-2">
                <button
                  onClick={handleChangeImage}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 shadow-md"
                >
                  Change Image
                </button>
              </div>
            </div>
          ) : (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 text-center flex flex-col items-center justify-center"
              style={{ 
                height: '280px'
              }}
            >
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 mb-4">No image selected</p>
              <button
                onClick={() => setShowImageSelector(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Select or Upload Image
              </button>
            </div>
          )}
        </div>
        
        {/* ===== RIGHT PANEL: HOTSPOT PROPERTIES ===== */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Hotspots ({initializedConfig.hotspots.length})
          </label>
          
          {selectedHotspotIndex !== null ? (
            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-blue-900">
                  Hotspot {selectedHotspotIndex + 1}
                </h3>
                <button
                  onClick={() => deleteHotspot(selectedHotspotIndex)}
                  className="px-3 py-1 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
              
              <div className="space-y-3">
                {/* Label */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingLabel}
                    onChange={handleLabelChange}
                    onBlur={() => handleLabelBlur(selectedHotspotIndex)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Fire Extinguisher"
                  />
                </div>
                
                {/* Reward */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {isQuizQuestion ? 'Points' : 'XP'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={
                      isQuizQuestion 
                        ? initializedConfig.hotspots[selectedHotspotIndex].points 
                        : initializedConfig.hotspots[selectedHotspotIndex].xp
                    }
                    onChange={(e) => updateHotspot(selectedHotspotIndex, 
                      isQuizQuestion 
                        ? { points: parseInt(e.target.value) || 0 }
                        : { xp: parseInt(e.target.value) || 0 }
                    )}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Reward for finding this hotspot
                  </p>
                </div>
                
                {/* Size (Radius) */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Hotspot Size
                  </label>
                  <input
                    type="range"
                    min={MIN_RADIUS}
                    max={MAX_RADIUS}
                    step="0.5"
                    value={localRadius}
                    onChange={handleRadiusChange}
                    onMouseUp={() => handleRadiusMouseUp(selectedHotspotIndex)}
                    onTouchEnd={() => handleRadiusMouseUp(selectedHotspotIndex)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Small ({MIN_RADIUS}%)</span>
                    <span className="font-medium">{localRadius.toFixed(1)}%</span>
                    <span>Large ({MAX_RADIUS}%)</span>
                  </div>
                </div>
                
                {/* Position Display */}
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-600">
                    <strong>Position:</strong> ({initializedConfig.hotspots[selectedHotspotIndex].x.toFixed(1)}%, {initializedConfig.hotspots[selectedHotspotIndex].y.toFixed(1)}%)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Drag the hotspot on the image to reposition
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 text-center mb-4">
              <p className="text-gray-500 text-sm">
                {initializedConfig.hotspots.length === 0
                  ? '👆 Click on the image to add your first hotspot'
                  : '👈 Click on a hotspot to edit its properties'}
              </p>
            </div>
          )}
          
          {/* All Hotspots List */}
          <div>
            <h3 className="font-medium mb-2 flex justify-between items-center">
              <span>All Hotspots</span>
              {initializedConfig.hotspots.length > 0 && (
                <span className="text-xs text-gray-500">
                  Total: {totalReward} {isQuizQuestion ? 'pts' : 'XP'}
                </span>
              )}
            </h3>
            
            {initializedConfig.hotspots.length === 0 ? (
              <div className="border rounded-md p-4 bg-gray-50 text-center">
                <p className="text-sm text-gray-500">No hotspots added yet</p>
              </div>
            ) : (
              <ul className="border rounded-md divide-y max-h-64 overflow-y-auto">
                {initializedConfig.hotspots.map((hotspot: Hotspot, index: number) => (
                  <li
                    key={index}
                    className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedHotspotIndex === index ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedHotspotIndex(index)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{hotspot.label}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Position: ({hotspot.x.toFixed(1)}%, {hotspot.y.toFixed(1)}%) • 
                          Size: {hotspot.radius.toFixed(1)}%
                        </p>
                      </div>
                      <span className="text-sm font-medium text-blue-600 ml-2">
                        {isQuizQuestion ? hotspot.points : hotspot.xp} {isQuizQuestion ? 'pts' : 'XP'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      {/* Game Summary */}
      <GameSummary
        title="Game Summary"
        showEmpty={initializedConfig.hotspots.length === 0}
        emptyMessage="⚠️ Add hotspots to calculate rewards and finalize the game."
        items={[
          {
            label: 'Total Hotspots',
            value: initializedConfig.hotspots.length
          },
          {
            label: 'Total Reward',
            value: `${totalReward} ${isQuizQuestion ? 'pts' : 'XP'}`,
            highlight: true
          }
        ]}
      />
      
      {/* Image Selector Modal */}
      {showImageSelector && (
        <MediaSelector
          accept="image/*"
          onSelect={handleImageUpload}
          onClose={() => setShowImageSelector(false)}
        />
      )}
    </div>
  );
}