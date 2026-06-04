/**
 * SVGConnectors.jsx
 * Draws curved SVG paths connecting parent nodes to child nodes.
 * Uses cubic bezier curves for a smooth organic look.
 */

import React from 'react';
import { getConnectorPoints } from '../hooks/useTreeLayout';

export default function SVGConnectors({ positions, parentChildPairs, canvasWidth, canvasHeight }) {
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: canvasWidth,
        height: canvasHeight,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="6"
          markerHeight="4"
          refX="6"
          refY="2"
          orient="auto"
        >
          <polygon
            points="0 0, 6 2, 0 4"
            fill="rgba(212,169,106,0.6)"
          />
        </marker>
      </defs>

      {parentChildPairs.map(({ parentId, childId }, index) => {
        const parentPos = positions.get(parentId);
        const childPos = positions.get(childId);

        if (!parentPos || !childPos) return null;

        const { px, py, cx, cy } = getConnectorPoints(parentPos, childPos);

        // Cubic bezier: control points bend toward vertical midpoint
        const midY = (py + cy) / 2;
        const d = `M ${px} ${py} C ${px} ${midY}, ${cx} ${midY}, ${cx} ${cy}`;

        return (
          <path
            key={`${parentId}-${childId}-${index}`}
            d={d}
            fill="none"
            stroke="rgba(212,169,106,0.65)"
            strokeWidth="1.8"
            strokeDasharray="none"
          />
        );
      })}
    </svg>
  );
}
