'use client';

import * as React from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { Button } from '../../../shadcn/button';
import { Checkbox } from '../../../shadcn/checkbox';
import { Label } from '../../../shadcn/label';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';

export interface ChartWrapperProps {
  title?: string;
  children: React.ReactNode;
  chartRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
  showAxisLabels?: boolean;
  onShowAxisLabelsChange?: (show: boolean) => void;
}

// Context to pass axis label visibility to chart components
export const ChartContext = React.createContext<{
  showAxisLabels: boolean;
}>({
  showAxisLabels: true,
});

/**
 * Enhanced chart wrapper with title, download, and copy functionality
 */
export function ChartWrapper({
  title,
  children,
  chartRef,
  className,
  showAxisLabels: controlledShowAxisLabels,
  onShowAxisLabelsChange,
}: ChartWrapperProps) {
  const [copied, setCopied] = React.useState(false);
  const [internalShowAxisLabels, setInternalShowAxisLabels] =
    React.useState(true);
  const internalRef = React.useRef<HTMLDivElement>(null);
  const ref = chartRef || internalRef;

  // Use controlled or internal state
  const showAxisLabels =
    controlledShowAxisLabels !== undefined
      ? controlledShowAxisLabels
      : internalShowAxisLabels;

  const handleShowAxisLabelsChange = (checked: boolean) => {
    if (onShowAxisLabelsChange) {
      onShowAxisLabelsChange(checked);
    } else {
      setInternalShowAxisLabels(checked);
    }
  };

  const downloadAsPNG = React.useCallback(async () => {
    if (!ref.current) {
      toast.error('Chart element not found');
      return;
    }

    try {
      // Find the SVG element within the chart container
      const svgElement = ref.current.querySelector('svg');
      if (!svgElement) {
        toast.error('SVG element not found in chart');
        return;
      }

      // Clone the SVG to avoid modifying the original
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;

      // Get SVG viewBox or dimensions
      const viewBox = clonedSvg.getAttribute('viewBox');
      let width = 0;
      let height = 0;

      if (viewBox) {
        const parts = viewBox.split(' ');
        if (parts.length >= 4) {
          width = parseFloat(parts[2] || '0') || 0;
          height = parseFloat(parts[3] || '0') || 0;
        }
      } else {
        const widthAttr = clonedSvg.getAttribute('width');
        const heightAttr = clonedSvg.getAttribute('height');
        width = parseFloat(widthAttr || '0') || 0;
        height = parseFloat(heightAttr || '0') || 0;
      }

      // If no dimensions found, use bounding rect
      if (!width || !height) {
        const rect = svgElement.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
      }

      // Ensure minimum dimensions
      if (width < 100) width = 800;
      if (height < 100) height = 600;

      // Set explicit dimensions on cloned SVG
      clonedSvg.setAttribute('width', width.toString());
      clonedSvg.setAttribute('height', height.toString());
      clonedSvg.setAttribute('style', 'background: transparent;');

      // Serialize SVG
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const svgUrl = URL.createObjectURL(svgBlob);

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        toast.error('Failed to create canvas context');
        URL.revokeObjectURL(svgUrl);
        return;
      }

      // Set transparent background
      ctx.clearRect(0, 0, width, height);

      // Load SVG as image
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(svgUrl);

        // Convert canvas to PNG with transparent background
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              toast.error('Failed to create image blob');
              return;
            }

            // Download the image
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${title || 'chart'}-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);

            toast.success('Chart downloaded as PNG');
          },
          'image/png',
          1.0,
        );
      };

      img.onerror = () => {
        toast.error('Failed to load SVG image');
        URL.revokeObjectURL(svgUrl);
      };

      img.src = svgUrl;
    } catch (error) {
      console.error('Error downloading chart:', error);
      toast.error('Failed to download chart');
    }
  }, [ref, title]);

  const copySVG = React.useCallback(async () => {
    if (!ref.current) {
      toast.error('Chart element not found');
      return;
    }

    try {
      const svgElement = ref.current.querySelector('svg');
      if (!svgElement) {
        toast.error('SVG element not found in chart');
        return;
      }

      // Get the SVG code
      const svgCode = new XMLSerializer().serializeToString(svgElement);

      // Copy to clipboard
      await navigator.clipboard.writeText(svgCode);
      setCopied(true);
      toast.success('SVG code copied to clipboard');

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying SVG:', error);
      toast.error('Failed to copy SVG code');
    }
  }, [ref]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(
    () => ({ showAxisLabels }),
    [showAxisLabels],
  );

  return (
    <div className={cn('relative space-y-3', className)}>
      {/* Header with title centered and buttons on right */}
      <div className="relative mb-3 flex items-center justify-center">
        {title && (
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        )}
        {/* Buttons and controls in top right */}
        <div className="absolute right-0 top-0 flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Checkbox
              id="show-axis-labels"
              checked={showAxisLabels}
              onCheckedChange={(checked) =>
                handleShowAxisLabelsChange(checked === true)
              }
              className="h-4 w-4"
            />
            <Label
              htmlFor="show-axis-labels"
              className="text-xs text-muted-foreground cursor-pointer"
            >
              Show axes
            </Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadAsPNG}
            className="h-7 w-7 p-0"
            title="Download PNG"
          >
            <Download className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={copySVG}
            className="h-7 w-7 p-0"
            title={copied ? 'Copied!' : 'Copy SVG'}
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
      <ChartContext.Provider value={contextValue}>
        <div ref={ref} className="w-full">
          {children}
        </div>
      </ChartContext.Provider>
    </div>
  );
}

