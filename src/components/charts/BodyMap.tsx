'use client';

import { useState } from 'react';
import { cn } from '@/utils/cn';

interface BodyRegionData {
  region: string;
  count: number;
}

interface BodyMapProps {
  data: BodyRegionData[];
  onRegionClick?: (region: string) => void;
  selectedRegion?: string | null;
  compact?: boolean;
  className?: string;
}

// Map body region names to SVG region ids
const REGION_MAP: Record<string, string[]> = {
  // Front regions
  head: ['Head', 'Face', 'Jaw'],
  neck: ['Neck', 'Cervical'],
  'shoulder-l': ['Shoulder', 'Left Shoulder'],
  'shoulder-r': ['Shoulder', 'Right Shoulder'],
  chest: ['Chest', 'Thorax', 'Ribs'],
  'upper-arm-l': ['Upper Arm', 'Bicep', 'Left Upper Arm'],
  'upper-arm-r': ['Upper Arm', 'Bicep', 'Right Upper Arm'],
  abdomen: ['Abdomen', 'Core', 'Abdominal'],
  hip: ['Hip', 'Pelvis', 'Groin'],
  'forearm-l': ['Forearm', 'Elbow', 'Left Forearm', 'Left Elbow'],
  'forearm-r': ['Forearm', 'Elbow', 'Right Forearm', 'Right Elbow'],
  'hand-l': ['Hand', 'Wrist', 'Left Hand', 'Left Wrist', 'Finger'],
  'hand-r': ['Hand', 'Wrist', 'Right Hand', 'Right Wrist', 'Finger'],
  'thigh-l': ['Thigh', 'Quadriceps', 'Left Thigh', 'Left Quadriceps'],
  'thigh-r': ['Thigh', 'Quadriceps', 'Right Thigh', 'Right Quadriceps'],
  'knee-l': ['Knee', 'Left Knee'],
  'knee-r': ['Knee', 'Right Knee'],
  'lower-leg-l': ['Shin', 'Lower Leg', 'Left Shin'],
  'lower-leg-r': ['Shin', 'Lower Leg', 'Right Shin'],
  'ankle-l': ['Ankle', 'Left Ankle'],
  'ankle-r': ['Ankle', 'Right Ankle'],
  'foot-l': ['Foot', 'Left Foot', 'Toe'],
  'foot-r': ['Foot', 'Right Foot', 'Toe'],
  // Back regions
  'back-head': ['Head', 'Face', 'Jaw'],
  'back-neck': ['Neck', 'Cervical'],
  'back-shoulder-l': ['Shoulder', 'Left Shoulder'],
  'back-shoulder-r': ['Shoulder', 'Right Shoulder'],
  'upper-back': ['Upper Back', 'Thoracic', 'Spine'],
  'lower-back': ['Lower Back', 'Lumbar', 'Back', 'Spine'],
  'back-upper-arm-l': ['Upper Arm', 'Tricep', 'Left Upper Arm'],
  'back-upper-arm-r': ['Upper Arm', 'Tricep', 'Right Upper Arm'],
  glutes: ['Glutes', 'Buttock', 'Hip', 'Pelvis'],
  'back-forearm-l': ['Forearm', 'Elbow', 'Left Forearm', 'Left Elbow'],
  'back-forearm-r': ['Forearm', 'Elbow', 'Right Forearm', 'Right Elbow'],
  'back-hand-l': ['Hand', 'Wrist', 'Left Hand', 'Left Wrist', 'Finger'],
  'back-hand-r': ['Hand', 'Wrist', 'Right Hand', 'Right Wrist', 'Finger'],
  'back-thigh-l': ['Thigh', 'Hamstring', 'Left Thigh', 'Left Hamstring'],
  'back-thigh-r': ['Thigh', 'Hamstring', 'Right Thigh', 'Right Hamstring'],
  'back-knee-l': ['Knee', 'Left Knee'],
  'back-knee-r': ['Knee', 'Right Knee'],
  'back-calf-l': ['Calf', 'Lower Leg', 'Left Calf'],
  'back-calf-r': ['Calf', 'Lower Leg', 'Right Calf'],
  'back-ankle-l': ['Ankle', 'Left Ankle'],
  'back-ankle-r': ['Ankle', 'Right Ankle'],
  'back-foot-l': ['Foot', 'Left Foot', 'Heel'],
  'back-foot-r': ['Foot', 'Right Foot', 'Heel'],
};

