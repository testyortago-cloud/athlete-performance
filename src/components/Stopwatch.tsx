'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Play, Pause, RotateCcw, Timer, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StopwatchProps {
  onUseTime?: (seconds: number) => void;
}

export function Stopwatch({ onUseTime }: StopwatchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0); // milliseconds
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const accumulatedRef = useRef(0);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    accumulatedRef.current = elapsed;
    intervalRef.current = setInterval(() => {
      setElapsed(accumulatedRef.current + (Date.now() - startTimeRef.current));
    }, 10);
    setRunning(true);
  }, [elapsed]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setElapsed(0);
    setLaps([]);
    accumulatedRef.current = 0;
  }, [stop]);

  const lap = useCallback(() => {
    setLaps((prev) => [...prev, elapsed]);
  }, [elapsed]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  }

  const seconds = Math.round(elapsed / 10) / 100; // seconds with 2 decimal places

  return (
    <div className="rounded-lg border border-border bg-white">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-black hover:bg-muted transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-gray-400" />
          <span>Stopwatch</span>
          {running && (
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          )}
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {isOpen && (
        <div className="border-t border-border px-4 py-4">
          {/* Timer display */}
          <div className="text-center mb-4">
            <p className={cn(
              'text-4xl font-mono font-bold tracking-wider',
              running ? 'text-black' : elapsed > 0 ? 'text-success' : 'text-gray-300'
            )}>
              {formatTime(elapsed)}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {!running ? (
              <Button size="sm" onClick={start} icon={<Play className="h-3.5 w-3.5" />}>
                {elapsed > 0 ? 'Resume' : 'Start'}
              </Button>
            ) : (
              <>
                <Button size="sm" variant="secondary" onClick={stop} icon={<Pause className="h-3.5 w-3.5" />}>
                  Stop
                </Button>
                <Button size="sm" variant="outline" onClick={lap}>
                  Lap
                </Button>
              </>
            )}
            {elapsed > 0 && !running && (
              <>
                <Button size="sm" variant="secondary" onClick={reset} icon={<RotateCcw className="h-3.5 w-3.5" />}>
                  Reset
                </Button>
                {onUseTime && (
                  <Button size="sm" variant="outline" onClick={() => onUseTime(seconds)} icon={<Copy className="h-3.5 w-3.5" />}>
                    Use Time ({seconds}s)
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Laps */}
          {laps.length > 0 && (
            <div className="border-t border-border pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Laps</p>
              <div className="space-y-1 max-h-32 overflow-auto">
                {laps.map((lapTime, i) => {
                  const splitTime = i === 0 ? lapTime : lapTime - laps[i - 1];
                  return (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Lap {i + 1}</span>
                      <div className="flex gap-4">
                        <span className="text-gray-400">+{formatTime(splitTime)}</span>
                        <span className="font-medium text-black font-mono">{formatTime(lapTime)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
