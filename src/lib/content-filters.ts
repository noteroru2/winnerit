/**
 * กรองสถานะสำหรับ "รายการบนหน้าเว็บ" (Hub, รายการพื้นที่)
 * WPGraphQL / Pods บางชุดไม่ expose `status` → ถ้าเช็คแค่ === "publish" จะได้รายการว่างทั้งบล็อก
 */
export function isPublicListableStatus(status: unknown): boolean {
  const s = String(status ?? "").trim().toLowerCase();
  if (!s) return true;
  return s === "publish";
}
