// apps/web/components/admin/games/HotspotEditor.tsx
'use client';

import { useState, useRef } from 'react';
import MediaUploader from '../MediaUploader';

type Hotspot = {
  x: number;
  y: number;
  radius: number;
  label: string;
  xp?: number;
  points?: number;
};

type HotspotEditorProps = {
  config: any;
  onChange: (newConfig: any) => void;
  isQuizQuestion: boolean;
};

export default function HotspotEditor({
  config,
  onChange,
  isQuizQuestion
}: HotspotEditorProps) {
  const [selectedHotspotIndex, setSelectedHotspotIndex] = useState<number | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  
  // Initialize config if empty
  const initializedConfig = {
    instruction: config.instruction || 'Click on the correct areas in the image',
    imageUrl: config.imageUrl || '',
    hotspots: config.hotspots || [],
    ...(isQuizQuestion 
      ? { points: config.points || 10 }
      : { xp: config.xp || 10 }
    )
  };
  
  // Add hotspot on image click
  const handleImageClick = (e: React.MouseEvent) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newHotspot: Hotspot = {
      x,
      y,
      radius: 5,
      label: `Hotspot ${initializedConfig.hotspots.length + 1}`,
      ...(isQuizQuestion ? { points: 5 } : { xp: 5 })
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
    const newHotspots = [...initializedConfig.hotspots];
    newHotspots[index] = { ...newHotspots[index], ...updates };
    
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
  
  // Handle image upload
  const handleImageUpload = (url: string) => {
    onChange({
      ...initializedConfig,
      imageUrl: url
    });
  };
  
  // Update instruction
  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...initializedConfig,
      instruction: e.target.value
    });
  };
  
  // Update points or XP
  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    onChange({
      ...initializedConfig,
      ...(isQuizQuestion ? { points: value } : { xp: value })
    });
  };

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Instruction / Question
        </label>
        <textarea
          value={initializedConfig.instruction}
          onChange={handleInstructionChange}
          className="w-full px-3 py-2 border rounded-md"
          rows={2}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image Area */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Image
          </label>
          
          {initializedConfig.imageUrl ? (
            <div 
              className="relative border rounded-md overflow-hidden cursor-crosshair"
              onClick={handleImageClick}
              ref={imageRef}
            >
              <img 
                src={initializedConfig.imageUrl}
                alt="Hotspot game"
                className="w-full"
              />
              
              {/* Render hotspots */}
              {initializedConfig.hotspots.map((hotspot: Hotspot, index: number) => (
                <div
                  key={index}
                  className={`absolute w-4 h-4 rounded-full border-2 -translate-x-1/2 -translate-y-1/2 cursor-pointer ${
                    selectedHotspotIndex === index ? 'bg-blue-400 border-blue-600' : 'bg-red-400 border-red-600'
                  }`}
                  style={{
                    left: `${hotspot.x}%`,
                    top: `${hotspot.y}%`,
                    width: `${hotspot.radius * 2}px`,
                    height: `${hotspot.radius * 2}px`
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedHotspotIndex(index);
                  }}
                ></div>
              ))}
              
              <div className="absolute top-2 right-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Replace image
                  }}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                >
                  Change Image
                </button>
              </div>
            </div>
          ) : (
            <div className="border rounded-md p-8 bg-gray-50 text-center">
              <p className="text-gray-500 mb-4">No image selected</p>
              <MediaUploader
                onUploadComplete={handleImageUpload}
                accept="image/*"
                buttonText="Upload Image"
              />
            </div>
          )}
          
          <p className="text-sm text-gray-600 mt-2">
            Click on the image to add hotspots
          </p>
        </div>
        
        {/* Hotspot Properties */}
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {isQuizQuestion ? 'Points' : 'XP'} for this game
            </label>
            <input
              type="number"
              min="0"
              value={isQuizQuestion ? initializedConfig.points : initializedConfig.xp}
              onChange={handlePointsChange}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <label className="block text-sm font-medium mb-1">
            Hotspots ({initializedConfig.hotspots.length})
          </label>
          
          {selectedHotspotIndex !== null ? (
            <div className="border rounded-md p-4 bg-gray-50">
              <h3 className="font-medium mb-2">
                Hotspot {selectedHotspotIndex + 1} Properties
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Label</label>
                  <input
                    type="text"
                    value={initializedConfig.hotspots[selectedHotspotIndex].label}
                    onChange={(e) => updateHotspot(selectedHotspotIndex, { label: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-1">Size (Radius)</label>
                  <input
                    type="range"
                    min="3"
                    max="20"
                    value={initializedConfig.hotspots[selectedHotspotIndex].radius}
                    onChange={(e) => updateHotspot(selectedHotspotIndex, { radius: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Small</span>
                    <span>Large</span>
                  </div>
                </div>
                
                <div className="pt-2">
                  <button
                    onClick={() => deleteHotspot(selectedHotspotIndex)}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    Delete Hotspot
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border rounded-md p-4 bg-gray-50">
              <p className="text-gray-500 text-sm">
                {initializedConfig.hotspots.length === 0
                  ? 'No hotspots added yet. Click on the image to add hotspots.'
                  : 'Click on a hotspot to edit its properties.'}
              </p>
            </div>
          )}
          
          <div className="mt-4">
            <h3 className="font-medium mb-2">All Hotspots</h3>
            {initializedConfig.hotspots.length === 0 ? (
              <p className="text-sm text-gray-500">No hotspots added yet</p>
            ) : (
              <ul className="border rounded-md divide-y overflow-hidden">
                {initializedConfig.hotspots.map((hotspot: Hotspot, index: number) => (
                  <li
                    key={index}
                    className={`p-2 cursor-pointer hover:bg-gray-50 ${
                      selectedHotspotIndex === index ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedHotspotIndex(index)}
                  >
                    <div className="flex justify-between">
                      <span>{hotspot.label}</span>
                      <span className="text-gray-500 text-sm">
                        ({hotspot.x.toFixed(1)}%, {hotspot.y.toFixed(1)}%)
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}