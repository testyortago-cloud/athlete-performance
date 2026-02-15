'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { cn } from '@/utils/cn';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

interface TourStep {
  target: string; // data-tour attribute value
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'welcome-banner',
    title: 'Welcome Banner',
    description: 'Your daily overview with quick-action buttons to log load, create sessions, or record injuries.',
    position: 'bottom',
  },
  {
    target: 'kpi-row',
    title: 'KPI Cards',
    description: 'Key performance indicators at a glance — active athletes, injuries, average load, and sessions this month.',
    position: 'bottom',
  },
  {
    target: 'charts-grid',
    title: 'Analytics Charts',
    description: 'Visual breakdowns of injuries, training load trends, and athlete risk levels. Click bars to cross-filter.',
    position: 'top',
  },
  {
    target: 'alerts-panel',
    title: 'Risk Alerts',
    description: 'Real-time alerts when athletes enter high-risk zones based on ACWR thresholds you configure.',
    position: 'top',
  },
  {
    target: 'sidebar-nav',
    title: 'Navigation',
    description: 'Access all modules — Athletes, Testing, Load Monitoring, Injuries, Programs, and more.',
    position: 'right',
  },
  {
    target: 'header-search',
    title: 'Quick Search',
    description: 'Press Ctrl+K to open the command palette and jump to any page or athlete instantly.',
    position: 'bottom',
  },
  {
    target: 'user-menu',
    title: 'Your Profile',
    description: 'Click your avatar to access your profile, where you can update your name and change your password.',
    position: 'bottom',
  },
];

export function OnboardingTour() {
  const { completed, setCompleted } = useOnboardingStore();
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);

  const currentStep = TOUR_STEPS[step];

  const findTarget = useCallback(() => {
    if (!currentStep) return null;
    return document.querySelector(`[data-tour="${currentStep.target}"]`);
  }, [currentStep]);

  const updatePosition = useCallback(() => {
    const el = findTarget();
    if (el) {
      setRect(el.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, [findTarget]);

  useEffect(() => {
    if (completed) return;
    // Delay showing to let dashboard render
    const timer = setTimeout(() => {
      setVisible(true);
      updatePosition();
    }, 800);
    return () => clearTimeout(timer);
  }, [completed, updatePosition]);

  useEffect(() => {
    if (!visible) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [visible, step, updatePosition]);

  function handleNext() {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  }

  function handlePrev() {
    if (step > 0) setStep(step - 1);
  }

  function handleFinish() {
    setVisible(false);
    setCompleted(true);
  }

  function handleSkip() {
    setVisible(false);
    setCompleted(true);
  }

  if (completed || !visible || !currentStep) return null;

  // Compute tooltip position
  const padding = 8;
  const tooltipStyle: React.CSSProperties = {};

  if (rect) {
    switch (currentStep.position) {
      case 'bottom':
        tooltipStyle.top = rect.bottom + padding;
        tooltipStyle.left = rect.left + rect.width / 2;
        tooltipStyle.transform = 'translateX(-50%)';
        break;
      case 'top':
        tooltipStyle.bottom = window.innerHeight - rect.top + padding;
        tooltipStyle.left = rect.left + rect.width / 2;
        tooltipStyle.transform = 'translateX(-50%)';
        break;
      case 'right':
        tooltipStyle.top = rect.top + rect.height / 2;
        tooltipStyle.left = rect.right + padding;
        tooltipStyle.transform = 'translateY(-50%)';
        break;
      case 'left':
        tooltipStyle.top = rect.top + rect.height / 2;
        tooltipStyle.right = window.innerWidth - rect.left + padding;
        tooltipStyle.transform = 'translateY(-50%)';
        break;
    }
  } else {
    // Fallback: center on screen
    tooltipStyle.top = '50%';
    tooltipStyle.left = '50%';
    tooltipStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Overlay with spotlight cutout */}
      <svg className="absolute inset-0 h-full w-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - padding}
                y={rect.top - padding}
                width={rect.width + padding * 2}
                height={rect.height + padding * 2}
                rx={8}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.5)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Spotlight border */}
      {rect && (
        <div
          className="absolute rounded-lg border-2 border-white shadow-lg shadow-white/20 pointer-events-none transition-all duration-300"
          style={{
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
          }}
        />
      )}

      {/* Click blocker */}
      <div className="absolute inset-0" onClick={handleSkip} />

      {/* Tooltip */}
      <div
        className="absolute z-[71] w-80 rounded-lg bg-white p-4 shadow-xl"
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute right-2 top-2 rounded p-1 text-gray-400 hover:text-black transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Step counter */}
        <p className="text-[11px] font-medium text-gray-400 mb-1">
          Step {step + 1} of {TOUR_STEPS.length}
        </p>

        {/* Content */}
        <h4 className="text-sm font-semibold text-black">{currentStep.title}</h4>
        <p className="mt-1 text-sm text-gray-600">{currentStep.description}</p>

        {/* Progress dots */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === step ? 'w-4 bg-black' : i < step ? 'w-1.5 bg-black/40' : 'w-1.5 bg-gray-200'
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:text-black transition-colors"
              >
                <ChevronLeft className="h-3 w-3" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
            >
              {step < TOUR_STEPS.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="h-3 w-3" />
                </>
              ) : (
                'Finish'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