function getRegionCount(regionId: string, data: BodyRegionData[]): number {
  const mappings = REGION_MAP[regionId] || [];
  let total = 0;
  for (const d of data) {
    const lower = d.region.toLowerCase();
    for (const m of mappings) {
      if (lower.includes(m.toLowerCase())) {
        total += d.count;
        break;
      }
    }
  }
  return total;
}

function getHeatColor(count: number, maxCount: number): string {
  if (count === 0 || maxCount === 0) return 'rgba(0,0,0,0.03)';
  const intensity = Math.min(count / maxCount, 1);
  if (intensity < 0.33) {
    return `rgba(34, 197, 94, ${0.15 + intensity * 0.5})`;
  }
  if (intensity < 0.66) {
    return `rgba(245, 158, 11, ${0.2 + intensity * 0.5})`;
  }
  return `rgba(239, 68, 68, ${0.3 + intensity * 0.5})`;
}

// Get a friendly display label for a region id
function getRegionLabel(regionId: string): string {
  // Strip "back-" prefix for display and capitalize
  const clean = regionId.replace(/^back-/, '');
  const labels: Record<string, string> = {
    head: 'Head',
    neck: 'Neck',
    'shoulder-l': 'Shoulder',
    'shoulder-r': 'Shoulder',
    chest: 'Chest',
    'upper-arm-l': 'Upper Arm',
    'upper-arm-r': 'Upper Arm',
    abdomen: 'Abdomen',
    'upper-back': 'Upper Back',
    'lower-back': 'Lower Back',
    hip: 'Hip',
    glutes: 'Glutes',
    'forearm-l': 'Forearm',
    'forearm-r': 'Forearm',
    'hand-l': 'Hand',
    'hand-r': 'Hand',
    'thigh-l': 'Thigh',
    'thigh-r': 'Thigh',
    'knee-l': 'Knee',
    'knee-r': 'Knee',
    'lower-leg-l': 'Shin',
    'lower-leg-r': 'Shin',
    'calf-l': 'Calf',
    'calf-r': 'Calf',
    'ankle-l': 'Ankle',
    'ankle-r': 'Ankle',
    'foot-l': 'Foot',
    'foot-r': 'Foot',
  };
  return labels[clean] || REGION_MAP[regionId]?.[0] || regionId;
}

interface BodyPartProps {
  id: string;
  d: string;
  data: BodyRegionData[];
  maxCount: number;
  selectedRegion?: string | null;
  onRegionClick?: (region: string) => void;
  hovered: string | null;
  setHovered: (id: string | null) => void;
  compact?: boolean;
}

function BodyPart({ id, d, data, maxCount, selectedRegion, onRegionClick, hovered, setHovered, compact }: BodyPartProps) {
  const count = getRegionCount(id, data);
  const fill = getHeatColor(count, maxCount);
  const isSelected = selectedRegion === id;
  const isHovered = hovered === id;

  return (
    <path
      d={d}
      fill={fill}
      stroke={isSelected ? '#000' : isHovered && count > 0 ? '#666' : '#d1d5db'}
      strokeWidth={isSelected ? 2 : isHovered ? 1.5 : 0.75}
      className={cn(count > 0 && 'cursor-pointer', !compact && 'transition-all duration-150')}
      onClick={() => count > 0 && onRegionClick?.(id)}
      onMouseEnter={() => setHovered(id)}
      onMouseLeave={() => setHovered(null)}
    />
  );
}

