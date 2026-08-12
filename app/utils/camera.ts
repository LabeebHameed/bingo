export async function checkCameraPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!navigator.permissions || !navigator.permissions.query) {
    return 'prompt';
  }
  try {
    const res = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return res.state;
  } catch (e) {
    return 'prompt';
  }
}

export async function startCamera(
  videoEl: HTMLVideoElement,
  facingMode: 'user' | 'environment' = 'user'
): Promise<MediaStream> {
  if (videoEl.srcObject) {
    stopCamera(videoEl.srcObject as MediaStream);
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
  videoEl.srcObject = stream;
  await videoEl.play();
  return stream;
}

export function stopCamera(stream: MediaStream | null): void {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}

export async function captureFrame(videoEl: HTMLVideoElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('No canvas context'));
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob'));
    }, 'image/jpeg', 0.85);
  });
}
