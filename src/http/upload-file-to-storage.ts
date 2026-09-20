import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

interface UploadFileToStorageParams {
  file: File;
  onProgress: (sizeInBytes: number) => void;
}

interface uploadFileToStorageOpts {
  signal?: AbortSignal;
}

export async function uploadFileToStorage(
  { file, onProgress }: UploadFileToStorageParams,
  opts?: uploadFileToStorageOpts
) {
  const data = new FormData();

  data.append("file", file);

  const response = await axios.post<{ url: string }>(
    `${apiUrl}/uploads`,
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      signal: opts?.signal,
      onUploadProgress(progressEvent) {
        onProgress(progressEvent.loaded);
      },
    }
  );

  return { url: response.data.url };
}