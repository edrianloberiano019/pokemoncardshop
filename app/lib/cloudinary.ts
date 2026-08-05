export function toJpgUrl(url: string): string {
  return url.replace("/upload/", "/upload/f_jpg,q_auto/");
}
