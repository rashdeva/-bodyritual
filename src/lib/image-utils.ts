export function shouldUnoptimizeImage(src: string | null | undefined) {
  if (!src) {
    return false;
  }

  return src.includes("api.dicebear.com") || src.endsWith(".svg");
}
