import { useEffect, useState, useMemo } from 'react';
import { contours } from 'd3-contour';
import { geoPath } from 'd3-geo';
import { createNoise2D } from 'simplex-noise';

function TopographicalBackground() {
  const [svgPaths, setSvgPaths] = useState([]);

  // Generate realistic elevation data using simplex noise
  const elevationData = useMemo(() => {
    const size = 200; // Grid size
    const values = new Float32Array(size * size);
    
    // Create noise function with fixed seed for consistency
    const noise2D = createNoise2D(() => .42); // Fixed seed
    
    let minValue = Infinity;
    let maxValue = -Infinity;
    
    for (let j = 0; j < size; j++) {
      for (let i = 0; i < size; i++) {
        // Scale coordinates for appropriate feature size
        const scale = 3.0 / size;
        const x = i * scale;
        const y = j * scale;
        
        // Combine multiple octaves for realistic terrain
        let elevation = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxAmplitude = 0; // For normalizing
        
        // Add 4 octaves of noise at different scales
        for (let octave = 0; octave < 4; octave++) {
          elevation += amplitude * noise2D(x * frequency, y * frequency);
          maxAmplitude += amplitude;
          amplitude *= 0.5;  // Each octave is half as strong
          frequency *= 2.0;  // Each octave has 2x the frequency
        }
        
        // Normalize to 0-1 range
        elevation = elevation / maxAmplitude;
        elevation = (elevation + 1) * 0.5;
        
        values[j * size + i] = elevation;
        minValue = Math.min(minValue, elevation);
        maxValue = Math.max(maxValue, elevation);
      }
    }
    return { values, size, minValue, maxValue };
  }, []);

  useEffect(() => {
    const { values, size, minValue, maxValue } = elevationData;
    
    // Create evenly spaced thresholds within the data range
    // Start from 0 to include the minimum value
    const numContours = 10;
    const thresholdValues = [];
    for (let i = 0; i < numContours; i++) {
      thresholdValues.push(minValue + (maxValue - minValue) * (i / numContours));
    }
    
    // Configure D3 contour generator
    const contourGenerator = contours()
      .size([size, size])
      .thresholds(thresholdValues);
    
    // Generate contours
    const contourData = contourGenerator(values);
    
    // Convert to SVG paths
    const pathGenerator = geoPath();
    
    // Define explicit settings for each contour level
    // Modify these values to control each layer independently
    const contourSettings = [
      { level: 0, color: 'text-blue-900', fillOpacity: 1, strokeOpacity: .6 },
      { level: 1, color: 'text-blue-900', fillOpacity: 0.3, strokeOpacity: .5 },
      { level: 2, color: 'text-blue-800', fillOpacity: 0.25, strokeOpacity: .4 },
      { level: 3, color: 'text-blue-800', fillOpacity: 0.2, strokeOpacity: .3 },
      { level: 4, color: 'text-blue-600', fillOpacity: 0.15, strokeOpacity: .2 },
      { level: 5, color: 'text-blue-500', fillOpacity: 0.1, strokeOpacity: .1 },
      { level: 6, color: 'text-blue-400', fillOpacity: 0.05, strokeOpacity: .1 },
      { level: 7, color: 'text-white dark:text-gray-900', fillOpacity: .1, strokeOpacity: .1 },
      { level: 8, color: 'text-green-500 dark:text-gray-700', fillOpacity: .5, strokeOpacity: .5 },
      { level: 9, color: 'text-green-500 dark:text-gray-600', fillOpacity: .7, strokeOpacity: .5 }
    ];
    
    const paths = contourData.map((d, i) => {
      const pathString = pathGenerator(d);
      
      // Get settings for this contour level, or use default if beyond defined levels
      const settings = contourSettings[i]
      
      return {
        id: `contour-${i}`,
        d: pathString,
        value: d.value,
        ...settings,
        strokeWidth: 0.2
      };
    }).filter(path => path.d); // Filter out any null paths
    setSvgPaths(paths);
  }, [elevationData]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
      >
        <g>
          {/* Render in natural order: level 0 (base) at bottom, higher levels on top */}
          {svgPaths.map((path) => (
            <path
              key={path.id}
              d={path.d}
              fill="currentColor"
              fillOpacity={path.fillOpacity}
              fillRule="evenodd"
              stroke="currentColor"
              strokeWidth={path.strokeWidth}
              strokeOpacity={path.strokeOpacity}
              className={path.color}
            />
          ))}
        </g>
      </svg>
      {svgPaths.length === 0 && (
        <div className="absolute top-0 left-0 text-xs text-red-500">
          No contours generated
        </div>
      )}
    </div>
  );
}

export default TopographicalBackground;