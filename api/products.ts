/**
 * Serverless & Keyless API Route: /api/products
 * Compatible with Vercel Serverless Functions & Express proxy.
 *
 * Features:
 * - Keyless Google Drive Attachment Parsing: Converts any public Google Drive sharing URL,
 *   direct file ID, /open?id=, /file/d/, or /uc?id= to fresh, high-resolution direct attachment URLs.
 * - Chronological Ordering: Sorts and embeds product attachments in chronological order.
 * - Zero API key requirements: Fully functional for public assets without private credentials.
 */

// Helper to extract Google Drive File ID keylessly
function extractGoogleDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Pattern 1: /file/d/<id>
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1].split('?')[0];

  // Pattern 2: id=<id>
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1].split('&')[0];

  // Pattern 3: /open?id=<id>
  const openMatch = trimmed.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch && openMatch[1]) return openMatch[1].split('&')[0];

  // Pattern 4: /uc?id=<id>
  const ucMatch = trimmed.match(/\/uc\?(?:[^&]*&)*id=([a-zA-Z0-9_-]+)/);
  if (ucMatch && ucMatch[1]) return ucMatch[1].split('&')[0];

  // Pattern 5: Direct Google Drive File ID (alphanumeric 25-45 chars)
  if (/^[a-zA-Z0-9_-]{25,45}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

// Convert any Google Drive, Dropbox, or remote attachment link to fresh direct URL
export function convertAttachmentUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  const driveId = extractGoogleDriveFileId(trimmed);
  if (driveId) {
    // High-resolution public thumbnail endpoint that bypasses Google login/session requirements
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w2000`;
  }

  // Dropbox direct link
  if (trimmed.includes('dropbox.com')) {
    if (trimmed.includes('dl.dropboxusercontent.com')) return trimmed;
    if (trimmed.includes('?dl=0')) return trimmed.replace('?dl=0', '?raw=1');
    if (trimmed.includes('?dl=1')) return trimmed.replace('?dl=1', '?raw=1');
    return trimmed.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }

  // GitHub raw link
  if (trimmed.includes('github.com') && trimmed.includes('/blob/')) {
    return trimmed.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
  }

  // Local assets: ensure leading slash
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:') && !trimmed.startsWith('blob:')) {
    return trimmed.startsWith('/') ? trimmed : '/' + trimmed.replace(/^\.\//, '');
  }

  return trimmed;
}

// Base product catalogue fallback with chronological timestamps
const BASE_PRODUCTS = [
  {
    id: "d3-01",
    name: "D3 01",
    description: "A high-fidelity heavyweight hoodie artifact crafted for the D3COMPOSURE void. Features an experimental silhouette with technical precision.",
    price: 350,
    category: "ARTIFACT",
    is_visible: true,
    stripe_payment_link: "https://buy.stripe.com/00w4gB4II5Av2qQgsmfjG0a",
    stripe_buy_button_id: "buy_btn_1TAei0Q4FdRda8h8gr1qQnw4",
    stripe_publishable_key: "pk_live_51T8ECtQ4FdRda8h8nfdJSUR7txP58VE5Gpt3eqzVkBY7yHIhagkM85zML8BMqfHkseITaVI72Dwm1RzOUJmYjPqQ00irFfM8FW",
    images: [
      { url: "/assets/images/IMG_4800_1_3.png", type: "image", created_at: "2026-08-19T00:00:01.000Z" },
      { url: "/assets/images/IMG_3215_3_3.png", type: "image", created_at: "2026-08-19T00:00:02.000Z" },
      { url: "/assets/images/black_hoodie_tracksuit.jpg", type: "image", created_at: "2026-08-19T00:00:03.000Z" },
      { url: "/assets/images/d3_02_garment.jpg", type: "image", created_at: "2026-08-19T00:00:04.000Z" }
    ],
    stock: 999,
    created_at: "2026-08-19T10:00:00.000Z"
  }
];

// In-memory store for newly posted attachment products during runtime
let postedProducts: any[] = [];

export default async function handler(req: any, res: any) {
  // Enable CORS for keyless API access
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST: Receive Google Drive attachments keylessly and return fresh embeddable cards
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const rawAttachments = body.attachments || body.images || body.drive_urls || body.url || [];
      const attachmentList = Array.isArray(rawAttachments) ? rawAttachments : [rawAttachments];

      const now = new Date().toISOString();
      const freshAttachments = attachmentList
        .filter(Boolean)
        .map((item: any, idx: number) => {
          const rawUrl = typeof item === 'string' ? item : (item.url || item.drive_url || item.src || '');
          const freshUrl = convertAttachmentUrl(rawUrl);
          const isVideo = rawUrl.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || rawUrl.includes('video');
          const isModel = rawUrl.toLowerCase().match(/\.(glb|gltf|usdz)$/) || rawUrl.includes('model');

          return {
            uid: `att_${Date.now()}_${idx}`,
            url: freshUrl,
            raw_source: rawUrl,
            type: isVideo ? 'video' : (isModel ? 'model3d' : 'image'),
            created_at: item.created_at || new Date(Date.now() + idx * 1000).toISOString(),
            order: idx
          };
        })
        .filter((att: any) => Boolean(att.url));

      // Sort attachments in chronological order
      freshAttachments.sort((a: any, b: any) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeA - timeB;
      });

      const newProduct = {
        id: body.id || `prod_${Date.now()}`,
        name: body.name || body['Product Name'] || "D3 ARTIFACT",
        description: body.description || body.Description || "Technical garment artifact embedded with fresh Google Drive attachments.",
        price: Number(body.price || body.Price || 350),
        category: body.category || "ARTIFACT",
        images: freshAttachments.length > 0 ? freshAttachments : [{ url: "/assets/images/IMG_4800_1_3.png", type: "image", created_at: now }],
        stock: Number(body.stock || 50),
        is_visible: body.is_visible !== undefined ? Boolean(body.is_visible) : true,
        created_at: body.created_at || now,
        updated_at: now
      };

      postedProducts.unshift(newProduct);

      return res.status(201).json({
        success: true,
        message: "Google Drive image attachments parsed and converted keylessly",
        product: newProduct,
        attachments: freshAttachments
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: "Failed to parse attachment payload",
        details: err.message
      });
    }
  }

  // GET: Fetch all products with fresh Google Drive attachment URLs in chronological order
  if (req.method === 'GET') {
    try {
      // Direct link conversion query shortcut: /api/products?drive_url=https://drive.google.com/...
      const singleDriveUrl = (req.query?.drive_url || req.query?.attachment || req.query?.url) as string;
      if (singleDriveUrl) {
        const freshUrl = convertAttachmentUrl(singleDriveUrl);
        return res.json({
          original_url: singleDriveUrl,
          fresh_attachment_url: freshUrl,
          candidates: [
            freshUrl,
            `https://lh3.googleusercontent.com/d/${extractGoogleDriveFileId(singleDriveUrl) || ''}=s2000`,
            singleDriveUrl
          ].filter(Boolean)
        });
      }

      // Combine base and posted products
      const all = [...postedProducts, ...BASE_PRODUCTS];

      // Format all images with fresh converted URLs and ensure chronological ordering
      const formatted = all.map(p => {
        const rawImages = Array.isArray(p.images) ? p.images : [];
        const freshImages = rawImages.map((img: any, idx: number) => {
          const rawUrl = typeof img === 'string' ? img : (img.url || '');
          const freshUrl = convertAttachmentUrl(rawUrl);
          return {
            uid: img.uid || `img_${idx}`,
            url: freshUrl,
            type: img.type || 'image',
            created_at: img.created_at || new Date(Date.now() + idx * 1000).toISOString()
          };
        });

        // Ensure attachments inside each product card are chronologically ordered
        freshImages.sort((a: any, b: any) => {
          const timeA = new Date(a.created_at || 0).getTime();
          const timeB = new Date(b.created_at || 0).getTime();
          return timeA - timeB;
        });

        return {
          ...p,
          images: freshImages,
          created_at: p.created_at || new Date().toISOString()
        };
      });

      // Sort products chronologically (newest first or chronological sequence)
      const sortOrder = req.query?.sort || 'chronological';
      formatted.sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        if (sortOrder === 'asc' || sortOrder === 'oldest') {
          return timeA - timeB;
        }
        // Default chronological (descending timestamp: newest releases first)
        return timeB - timeA;
      });

      // Set caching headers for performance
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      return res.status(200).json(formatted);
    } catch (err: any) {
      return res.status(500).json({
        error: "Internal error fetching products",
        details: err.message
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
