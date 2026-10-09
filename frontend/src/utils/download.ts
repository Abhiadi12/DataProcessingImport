// INFO: Makes the browser save the file behind `url`.
//
// Used with presigned storage links: the link's own Content-Disposition header
// tells the browser to download rather than display it, and under what name.
// The browser streams it to disk, so the file never sits in this page's
// memory, however large.
export function triggerDownload(url: string, filename: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
