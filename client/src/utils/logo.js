let cachedLogoDataUrl = null;
let cachedLogoBytes = null;

export async function loadVjtiLogoDataUrl() {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;

  const response = await fetch("/vjtiLogo.png");
  const blob = await response.blob();

  cachedLogoDataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  return cachedLogoDataUrl;
}

export async function loadVjtiLogoBytes() {
  if (cachedLogoBytes) return cachedLogoBytes;

  const response = await fetch("/vjtiLogo.png");
  cachedLogoBytes = new Uint8Array(await response.arrayBuffer());
  return cachedLogoBytes;
}

export async function addVjtiLogoToPdf(doc, options = {}) {
  try {
    const logo = await loadVjtiLogoDataUrl();
    const { x = 42, y = 28, width = 42, height = 42 } = options;
    doc.addImage(logo, "PNG", x, y, width, height);
  } catch (err) {
    console.error("Unable to add VJTI logo", err);
  }
}
