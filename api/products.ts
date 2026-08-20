type VercelRequest = {
  method?: string;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

type AirtableRecord = {
  id: string;
  fields?: Record<string, any>;
};

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
      type: typeof item.type === 'string' && item.type.startsWith('video')
        ? 'video'
        : 'image'
    }];
  });
};

const mapProduct = (record: AirtableRecord) => {
  const fields = record.fields || {};
  const name = firstPresent(fields, ['Product Name', 'Name', 'Title']) || 'Product';
  const quantity = Number(firstPresent(fields, ['On-Hand Quantity', 'Quantity']) ?? 50);
  const category = firstPresent(fields, ['Category', 'Categories', 'Category Name']) || 'ARTIFACTS';
  const images = normalizeImages(fields);

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.AIRTABLE_API_KEY?.trim();
  const baseId = process.env.AIRTABLE_BASE_ID?.trim();
  const tableName = process.env.AIRTABLE_PRODUCTS_TABLE?.trim() || 'Products';

  if (!apiKey || !baseId) {
    return res.status(500).json({
      error: 'Airtable is not configured on this Vercel deployment.'
    });
  }

  try {
    const records: AirtableRecord[] = [];
    let offset: string | undefined;

    do {
      const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`);
      if (offset) url.searchParams.set('offset', offset);

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });

      if (!response.ok) {
        const detail = await response.text();
        console.error(`Airtable returned ${response.status}: ${detail}`);
        return res.status(502).json({
          error: `Airtable request failed with status ${response.status}.`
        });
      }

      const page = await response.json() as {
        records?: AirtableRecord[];
        offset?: string;
      };

      records.push(...(page.records || []));
      offset = page.offset;
    } while (offset);

    // Airtable attachment URLs are signed and temporary. Never cache this
    // response long enough to hand expired image URLs to the storefront.
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');

    return res.status(200).json(
      records
        .map(mapProduct)
        .filter(product => product.is_visible && product.status !== 'Draft' && product.status !== 'Archived')
    );
  } catch (error) {
    console.error('Failed to load Airtable products:', error);
    return res.status(500).json({ error: 'Unable to load products from Airtable.' });
  }
}
