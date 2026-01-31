// apps/web/components/admin/games/HotspotEditor.tsx
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import MediaSelector from '../MediaSelector';
import InfoTooltip from './ui/InfoTooltip';
import GameSummary from './ui/GameSummary';
import HotspotRichTextEditor from './ui/GameRichTextEditor';

// ============================================================================
// TYPES
// ============================================================================

type Hotspot = {
  id?: string;
  x: number;
  y: number;
  radius: number;
  label: string;
  explanation?: string;
  xp?: number;
  points?: number;
};

type HotspotConfig = {
  instruction: string;
  imageUrl: string;
  hotspots: Hotspot[];
  generalFeedback?: string;
  totalXp?: number;
  totalPoints?: number;
};

type HotspotEditorProps = {
  config: any;
  onChange: (newConfig: HotspotConfig) => void;
  isQuizQuestion: boolean;
  onClose?: () => void;
};

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_RADIUS = 5;
const MIN_RADIUS = 1;
const MAX_RADIUS = 50;
const OVERLAP_BUFFER_PX = 10; // 10px buffer between hotspots (adjustable: 5=tight, 10=moderate, 15=loose)

// ============================================================================
// COMPONENT
// ============================================================================

export default function HotspotEditor({
  config,
  onChange,
  isQuizQuestion,
}: HotspotEditorProps) {
  const [selectedHotspotIndex, setSelectedHotspotIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLDivElement>(null);
  const dragOccurredRef = useRef(false);
  const lastRadiusErrorRef = useRef<number>(0);
  const lastGoodDimensionsRef = useRef({ width: 0, height: 0 });
  
  const initializedConfig: HotspotConfig = useMemo(() => ({
    instruction: config.instruction || 'Click on all the correct areas in the image',
    imageUrl: config.imageUrl || '',
    hotspots: (config.hotspots || []).map((hotspot: Hotspot, idx: number) => ({
      ...hotspot,
      id: hotspot.id || `hotspot-legacy-${idx}`
    })),
    generalFeedback: config.generalFeedback || '',
    ...(isQuizQuestion 
      ? { totalPoints: config.totalPoints || 0 }
      : { totalXp: config.totalXp || 0 }
    )
  }), [config, isQuizQuestion]);
  
  const [localInstruction, setLocalInstruction] = useState(config.instruction || 'Click on all the correct areas in the image');
  const [editingLabel, setEditingLabel] = useState<string>('');
  const [editingExplanation, setEditingExplanation] = useState<string>('');
  const [localRadius, setLocalRadius] = useState<number>(DEFAULT_RADIUS);
  const [localGeneralFeedback, setLocalGeneralFeedback] = useState<string>(config.generalFeedback || '');
  
  useEffect(() => {
    setLocalInstruction(config.instruction || 'Click on all the correct areas in the image');
  }, [config.instruction]);
  
  useEffect(() => {
    setLocalGeneralFeedback(config.generalFeedback || '');
  }, [config.generalFeedback]);
  
  useEffect(() => {
    if (selectedHotspotIndex !== null && initializedConfig.hotspots[selectedHotspotIndex]) {
      setEditingLabel(initializedConfig.hotspots[selectedHotspotIndex].label);
      setEditingExplanation(initializedConfig.hotspots[selectedHotspotIndex].explanation || '');
      setLocalRadius(initializedConfig.hotspots[selectedHotspotIndex].radius);
    } else if (selectedHotspotIndex !== null && !initializedConfig.hotspots[selectedHotspotIndex]) {
      setSelectedHotspotIndex(null);
    }
  }, [selectedHotspotIndex, initializedConfig.hotspots]);
  
  const updateImageDimensions = () => {
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        lastGoodDimensionsRef.current = { width: rect.width, height: rect.height };
        setImageDimensions({ width: rect.width, height: rect.height });
      }
    }
  };
  
  // ✅ CRITICAL FIX: Added hotspots.length dependency
  useEffect(() => {
    const update = () => {
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          lastGoodDimensionsRef.current = { width: rect.width, height: rect.height };
          setImageDimensions({ width: rect.width, height: rect.height });
        }
      }
    };
    
    window.addEventListener('resize', update);
    update();
    
    const attempts = [50, 100, 200, 400, 800, 1500];
    const timers = attempts.map(delay => setTimeout(update, delay));
    
    return () => {
      window.removeEventListener('resize', update);
      timers.forEach(clearTimeout);
    };
  }, [initializedConfig.imageUrl, initializedConfig.hotspots.length]);
  
  // ✅ CRITICAL FIX: Force dimension refresh when hotspots change
  useEffect(() => {
    const timer = setTimeout(() => {
      updateImageDimensions();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [initializedConfig.hotspots.length, JSON.stringify(initializedConfig.hotspots.map(h => ({x: h.x, y: h.y, radius: h.radius})))]);
  
  useEffect(() => {
    const total = initializedConfig.hotspots.reduce((sum, hotspot) => {
      return sum + (isQuizQuestion ? (hotspot.points || 0) : (hotspot.xp || 0));
    }, 0);
    
    const currentTotal = isQuizQuestion ? initializedConfig.totalPoints : initializedConfig.totalXp;
    if (currentTotal !== total) {
      onChange({
        ...initializedConfig,
        ...(isQuizQuestion ? { totalPoints: total } : { totalXp: total })
      });
    }
  }, [
    initializedConfig.hotspots.length,
    JSON.stringify(initializedConfig.hotspots.map(h => isQuizQuestion ? h.points : h.xp)),
    isQuizQuestion
  ]);
  
  const getPlainTextLength = (html: string): number => {
    if (!html) return 0;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || '').trim().length;
  };
  
  const checkDuplicateHotspot = (x: number, y: number, excludeIndex?: number, radius?: number): boolean => {
    if (!imageRef.current) return false;
    
    const currentRadius = radius !== undefined ? radius : DEFAULT_RADIUS;
    const rect = imageRef.current.getBoundingClientRect();
    const containerWidth = rect.width || lastGoodDimensionsRef.current.width || 400;
    const containerHeight = rect.height || lastGoodDimensionsRef.current.height || 300;
    
    // Convert percentage position to pixels
    const xPixel = (x / 100) * containerWidth;
    const yPixel = (y / 100) * containerHeight;
    
    // Use smaller dimension as reference for radius (keeps circles circular)
    const referenceSize = Math.min(containerWidth, containerHeight);
    const currentRadiusPixel = (currentRadius / 100) * referenceSize;
    
    return initializedConfig.hotspots.some((hotspot, index) => {
      if (excludeIndex !== undefined && index === excludeIndex) return false;
      
      // Convert hotspot position to pixels
      const hotspotXPixel = (hotspot.x / 100) * containerWidth;
      const hotspotYPixel = (hotspot.y / 100) * containerHeight;
      const hotspotRadiusPixel = (hotspot.radius / 100) * referenceSize;
      
      // Calculate pixel distance between centers
      const distance = Math.sqrt(
        Math.pow(hotspotXPixel - xPixel, 2) + 
        Math.pow(hotspotYPixel - yPixel, 2)
      );
      
      // Minimum distance: sum of radii + fixed pixel buffer
      const minDistance = hotspotRadiusPixel + currentRadiusPixel + OVERLAP_BUFFER_PX;
      
      return distance < minDistance;
    });
  };
  
  const handleImageClick = (e: React.MouseEvent) => {
    if (!imageRef.current || isDragging || dragOccurredRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    if (checkDuplicateHotspot(x, y)) {
      toast.error('A hotspot already exists too close to this location. Please choose a different area.', {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }
    
    const newHotspot: Hotspot = {
      id: `hotspot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x, y,
      radius: DEFAULT_RADIUS,
      label: `Hotspot ${initializedConfig.hotspots.length + 1}`,
      ...(isQuizQuestion ? { points: 10 } : { xp: 10 })
    };
    
    onChange({
      ...initializedConfig,
      hotspots: [...initializedConfig.hotspots, newHotspot]
    });
    setSelectedHotspotIndex(initializedConfig.hotspots.length);
  };
  
  const updateHotspot = (index: number, updates: Partial<Hotspot>) => {
    if (index < 0 || index >= initializedConfig.hotspots.length) return;
    
    const currentHotspot = initializedConfig.hotspots[index];
    const newHotspot = { ...currentHotspot, ...updates };
    
    if (updates.radius !== undefined) {
      if (checkDuplicateHotspot(newHotspot.x, newHotspot.y, index, updates.radius)) {
        const now = Date.now();
        if (now - lastRadiusErrorRef.current > 1000) {
          toast.error('Cannot increase radius — would overlap with another hotspot', {
            duration: 2000,
            position: 'top-center',
          });
          lastRadiusErrorRef.current = now;
        }
        return;
      }
    }
    
    const newHotspots = [...initializedConfig.hotspots];
    newHotspots[index] = newHotspot;
    
    onChange({
      ...initializedConfig,
      hotspots: newHotspots
    });
  };
  
  const deleteHotspot = (index: number) => {
    onChange({
      ...initializedConfig,
      hotspots: initializedConfig.hotspots.filter((_, i) => i !== index)
    });
    setSelectedHotspotIndex(null);
  };
  
  const handleHotspotMouseDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setSelectedHotspotIndex(index);
    setIsDragging(true);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || selectedHotspotIndex === null || !imageRef.current) return;
    
    dragOccurredRef.current = true;
    
    if (selectedHotspotIndex < 0 || selectedHotspotIndex >= initializedConfig.hotspots.length) {
      setIsDragging(false);
      setSelectedHotspotIndex(null);
      return;
    }
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    
    const currentRadius = initializedConfig.hotspots[selectedHotspotIndex].radius;
    
    if (!checkDuplicateHotspot(x, y, selectedHotspotIndex, currentRadius)) {
      updateHotspot(selectedHotspotIndex, { x, y });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => { dragOccurredRef.current = false; }, 0);
  };
  
  const handleImageUpload = (url: string, fileInfo: any) => {
    onChange({
      ...initializedConfig,
      imageUrl: url,
      hotspots: []
    });
    setShowImageSelector(false);
    setSelectedHotspotIndex(null);
    toast.success('Image changed. Please add hotspots again.', { duration: 3000, position: 'top-center' });
  };
  
  const totalReward = (isQuizQuestion ? initializedConfig.totalPoints : initializedConfig.totalXp) ?? 0;

  return (
    <div>
      <div className="mb-5 relative">
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Instruction / Question <span className="text-danger">*</span>
        </label>
        <textarea
          value={localInstruction}
          onChange={(e) => setLocalInstruction(e.target.value)}
          onBlur={() => {
            if (localInstruction !== initializedConfig.instruction) {
              onChange({ ...initializedConfig, instruction: localInstruction });
            }
          }}
          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary"
          rows={2}
          placeholder="e.g., Click on all fire safety equipment in this image"
        />
        
        <InfoTooltip title="💡 Hotspot Best Practices">
          <ul className="space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <span><strong>Click</strong> the image to add a hotspot (min. 4% radius recommended)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <span><strong>Drag</strong> hotspots to reposition — they'll snap to valid areas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <span><strong>Overlap prevention</strong>: Hotspots maintain {OVERLAP_BUFFER_PX}px buffer</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <span><strong>Delete</strong> by clicking the Delete button in the hotspot properties panel</span>
            </li>
          </ul>
        </InfoTooltip>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Image <span className="text-danger">*</span>
          </label>
          
          {initializedConfig.imageUrl ? (
            <div 
              className="relative border-2 border-dashed border-border rounded-lg overflow-hidden cursor-crosshair hover:border-primary-light transition-colors"
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
              
              {imageDimensions.width === 0 && imageDimensions.height === 0 && (
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                  <div className="text-white text-sm">Loading image...</div>
                </div>
              )}
              
              {/* ✅ RESTORED: Original blue/red colors with opacity */}
              {initializedConfig.hotspots.map((hotspot: Hotspot, index: number) => {
                const containerWidth = lastGoodDimensionsRef.current.width || imageDimensions.width || 400;
                const containerHeight = lastGoodDimensionsRef.current.height || imageDimensions.height || 300;
                
                const referenceSize = Math.min(containerWidth, containerHeight);
                const pixelRadius = (hotspot.radius / 100) * referenceSize;
                const finalRadius = Math.max(4, pixelRadius); // ✅ Minimum 4px
                
                return (
                  <div
                    key={hotspot.id || `hotspot-${index}`}
                    className={`absolute rounded-full border-2 -translate-x-1/2 -translate-y-1/2 transition-all ${
                      selectedHotspotIndex === index 
                        ? 'bg-blue-400/50 border-blue-600 scale-110 shadow-lg' 
                        : 'bg-red-400/40 border-red-600 hover:scale-105'
                    } ${isDragging && selectedHotspotIndex === index ? 'cursor-move' : 'cursor-pointer'}`}
                    style={{
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                      width: `${finalRadius * 2}px`,
                      height: `${finalRadius * 2}px`,
                      // ✅ FIXED: Always positive zIndex
                      zIndex: selectedHotspotIndex === index 
                        ? 1000 
                        : (initializedConfig.hotspots.length - index),
                    }}
                    onMouseDown={(e) => handleHotspotMouseDown(e, index)}
                    title={hotspot.label}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                      {hotspot.label}
                    </div>
                  </div>
                );
              })}
              
              <div className="absolute top-2 right-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowImageSelector(true); }}
                  className="btn btn-primary text-xs px-3 py-1"
                >
                  Change Image
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-8 bg-surface text-center flex flex-col items-center justify-center" style={{ height: '280px' }}>
              <svg className="mx-auto h-12 w-12 text-text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-text-secondary mb-4">No image selected</p>
              <button onClick={() => setShowImageSelector(true)} className="btn btn-primary">
                Select or Upload Image
              </button>
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Hotspots ({initializedConfig.hotspots.length})
          </label>
          
          {selectedHotspotIndex !== null && initializedConfig.hotspots[selectedHotspotIndex] ? (
            <div className="border-2 border-primary-light rounded-lg p-4 bg-primary-surface mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-primary-dark">Hotspot {selectedHotspotIndex + 1}</h3>
                <button onClick={() => deleteHotspot(selectedHotspotIndex)} className="btn btn-danger text-sm px-3 py-1">
                  Delete
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Label <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    value={editingLabel}
                    onChange={(e) => setEditingLabel(e.target.value)}
                    onBlur={() => { if (editingLabel !== initializedConfig.hotspots[selectedHotspotIndex]?.label) updateHotspot(selectedHotspotIndex, { label: editingLabel }); }}
                    className="w-full"
                    placeholder="e.g., Fire Extinguisher"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">{isQuizQuestion ? 'Points' : 'XP'} <span className="text-danger">*</span></label>
                  <input
                    type="number" min="1"
                    value={isQuizQuestion ? initializedConfig.hotspots[selectedHotspotIndex].points : initializedConfig.hotspots[selectedHotspotIndex].xp}
                    onChange={(e) => updateHotspot(selectedHotspotIndex, isQuizQuestion ? { points: parseInt(e.target.value) || 0 } : { xp: parseInt(e.target.value) || 0 })}
                    className="w-full"
                  />
                  <p className="text-xs text-text-muted mt-1.5">Reward for finding this hotspot</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Hotspot Size</label>
                  <input
                    type="range" min={MIN_RADIUS} max={MAX_RADIUS} step="0.5"
                    value={localRadius}
                    onChange={(e) => setLocalRadius(parseFloat(e.target.value))}
                    onMouseUp={() => { if (localRadius !== initializedConfig.hotspots[selectedHotspotIndex]?.radius) updateHotspot(selectedHotspotIndex, { radius: localRadius }); }}
                    onTouchEnd={() => { if (localRadius !== initializedConfig.hotspots[selectedHotspotIndex]?.radius) updateHotspot(selectedHotspotIndex, { radius: localRadius }); }}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-text-muted mt-1.5">
                    <span>Small ({MIN_RADIUS}%)</span>
                    <span className="font-medium">{localRadius.toFixed(1)}%</span>
                    <span>Large ({MAX_RADIUS}%)</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="block text-sm font-medium text-text-secondary">Explanation (Optional)</label>
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-surface text-text-muted text-xs cursor-help" title="Help learners understand why this hotspot is important. Shown after submission.">?</span>
                  </div>
                  <HotspotRichTextEditor
                    key={`hotspot-explanation-${selectedHotspotIndex}`}
                    content={editingExplanation}
                    onChange={(content: string) => {
                      setEditingExplanation(content);
                      if (selectedHotspotIndex !== null) updateHotspot(selectedHotspotIndex, { explanation: content });
                    }}
                    height={120}
                    placeholder="Explain why this hotspot is important..."
                  />
                  <div className="flex justify-end mt-1">
                    <span className={
                      getPlainTextLength(editingExplanation) > 300
                        ? 'text-danger font-medium text-xs'
                        : getPlainTextLength(editingExplanation) > 240
                        ? 'text-warning-dark text-xs'
                        : 'text-text-muted text-xs'
                    }>
                      {getPlainTextLength(editingExplanation)}/300 characters
                    </span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-text-secondary"><strong>Position:</strong> ({initializedConfig.hotspots[selectedHotspotIndex].x.toFixed(1)}%, {initializedConfig.hotspots[selectedHotspotIndex].y.toFixed(1)}%)</p>
                  <p className="text-xs text-text-muted mt-1">Drag the hotspot on the image to reposition</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-6 bg-surface text-center mb-4">
              <p className="text-text-secondary text-sm">{initializedConfig.hotspots.length === 0 ? '👆 Click on the image to add your first hotspot' : '👈 Click on a hotspot to edit its properties'}</p>
            </div>
          )}
          
          <div>
            <h3 className="font-medium text-text-primary mb-2 flex justify-between items-center">
              <span>All Hotspots</span>
              {initializedConfig.hotspots.length > 0 && <span className="text-xs text-text-muted">Total: {totalReward} {isQuizQuestion ? 'pts' : 'XP'}</span>}
            </h3>
            
            {initializedConfig.hotspots.length === 0 ? (
              <div className="border border-border rounded-lg p-4 bg-surface text-center">
                <p className="text-sm text-text-secondary">No hotspots added yet</p>
              </div>
            ) : (
              <ul className="border border-border rounded-lg divide-y divide-border max-h-64 overflow-y-auto">
                {initializedConfig.hotspots.map((hotspot: Hotspot, index: number) => (
                  <li 
                    key={index} 
                    className={`p-3 cursor-pointer hover:bg-surface transition-colors ${
                      selectedHotspotIndex === index 
                        ? 'bg-primary-surface border-l-4 border-primary' 
                        : ''
                    }`} 
                    onClick={() => setSelectedHotspotIndex(index)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-text-primary">{hotspot.label}</p>
                        <p className="text-xs text-text-muted mt-1">
                          Position: ({hotspot.x.toFixed(1)}%, {hotspot.y.toFixed(1)}%) • 
                          Size: {hotspot.radius.toFixed(1)}%
                        </p>
                      </div>
                      <span className="text-sm font-medium text-primary ml-2">
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
      
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm font-medium text-text-secondary">General Feedback (Optional)</label>
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-surface text-text-muted text-xs cursor-help" title="This feedback will be shown to learners after they submit, regardless of their score. Use it to provide context, hints, or learning points.">?</span>
        </div>
        <HotspotRichTextEditor
          key="general-feedback-editor"
          content={localGeneralFeedback}
          onChange={(content: string) => {
            setLocalGeneralFeedback(content);
            // Save to parent config
            onChange({ ...initializedConfig, generalFeedback: content });
          }}
          height={150}
          placeholder="Provide context or hints about what learners should look for..."
        />
        <div className="flex justify-between items-center mt-1 text-xs">
          <span className="text-text-muted">Provide context or hints about what learners should look for</span>
          <span className={
            getPlainTextLength(localGeneralFeedback) > 500
              ? 'text-danger font-medium'
              : getPlainTextLength(localGeneralFeedback) > 400
              ? 'text-warning-dark'
              : 'text-text-muted'
          }>
            {getPlainTextLength(localGeneralFeedback)}/500 characters
          </span>
        </div>
      </div>
      
      <GameSummary
        title="Game Summary"
        showEmpty={initializedConfig.hotspots.length === 0}
        emptyMessage="⚠️ Add hotspots to calculate rewards and finalize the game."
        items={[
          { label: 'Total Hotspots', value: initializedConfig.hotspots.length },
          { label: 'Total Reward', value: `${totalReward} ${isQuizQuestion ? 'pts' : 'XP'}`, highlight: true }
        ]}
      />
      
      {showImageSelector && <MediaSelector accept="image/*" onSelect={handleImageUpload} onClose={() => setShowImageSelector(false)} />}
    </div>
  );
}