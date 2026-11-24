import { loadSupportDesk } from "@/lib/support-team";
import { SupportDesk } from "./support-desk";

/** Server: shu o'qituvchiga biriktirilgan guruhlar bo'lsa — support stolini ko'rsatadi, bo'lmasa hech narsa. */
export async function SupportDeskSection({ supportId, name }: { supportId: string; name: string }) {
  const data = await loadSupportDesk(supportId).catch(() => null);
  if (!data) return null;
  return <SupportDesk data={data} name={name} now={data.now} />;
}
