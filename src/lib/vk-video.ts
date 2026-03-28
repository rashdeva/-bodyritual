function decodeHtmlEntities(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function decodeJsonString(value: string) {
  try {
    const parsed = JSON.parse(`"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`) as string;
    return decodeHtmlEntities(parsed);
  } catch {
    return decodeHtmlEntities(value.replace(/\\"/g, '"').replace(/\\\\/g, "\\").replace(/\\\//g, "/"));
  }
}

function normalizeEscapedUrl(value: string) {
  return value.replace(/\\\//g, "/");
}

export function parseVkVideoUrl(url: string) {
  const match = url.match(/video(-?\d+)_(\d+)/i);
  if (!match) {
    return null;
  }

  return {
    ownerId: Number(match[1]),
    videoId: Number(match[2]),
  };
}

export function buildVkVideoEmbedUrl(videoUrl: string) {
  const parsed = parseVkVideoUrl(videoUrl);
  if (!parsed) {
    return null;
  }

  return `https://vk.com/video_ext.php?oid=${parsed.ownerId}&id=${parsed.videoId}&hd=2`;
}

export async function fetchVkVideoMetadata(videoUrl: string) {
  const parsed = parseVkVideoUrl(videoUrl);
  if (!parsed) {
    throw new Error("Unsupported VK video URL.");
  }

  const embedUrl = `https://vk.com/video_ext.php?oid=${parsed.ownerId}&id=${parsed.videoId}&hd=2`;
  const response = await fetch(embedUrl, {
    headers: {
      "user-agent": "Mozilla/5.0",
      accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`VK metadata request failed with status ${response.status}.`);
  }

  const buffer = await response.arrayBuffer();
  const html = new TextDecoder("windows-1251").decode(buffer);

  const titleMatch = html.match(/"title":"((?:\\.|[^"])*)"/);
  const descriptionMatch = html.match(/"description":"((?:\\.|[^"])*)"/);
  const durationMatch = html.match(/"duration":(\d+)/);

  const imageMatches = Array.from(
    html.matchAll(/"url":"(https:\\\/\\\/[^"]+)","width":(\d+),"height":(\d+)/g),
  ).map((match) => ({
    url: normalizeEscapedUrl(match[1]),
    width: Number(match[2]),
    height: Number(match[3]),
  }));

  const preview = imageMatches.sort((a, b) => b.width * b.height - a.width * a.height)[0]?.url ?? null;

  const title = titleMatch ? decodeJsonString(titleMatch[1]) : "";
  const description = descriptionMatch ? decodeJsonString(descriptionMatch[1]) : "";
  const durationSec = durationMatch ? Number(durationMatch[1]) : 0;

  if (!title || !preview || !durationSec) {
    throw new Error("Failed to parse VK video metadata.");
  }

  return {
    title,
    description: description || null,
    thumbnailUrl: preview,
    durationSec,
  };
}
