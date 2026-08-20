/**
 * Combined /api/products handler
 * - If AIRTABLE_API_KEY and AIRTABLE_BASE_ID are configured the route will proxy Airtable and map records.
 * - Otherwise falls back to a keyless, in-memory catalogue with Google Drive / Dropbox / GitHub raw conversion.
 * - POST still accepts keyless attachment posts and stores them in-memory.
 */

// Helper to extract Google Drive File ID keylessly
function extractGoogleDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1].split('?')[0];

  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1].split('&')[0];

  const openMatch = trimmed.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch && openMatch[1]) return openMatch[1].split('&')[0];

  const ucMatch = trimmed.match(/\/uc\?(?:[^&]*&)*id=([a-zA-Z0-9_-]+)/);
  if (ucMatch && ucMatch[1]) return ucMatch[1].split('&')[0];

  if (/^[a-zA-Z0-9_-]{25,45}$/.test(trimmed)) return trimmed;

  return null;
}

export function convertAttachmentUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  const driveId = extractGoogleDriveFileId(trimmed);
  if (driveId) return `https://drive.google.com/thumbnail?id=${driveId}&sz=w2000`;

  if (trimmed.includes('dropbox.com')) {
    if (trimmed.includes('dl.dropboxusercontent.com')) return trimmed;
    if (trimmed.includes('?dl=0')) return trimmed.replace('?dl=0', '?raw=1');
    if (trimmed.includes('?dl=1')) return trimmed.replace('?dl=1', '?raw=1');
    return trimmed.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }

  if (trimmed.includes('github.com') && trimmed.includes('/blob/')) {
    return trimmed.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:') && !trimmed.startsWith('blob:')) {
    return trimmed.startsWith('/') ? trimmed : '/' + trimmed.replace(/^\.\//, '');
  }

  return trimmed;
}

