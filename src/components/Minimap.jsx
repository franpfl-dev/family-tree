/**
 * Minimap.jsx
 * 5C — Mini overview of the full tree in the bottom-right corner.
 * Click area on minimap to pan canvas to that region.
 */

import React, { useMemo } from 'react';
import { NODE_W, NODE_H, COUPLE_W, COUPLE_H } from '../hooks/useTreeLayout';

const MAP_W = 160;
const MAP_H = 100;

export default function Minimap({ positions, canvasWidth, canvasHeight, pan, onPanTo }) {
  if (!positions || positions.size === 0) return null;

  // Scale factor to fit entire canvas into minimap
  const scaleX = MAP_W / Math.max(canvasWidth, 1);
  const scaleY = MAP_H / Math.max(canvasHeight, 1);
  const scale = Math.min(scaleX, scaleY, 1);

  // Compute viewport indicator
  const vpW = window.innerWidth * scale;
  const vpH = (window.innerHeight - 56) * scale;
  const vpX = -pan.x * scale;
  const vpY = -pan.y * scale;

  // Collect unique blocks (avoid double-rendering couples)
  const blocks = [];
  const rendered = new Set();

  for (const [personId, pos] of positions.entries()) {
    if (rendered.has(personId)) continue;
    if (pos.isCouple) {
      if (pos.isLeft) {
        blocks.push({ x: pos.coupleX * scale, y: pos.y * scale, w: COUPLE_W * scale, h: COUPLE_H * scale, isCouple: true });
        rendered.add(personId);
        if (pos.spouseId) rendered.add(pos.spouseId);
      }
    } else {
      blocks.push({ x: pos.x * scale, y: pos.y * scale, w: NODE_W * scale, h: NODE_H * scale, isCouple: false });
      rendered.add(personId);
    }
  }

  function handleClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // Convert minimap click to canvas coordinates and center the view
    const canvasX = mx / scale;
    const canvasY = my / scale;
    onPanTo(-canvasX + window.innerWidth / 2, -canvasY + (window.innerHeight - 56) / 2);
  }

  return (
    <div
      title="Minimap — click to navigate"
      style={{
        position: 'fixed',
        bottom: '4.5rem',
        right: '1.25rem',
        width: MAP_W,
        height: MAP_H,
        background: 'rgba(255,248,240,0.92)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--color-border)',
        borderRadius: '10px',
        boxShadow: 'var(--shadow-node)',
        cursor: 'crosshair',
        overflow: 'hidden',
        zIndex: 50,
      }}
      onClick={handleClick}
    >
      {/* Dot background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(212,169,106,0.2) 1px, transparent 1px)',
        backgroundSize: '8px 8px',
        pointerEvents: 'none',
      }} />

      {/* Nodes */}
      <svg
        width={MAP_W}
        height={MAP_H}
        style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
      >
        {blocks.map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width={Math.max(b.w, 2)}
            height={Math.max(b.h, 2)}
            rx={2}
            fill={b.isCouple ? 'rgba(212,169,106,0.7)' : 'rgba(123,63,0,0.5)'}
            stroke="rgba(212,169,106,0.9)"
            strokeWidth={0.5}
          />
        ))}
      </svg>

      {/* Viewport indicator */}
      <div
        style={{
          position: 'absolute',
          left: Math.max(0, vpX),
          top: Math.max(0, vpY),
          width: Math.min(vpW, MAP_W),
          height: Math.min(vpH, MAP_H),
          border: '1.5px solid var(--color-primary)',
          background: 'rgba(123,63,0,0.08)',
          borderRadius: '3px',
          pointerEvents: 'none',
        }}
      />

      {/* Label */}
      <div style={{
        position: 'absolute', bottom: '2px', left: '4px',
        fontSize: '0.55rem', color: 'var(--color-muted)',
        fontFamily: 'var(--font-body)', pointerEvents: 'none',
        textTransform: 'uppercase', letterSpacing: '0.04em',
      }}>
        Minimap
      </div>
    </div>
  );
}
