/**
 * ฟังก์ชันช่วยสำหรับหมวดสินค้า
 * รับ shape { devicecategories: { nodes } } — แนะนำใช้ getCachedCategorySlugs() (first: 1000)
 * แทน Hub index ที่จำกัด devicecategories แค่ 300 รายการ
 * การกรอง site ทำที่หน้า page ผ่าน includeHubNodeForSite() (แบบ webuy-hub-v2)
 */
export function getCategoriesFromHub(data: any): { slug: string; name: string; count: number }[] {
  const nodes = data?.devicecategories?.nodes ?? [];
  return nodes
    .filter((n: any) => Boolean(n?.slug))
    .map((n: any) => ({
      slug: String(n.slug).trim(),
      name: String(n?.title || n?.name || n.slug).trim(),
      count: 0,
    }))
    .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));
}