// Front view body parts
const FRONT_PARTS: { id: string; d: string }[] = [
  { id: 'head', d: 'M85,8 C85,8 78,5 75,12 C72,19 72,28 75,33 C78,38 82,40 85,40 C88,40 92,38 95,33 C98,28 98,19 95,12 C92,5 85,8 85,8 Z' },
  { id: 'neck', d: 'M80,40 L80,48 L90,48 L90,40 Z' },
  { id: 'chest', d: 'M62,52 C62,52 65,48 85,48 C105,48 108,52 108,52 L108,75 L62,75 Z' },
  { id: 'shoulder-l', d: 'M55,48 C55,48 58,46 62,48 L62,60 C58,58 52,56 50,52 C48,48 55,48 55,48 Z' },
  { id: 'shoulder-r', d: 'M115,48 C115,48 112,46 108,48 L108,60 C112,58 118,56 120,52 C122,48 115,48 115,48 Z' },
  { id: 'upper-arm-l', d: 'M50,52 C48,56 46,65 45,72 C44,78 44,85 45,88 L55,88 L55,60 C53,58 51,55 50,52 Z' },
  { id: 'upper-arm-r', d: 'M120,52 C122,56 124,65 125,72 C126,78 126,85 125,88 L115,88 L115,60 C117,58 119,55 120,52 Z' },
  { id: 'abdomen', d: 'M62,75 L108,75 L108,100 L62,100 Z' },
  { id: 'hip', d: 'M60,100 L110,100 L108,115 C100,118 85,118 85,118 C85,118 70,118 62,115 Z' },
  { id: 'forearm-l', d: 'M45,88 C43,95 40,105 38,115 L48,118 L55,88 Z' },
  { id: 'forearm-r', d: 'M125,88 C127,95 130,105 132,115 L122,118 L115,88 Z' },
  { id: 'hand-l', d: 'M35,115 C33,120 31,128 30,132 C29,136 32,138 35,136 C36,135 38,130 38,130 L42,132 C41,136 40,138 42,139 C44,139 45,136 46,132 L48,118 Z' },
  { id: 'hand-r', d: 'M135,115 C137,120 139,128 140,132 C141,136 138,138 135,136 C134,135 132,130 132,130 L128,132 C129,136 130,138 128,139 C126,139 125,136 124,132 L122,118 Z' },
  { id: 'thigh-l', d: 'M62,115 C65,118 70,120 77,118 L77,155 C76,160 73,163 72,165 L60,165 C59,162 58,155 60,145 Z' },
  { id: 'thigh-r', d: 'M108,115 C105,118 100,120 93,118 L93,155 C94,160 97,163 98,165 L110,165 C111,162 112,155 110,145 Z' },
  { id: 'knee-l', d: 'M60,165 L72,165 L73,178 L59,178 Z' },
  { id: 'knee-r', d: 'M110,165 L98,165 L97,178 L111,178 Z' },
  { id: 'lower-leg-l', d: 'M59,178 L73,178 C74,190 73,205 72,215 L60,215 C59,205 58,190 59,178 Z' },
  { id: 'lower-leg-r', d: 'M111,178 L97,178 C96,190 97,205 98,215 L110,215 C111,205 112,190 111,178 Z' },
  { id: 'ankle-l', d: 'M60,215 L72,215 L74,225 C72,228 65,230 58,228 C55,226 57,220 60,215 Z' },
  { id: 'ankle-r', d: 'M110,215 L98,215 L96,225 C98,228 105,230 112,228 C115,226 113,220 110,215 Z' },
];