// Airtable utilities (used when configured)
const firstPresent = (fields: Record<string, any>, names: string[]) => {
  for (const name of names) {
    const value = fields[name];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
};

const normalizeImages = (fields: Record<string, any>) => {
  const raw = firstPresent(fields, [
    'Images', 'Image', 'Photos', 'Photo', 'Media', 'Picture', 'Pictures',
    'Cover', 'Cover Image', 'Attachment', 'Attachments', 'Image URL', 'URL'
  ]);

  const items = Array.isArray(raw) ? raw : raw ? [raw] : [];

  return items.flatMap((item: any) => {
    if (typeof item === 'string') {
      return item.trim() ? [{ url: item.trim(), type: 'image' }] : [];
    }

    const url = item?.url
      || item?.thumbnails?.full?.url
      || item?.thumbnails?.large?.url
      || item?.thumbnails?.small?.url;

    if (!url) return [];

    return [{
      url,
      type: typeof item.type === 'string' && item.type.startsWith('video') ? 'video' : 'image'
    }];
  });
};

const mapProduct = (record: any) => {
  const fields = record.fields || {};
  const name = firstPresent(fields, ['Product Name', 'Name', 'Title']) || 'Product';
  const quantity = Number(firstPresent(fields, ['On-Hand Quantity', 'Quantity']) ?? 50);
  const category = firstPresent(fields, ['Category', 'Categories', 'Category Name']) || 'ARTIFACTS';
  const images = normalizeImages(fields).map((img: any) => ({ ...img, url: convertAttachmentUrl(img.url) }));

  return {
    id: record.id,
    name,
    description: firstPresent(fields, [
      'Description', 'Product Description', 'Details', 'Long Description',
      'Body', 'Notes', 'Overview', 'Short Description'
    ]) || '',
    short_description: firstPresent(fields, ['Short Description', 'Subtitle', 'Summary']) || '',
    price: Number(fields.Price) || 350,
    category: Array.isArray(category) ? category[0] : category,
    images,
    in_stock: quantity > 0,
    stock_quantity: quantity,
    sku: firstPresent(fields, ['SKU', 'Code']) || record.id,
    tags: Array.isArray(fields.Tags) ? fields.Tags : fields.Tags ? [fields.Tags] : [],
    is_visible: fields.Visibility !== false,
    featured: Boolean(fields.Featured),
    status: fields.Status || 'Active',
    created_at: fields['Last Updated Date'] || new Date().toISOString()
  };
};

// Fallback base products and in-memory posted products (from incoming branch)
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

let postedProducts: any[] = [];

export default async function handler(req: any, res: any) {
  // Allow keyless queries (incoming branch behaviour)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();

  // POST: keep keyless attachment posting behaviour (in-memory)
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

      freshAttachments.sort((a: any, b: any) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

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

      return res.status(201).json({ success: true, message: "Attachments parsed (keyless)", product: newProduct, attachments: freshAttachments });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: "Failed to parse attachment payload", details: err.message });
    }
  }

  // GET: If Airtable is configured use it; otherwise return keyless in-memory catalogue
  if (req.method === 'GET') {
    const apiKey = process.env.AIRTABLE_API_KEY?.trim();
    const baseId = process.env.AIRTABLE_BASE_ID?.trim();
    const tableName = process.env.AIRTABLE_PRODUCTS_TABLE?.trim() || process.env.AIRTABLE_TABLE_NAME?.trim() || 'Products';

    if (apiKey && baseId) {
      try {
        const records: any[] = [];
        let offset: string | undefined;

        do {
          const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`);
          if (offset) url.searchParams.set('offset', offset);

          const response = await fetch(url.toString(), { headers: { Authorization: `Bearer ${apiKey}` } });

          if (!response.ok) {
            const detail = await response.text();
            console.error(`Airtable returned ${response.status}: ${detail}`);
            return res.status(502).json({ error: `Airtable request failed with status ${response.status}.` });
          }

          const page = await response.json() as { records?: any[]; offset?: string };
          records.push(...(page.records || []));
          offset = page.offset;
        } while (offset);

        res.setHeader('Cache-Control', 'private, no-store, max-age=0');

        const products = records.map(mapProduct).filter((product: any) => product.is_visible && product.status !== 'Draft' && product.status !== 'Archived');
        return res.status(200).json(products);
      } catch (error) {
        console.error('Failed to load Airtable products:', error);
        return res.status(500).json({ error: 'Unable to load products from Airtable.' });
      }
    }

    // Keyless fallback (incoming branch behaviour)
    try {
      const singleDriveUrl = (req.query?.drive_url || req.query?.attachment || req.query?.url) as string;
      if (singleDriveUrl) {
        const freshUrl = convertAttachmentUrl(singleDriveUrl);
        return res.json({ original_url: singleDriveUrl, fresh_attachment_url: freshUrl, candidates: [freshUrl, `https://lh3.googleusercontent.com/d/${extractGoogleDriveFileId(singleDriveUrl) || ''}=s2000`, singleDriveUrl].filter(Boolean) });
      }

      const all = [...postedProducts, ...BASE_PRODUCTS];

      const formatted = all.map(p => {
        const rawImages = Array.isArray(p.images) ? p.images : [];
        const freshImages = rawImages.map((img: any, idx: number) => {
          const rawUrl = typeof img === 'string' ? img : (img.url || '');
          const freshUrl = convertAttachmentUrl(rawUrl);
          return { uid: img.uid || `img_${idx}`, url: freshUrl, type: img.type || 'image', created_at: img.created_at || new Date(Date.now() + idx * 1000).toISOString() };
        });

        freshImages.sort((a: any, b: any) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

        return { ...p, images: freshImages, created_at: p.created_at || new Date().toISOString() };
      });

      const sortOrder = req.query?.sort || 'chronological';
      formatted.sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        if (sortOrder === 'asc' || sortOrder === 'oldest') return timeA - timeB;
        return timeB - timeA;
      });

      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      return res.status(200).json(formatted);
    } catch (err: any) {
      return res.status(500).json({ error: 'Internal error fetching products', details: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

}
