export type StorageFolder = 'profiles' | 'students' | 'schoolchat' | 'communication' | 'documents' | 'schools';

export type UploadFileOptions = {
  fileName: string;
  contentType: string;
  size: number;
  ownerId: string;
  folder: StorageFolder;
  fileBuffer?: Buffer;
};

export type StoredFileMetadata = {
  id: string;
  key: string;
  url: string;
  fileName: string;
  contentType: string;
  size: number;
  folder: StorageFolder;
  ownerId: string;
  createdAt: string;
};

export interface StorageProvider {
  upload(options: UploadFileOptions): Promise<StoredFileMetadata>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}

class S3CompatibleStorage implements StorageProvider {
  async upload(options: UploadFileOptions): Promise<StoredFileMetadata> {
    if (!process.env.S3_BUCKET || !process.env.S3_ENDPOINT) {
      throw new Error('S3 storage is not configured. Set S3_BUCKET and S3_ENDPOINT in your environment variables.');
    }

    const key = `${options.folder}/${options.ownerId}/${options.fileName}`;

    return {
      id: cryptoRandomId(),
      key,
      url: `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`,
      fileName: options.fileName,
      contentType: options.contentType,
      size: options.size,
      folder: options.folder,
      ownerId: options.ownerId,
      createdAt: new Date().toISOString()
    };
  }

  async delete(_key: string): Promise<void> {
    return;
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    if (!process.env.S3_BUCKET || !process.env.S3_ENDPOINT) {
      throw new Error('S3 storage is not configured.');
    }

    return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}?expires=${expiresInSeconds}`;
  }
}

function cryptoRandomId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const storage: StorageProvider = new S3CompatibleStorage();

export async function uploadUserFile(options: UploadFileOptions): Promise<StoredFileMetadata> {
  return storage.upload(options);
}