// Back view body parts (mirrored — left/right flipped since you're looking at the back)
const BACK_PARTS: { id: string; d: string }[] = [
  { id: 'back-head', d: 'M85,8 C85,8 78,5 75,12 C72,19 72,28 75,33 C78,38 82,40 85,40 C88,40 92,38 95,33 C98,28 98,19 95,12 C92,5 85,8 85,8 Z' },
  { id: 'back-neck', d: 'M80,40 L80,48 L90,48 L90,40 Z' },
  // Upper back (trapezius / thoracic region)
  { id: 'upper-back', d: 'M62,52 C62,52 65,48 85,48 C105,48 108,52 108,52 L108,75 L62,75 Z' },
  { id: 'back-shoulder-l', d: 'M115,48 C115,48 112,46 108,48 L108,60 C112,58 118,56 120,52 C122,48 115,48 115,48 Z' },
  { id: 'back-shoulder-r', d: 'M55,48 C55,48 58,46 62,48 L62,60 C58,58 52,56 50,52 C48,48 55,48 55,48 Z' },
  { id: 'back-upper-arm-l', d: 'M120,52 C122,56 124,65 125,72 C126,78 126,85 125,88 L115,88 L115,60 C117,58 119,55 120,52 Z' },
  { id: 'back-upper-arm-r', d: 'M50,52 C48,56 46,65 45,72 C44,78 44,85 45,88 L55,88 L55,60 C53,58 51,55 50,52 Z' },
  // Lower back (lumbar region)
  { id: 'lower-back', d: 'M62,75 L108,75 L108,100 L62,100 Z' },
  // Glutes
  { id: 'glutes', d: 'M60,100 L110,100 L108,115 C100,118 85,118 85,118 C85,118 70,118 62,115 Z' },
  { id: 'back-forearm-l', d: 'M125,88 C127,95 130,105 132,115 L122,118 L115,88 Z' },
  { id: 'back-forearm-r', d: 'M45,88 C43,95 40,105 38,115 L48,118 L55,88 Z' },
  { id: 'back-hand-l', d: 'M135,115 C137,120 139,128 140,132 C141,136 138,138 135,136 C134,135 132,130 132,130 L128,132 C129,136 130,138 128,139 C126,139 125,136 124,132 L122,118 Z' },
  { id: 'back-hand-r', d: 'M35,115 C33,120 31,128 30,132 C29,136 32,138 35,136 C36,135 38,130 38,130 L42,132 C41,136 40,138 42,139 C44,139 45,136 46,132 L48,118 Z' },
  { id: 'back-thigh-l', d: 'M108,115 C105,118 100,120 93,118 L93,155 C94,160 97,163 98,165 L110,165 C111,162 112,155 110,145 Z' },
  { id: 'back-thigh-r', d: 'M62,115 C65,118 70,120 77,118 L77,155 C76,160 73,163 72,165 L60,165 C59,162 58,155 60,145 Z' },
  { id: 'back-knee-l', d: 'M110,165 L98,165 L97,178 L111,178 Z' },
  { id: 'back-knee-r', d: 'M60,165 L72,165 L73,178 L59,178 Z' },
  { id: 'back-calf-l', d: 'M111,178 L97,178 C96,190 97,205 98,215 L110,215 C111,205 112,190 111,178 Z' },
  { id: 'back-calf-r', d: 'M59,178 L73,178 C74,190 73,205 72,215 L60,215 C59,205 58,190 59,178 Z' },
  { id: 'back-ankle-l', d: 'M110,215 L98,215 L96,225 C98,228 105,230 112,228 C115,226 113,220 110,215 Z' },
  { id: 'back-ankle-r', d: 'M60,215 L72,215 L74,225 C72,228 65,230 58,228 C55,226 57,220 60,215 Z' },
];

export function BodyMap({ data, onRegionClick, selectedRegion, compact, className }: BodyMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const hoveredCount = hovered ? getRegionCount(hovered, data) : 0;
  const hoveredLabel = hovered ? getRegionLabel(hovered) : null;

  const svgWidth = compact ? 80 : 130;
  const svgHeight = compact ? 120 : 200;

  const renderBody = (parts: { id: string; d: string }[], label: string) => (
    <div className="flex flex-col items-center">
      <svg
        viewBox="25 0 120 235"
        width={svgWidth}
        height={svgHeight}
        className="select-none"
        aria-label={`Body injury map — ${label}`}
      >
        {parts.map((part) => (
          <BodyPart
            key={part.id}
            id={part.id}
            d={part.d}
            data={data}
            maxCount={maxCount}
            selectedRegion={selectedRegion}
            onRegionClick={onRegionClick}
            hovered={hovered}
            setHovered={setHovered}
            compact={compact}
          />
        ))}
      </svg>
      {!compact && (
        <span className="mt-1 text-[10px] font-medium tracking-wide text-gray-400 uppercase">
          {label}
        </span>
      )}
    </div>
  );

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      {/* Tooltip */}
      {!compact && hovered && hoveredCount > 0 && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full rounded-md bg-black px-2.5 py-1.5 text-xs text-white shadow-lg whitespace-nowrap pointer-events-none z-10">
          <span className="font-medium">{hoveredLabel}</span>
          <span className="ml-1.5 text-white/70">
            {hoveredCount} {hoveredCount === 1 ? 'injury' : 'injuries'}
          </span>
        </div>
      )}

      {/* Front + Back side by side */}
      <div className={cn('flex items-start', compact ? 'gap-2' : 'gap-4')}>
        {renderBody(FRONT_PARTS, 'Front')}
        {renderBody(BACK_PARTS, 'Back')}
      </div>

      {/* Legend */}
      {!compact && (
        <div className="mt-3 flex items-center gap-3 text-[10px] text-gray-500">
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ background: 'rgba(34,197,94,0.3)' }} />
            Low
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ background: 'rgba(245,158,11,0.5)' }} />
            Med
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ background: 'rgba(239,68,68,0.7)' }} />
            High
          </div>
        </div>
      )}
    </div>
  );
}
