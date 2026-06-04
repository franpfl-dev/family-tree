/**
 * useExport.js
 * 5E — Export utilities: PNG via html2canvas, JSON data download.
 */

import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';

/**
 * Capture the tree canvas as a PNG and download it.
 * @param {string} canvasRef - ref to the pan-transform div
 * @param {string} treeName
 */
export async function exportAsPng(canvasEl, treeName = 'family-tree') {
  try {
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(canvasEl, {
      backgroundColor: '#FDF6EC',
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${treeName.replace(/\s+/g, '-').toLowerCase()}-tree.png`;
    a.click();
  } catch (err) {
    console.error('PNG export failed:', err);
    alert('PNG export failed. Please try again.');
  }
}

/**
 * Download full AppState as JSON.
 */
export function useExportJson() {
  const { exportData } = useAppContext();
  return exportData;
}

/**
 * Import JSON and restore state.
 */
export function useImportJson() {
  const { importData } = useAppContext();
  return useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        importData(e.target.result);
      } catch {
        alert('Invalid JSON file. Could not import data.');
      }
    };
    reader.readAsText(file);
  }, [importData]);
}
