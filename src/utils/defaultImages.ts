/**
 * Generates beautiful default logo and signature images using HTML5 Canvas.
 * This avoids giant static strings and provides beautiful high-res assets out of the box.
 */

export function getDefaultLogo(): string {
  if (typeof window === 'undefined') return '';
  
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Clear background (white)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Medical / Herbal Leaf Emblem (Circular Badge)
  const cx = 50;
  const cy = 50;
  const r = 38;

  // Outer circle
  ctx.strokeStyle = '#0284c7'; // Sky-600
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Inner green circle
  ctx.strokeStyle = '#10b981'; // Emerald-500
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 5, 0, Math.PI * 2);
  ctx.stroke();

  // Draw green leaf shape in center
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.moveTo(cx - 15, cy + 5);
  // Quadratic curve for leaf
  ctx.quadraticCurveTo(cx - 5, cy - 20, cx + 15, cy - 15);
  ctx.quadraticCurveTo(cx + 5, cy + 15, cx - 15, cy + 5);
  ctx.fill();

  // Draw another crossing leaf or stem
  ctx.fillStyle = '#059669';
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy + 15);
  ctx.quadraticCurveTo(cx + 10, cy - 5, cx + 22, cy);
  ctx.quadraticCurveTo(cx + 12, cy + 20, cx - 5, cy + 15);
  ctx.fill();

  // Draw elegant medical cross in center (small, white, overlay)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - 2, cy - 7, 4, 14);
  ctx.fillRect(cx - 7, cy - 2, 14, 4);

  // Clinic Name Typography
  ctx.fillStyle = '#0f172a'; // Slate-900
  ctx.font = 'bold 18px "Inter", "Helvetica Neue", sans-serif';
  ctx.fillText('LAKSHMI HEALTH CARE CENTRE', 105, 38);

  ctx.fillStyle = '#0284c7'; // Sky-600
  ctx.font = 'semibold 13px "Inter", "Helvetica Neue", sans-serif';
  ctx.fillText('Siddha & Herbal Treatment Clinic', 105, 58);

  ctx.fillStyle = '#64748b'; // Slate-500
  ctx.font = 'italic 11px "Inter", sans-serif';
  ctx.fillText('Rockfort, Trichy, Tamil Nadu, India', 105, 76);

  return canvas.toDataURL('image/png');
}

export function getDefaultSignature(doctorName?: string): string {
  if (typeof window === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Clear background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const name = doctorName || 'Dr. S. Lakshmi';

  // Draw signature in smooth blue ink
  ctx.strokeStyle = '#1e40af'; // Blue-800
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  // "Dr. S. Lakshmi" stylized handwriting
  ctx.moveTo(30, 60);
  ctx.bezierCurveTo(45, 10, 55, 20, 65, 60); // D
  ctx.bezierCurveTo(70, 70, 75, 45, 80, 55); // r
  ctx.arc(88, 55, 1.5, 0, Math.PI * 2);      // .

  // "S."
  ctx.moveTo(100, 45);
  ctx.bezierCurveTo(115, 30, 100, 65, 120, 55);
  ctx.arc(126, 55, 1.5, 0, Math.PI * 2);      // .

  // "Lakshmi"
  ctx.moveTo(140, 60);
  ctx.quadraticCurveTo(145, 25, 148, 60);   // L
  ctx.bezierCurveTo(155, 50, 160, 60, 165, 55); // a
  ctx.bezierCurveTo(170, 40, 175, 75, 180, 55); // k
  ctx.bezierCurveTo(185, 45, 190, 65, 195, 55); // s
  ctx.bezierCurveTo(200, 30, 203, 70, 205, 55); // h
  ctx.bezierCurveTo(210, 45, 215, 65, 220, 55); // m
  ctx.bezierCurveTo(225, 45, 230, 60, 235, 55); // i

  // Dot for i
  ctx.arc(235, 38, 1.5, 0, Math.PI * 2);

  // Elegant underline with loops
  ctx.moveTo(40, 75);
  ctx.bezierCurveTo(90, 80, 180, 65, 260, 70);
  ctx.bezierCurveTo(240, 85, 180, 95, 160, 85);

  ctx.stroke();

  // Print text label under signature
  ctx.fillStyle = '#475569'; // Slate-600
  ctx.font = '11px "Inter", "Helvetica", sans-serif';
  ctx.fillText(name, 70, 95);

  return canvas.toDataURL('image/png');
}
