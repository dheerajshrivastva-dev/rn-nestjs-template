# Upload Module

File upload with Cloudinary as the storage backend. Provider is swappable via a standard interface.

## Endpoints

| Method | Path | Content-Type | Description |
|---|---|---|---|
| `POST` | `/upload/profile` | `multipart/form-data` | Upload profile image (max 5 MB) |
| `POST` | `/upload/document` | `multipart/form-data` | Upload a document (max 10 MB) |

Both endpoints return `{ url, publicId, provider }`. Pass these to the relevant update endpoint (`PATCH /users/me`, etc.) to persist the URL to the database.

## Profile Upload

Fields:
- `file` — image file (jpg/png/webp)
- `entityId` — user or entity ID (defaults to current user if omitted)
- `oldPublicId` — Cloudinary publicId to delete (omit on first upload)

## Document Upload

Fields:
- `file` — document file (jpg/png/webp/pdf)
- `clientId` — entity the document belongs to
- `docType` — one of `aadhar1` | `aadhar2` | `selfie` (extend as needed)
- `oldPublicId` — Cloudinary publicId to delete on replace

## Cloudinary Setup

```env
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
MAX_FILE_SIZE_MB=10
```

## Storage Provider Interface

```typescript
export interface IStorageProvider {
  upload(buffer: Buffer, folder: string, filename: string): Promise<UploadResult>;
  delete(publicId: string): Promise<void>;
}

export interface UploadResult {
  url: string;
  publicId: string;
  provider: 'cloudinary';
}
```

To add a new provider (S3, MinIO, etc.):
1. Implement `IStorageProvider`
2. Register it in `upload.module.ts` with the `STORAGE_PROVIDER` token
3. Update the `provider` field in `UploadResult` if needed
