/**
 * Google Drive Photo Access & Storefront Publishing Service
 * Handles listing, uploading, and publishing photos from Google Drive directly to the D3COMPOSURE storefront.
 */

export interface GoogleDrivePhoto {
  id: string;
  name: string;
  mimeType: string;
  thumbnailUrl: string;
  directUrl: string;
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
  size?: number;
}

export interface DriveFileListResponse {
  files: GoogleDrivePhoto[];
  nextPageToken?: string;
}

/**
 * Fetch image photos from the user's connected Google Drive account
 */
export async function fetchGoogleDrivePhotos(
  accessToken: string,
  searchQuery?: string,
  pageToken?: string,
  pageSize: number = 30
): Promise<DriveFileListResponse> {
  const queryParts = ["mimeType contains 'image/'", "trashed = false"];
  
  if (searchQuery && searchQuery.trim()) {
    const escaped = searchQuery.replace(/'/g, "\\'");
    queryParts.push(`name contains '${escaped}'`);
  }

  const q = queryParts.join(' and ');
  const fields = 'nextPageToken, files(id, name, mimeType, thumbnailLink, webViewLink, webContentLink, createdTime, size)';
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', q);
  url.searchParams.set('fields', fields);
  url.searchParams.set('pageSize', pageSize.toString());
  url.searchParams.set('orderBy', 'createdTime desc');
  if (pageToken) url.searchParams.set('pageToken', pageToken);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Google Drive API error (${res.status}): ${res.statusText}`);
  }

  const data = await res.json();
  const rawFiles: any[] = data.files || [];

  const photos: GoogleDrivePhoto[] = rawFiles.map(f => {
    const directUrl = `https://drive.google.com/thumbnail?id=${f.id}&sz=w2000`;
    return {
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      thumbnailUrl: f.thumbnailLink || directUrl,
      directUrl: directUrl,
      webViewLink: f.webViewLink,
      webContentLink: f.webContentLink,
      createdTime: f.createdTime,
      size: f.size ? Number(f.size) : undefined
    };
  });

  return {
    files: photos,
    nextPageToken: data.nextPageToken
  };
}

/**
 * Upload a local image file directly to user's Google Drive and return embeddable metadata
 */
export async function uploadImageToGoogleDrive(
  accessToken: string,
  file: File,
  folderId?: string
): Promise<GoogleDrivePhoto> {
  const metadata: any = {
    name: file.name,
    mimeType: file.type || 'image/jpeg'
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const fileData = await file.arrayBuffer();

  const multipartRequestBody = new Blob([
    delimiter,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    JSON.stringify(metadata),
    delimiter,
    `Content-Type: ${file.type || 'image/jpeg'}\r\n`,
    'Content-Transfer-Encoding: base64\r\n\r\n',
    arrayBufferToBase64(fileData),
    closeDelimiter
  ]);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,thumbnailLink,webViewLink,webContentLink,createdTime,size', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Google Drive Upload failed (${res.status})`);
  }

  const created = await res.json();
  const directUrl = `https://drive.google.com/thumbnail?id=${created.id}&sz=w2000`;

  // Make file readable for public storefront view
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${created.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    });
  } catch (permErr) {
    console.warn('Note: Could not set public permission on Drive file automatically:', permErr);
  }

  return {
    id: created.id,
    name: created.name,
    mimeType: created.mimeType,
    thumbnailUrl: created.thumbnailLink || directUrl,
    directUrl: directUrl,
    webViewLink: created.webViewLink,
    webContentLink: created.webContentLink,
    createdTime: created.createdTime || new Date().toISOString(),
    size: file.size
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
