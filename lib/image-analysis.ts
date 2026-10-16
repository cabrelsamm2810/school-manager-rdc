/**
 * Analyse automatique d'images pour l'import OCR.
 * Détecte : netteté (Laplacien), luminosité, contraste, type de document, densité de texte.
 * Tout est calculé côté client via Canvas — aucune API externe requise.
 */

export type ImageAnalysis = {
  /** Variance du Laplacien (netteté). Plus haut = plus net. */
  sharpness: number;
  blurry: boolean;
  /** Luminosité moyenne 0-255. */
  brightness: number;
  tooDark: boolean;
  tooBright: boolean;
  /** Écart-type des niveaux de gris (contraste). */
  contrast: number;
  lowContrast: boolean;
  /** Heuristique : true si l'image ressemble à un document (fond clair, ratio A4). */
  isDocument: boolean;
  /** Densité de contours (proxy pour présence de texte). 0-1. */
  textDensity: number;
  /** Qualité globale agrégée. */
  overall: 'good' | 'acceptable' | 'poor';
  /** Liste de problèmes détectés. */
  issues: string[];
};

const BLUR_THRESHOLD = 100;
const DARK_THRESHOLD = 70;
const BRIGHT_THRESHOLD = 220;
const LOW_CONTRAST_THRESHOLD = 30;

/**
 * Analyse complète d'une image.
 * Sous-échantillonne à 256px max pour la performance.
 */
export async function analyzeImage(file: File): Promise<ImageAnalysis> {
  try {
    const bitmap = await createImageBitmap(file);
    const maxDim = 256;
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(3, Math.round(bitmap.width * scale));
    const h = Math.max(3, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return fallbackAnalysis();

    ctx.drawImage(bitmap, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Niveaux de gris
    const gray = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    // --- Luminosité ---
    let sumBrightness = 0;
    for (let i = 0; i < w * h; i++) sumBrightness += gray[i];
    const brightness = Math.round(sumBrightness / (w * h));
    const tooDark = brightness < DARK_THRESHOLD;
    const tooBright = brightness > BRIGHT_THRESHOLD;

    // --- Contraste (écart-type) ---
    let sumSq = 0;
    for (let i = 0; i < w * h; i++) {
      const d = gray[i] - brightness;
      sumSq += d * d;
    }
    const contrast = Math.round(Math.sqrt(sumSq / (w * h)));
    const lowContrast = contrast < LOW_CONTRAST_THRESHOLD;

    // --- Netteté (variance du Laplacien) ---
    const laplacian = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        laplacian[idx] =
          gray[idx - w] + gray[idx + w] +
          gray[idx - 1] + gray[idx + 1] -
          4 * gray[idx];
      }
    }
    let mean = 0;
    let count = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        mean += laplacian[y * w + x];
        count++;
      }
    }
    mean /= count;
    let variance = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const v = laplacian[y * w + x] - mean;
        variance += v * v;
      }
    }
    variance /= count;
    const sharpness = Math.round(variance);
    const blurry = sharpness < BLUR_THRESHOLD;

    // --- Densité de texte (Sobel edge density) ---
    let edgeCount = 0;
    let edgeTotal = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        // Sobel X
        const gx = Math.abs(
          gray[idx - w - 1] + 2 * gray[idx - 1] + gray[idx + w - 1] -
          gray[idx - w + 1] - 2 * gray[idx + 1] - gray[idx + w + 1]
        );
        // Sobel Y
        const gy = Math.abs(
          gray[idx - w - 1] + 2 * gray[idx - w] + gray[idx - w + 1] -
          gray[idx + w - 1] - 2 * gray[idx + w] - gray[idx + w + 1]
        );
        const mag = gx + gy;
        edgeTotal++;
        if (mag > 60) edgeCount++;
      }
    }
    const textDensity = edgeCount / edgeTotal;

    // --- Type de document ---
    // Heuristique : fond majoritairement clair + ratio proche de A4
    const lightRatio = gray.filter((v) => v > 200).length / (w * h);
    const aspectRatio = bitmap.width / bitmap.height;
    const isDocument = lightRatio > 0.45 && aspectRatio > 0.4 && aspectRatio < 2.5;

    // --- Qualité globale ---
    const issues: string[] = [];
    if (blurry) issues.push('Image floue');
    if (tooDark) issues.push('Trop sombre');
    if (tooBright) issues.push('Trop claire');
    if (lowContrast) issues.push('Contraste faible');
    if (!isDocument) issues.push('Pas un document');
    if (textDensity < 0.02) issues.push('Peu de texte détecté');

    let overall: 'good' | 'acceptable' | 'poor';
    const criticalIssues = (blurry ? 1 : 0) + (tooDark ? 1 : 0) + (tooBright ? 1 : 0) + (lowContrast ? 1 : 0);
    if (criticalIssues === 0 && textDensity > 0.05) {
      overall = 'good';
    } else if (criticalIssues <= 1) {
      overall = 'acceptable';
    } else {
      overall = 'poor';
    }

    return {
      sharpness, blurry, brightness, tooDark, tooBright,
      contrast, lowContrast, isDocument, textDensity, overall, issues,
    };
  } catch {
    return fallbackAnalysis();
  }
}

function fallbackAnalysis(): ImageAnalysis {
  return {
    sharpness: 0, blurry: false, brightness: 128,
    tooDark: false, tooBright: false, contrast: 50,
    lowContrast: false, isDocument: true, textDensity: 0.1,
    overall: 'acceptable', issues: [],
  };
}
