import LanguageSwitcher from "@/components/LanguageSwitcher";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

async function getLogs() {
  const supabase = await createClient();

  const { data: logs, error } = await (supabase
    .from("api_logs")
    .select(
      `
      *,
      member_submissions (
        full_name
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(50) as any);

  if (error) {
    console.error("Error fetching logs:", error);
    return [];
  }

  return (logs || []) as any[];
}

export default async function LogsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const logs = await getLogs();
  const cookieStore = await cookies();
  const currentLocale = cookieStore.get("NEXT_LOCALE")?.value || "en";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentLocale === "th" ? "บันทึก API" : "API Logs"}
            </h1>
            <div className="flex items-center gap-4">
              <LanguageSwitcher currentLocale={currentLocale} />
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
              >
                {currentLocale === "th" ? "กลับหน้าหลัก" : "Back to Dashboard"}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {currentLocale === "th" ? "ไม่พบบันทึก" : "No logs found"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLocale === "th" ? "เวลา" : "Time"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLocale === "th" ? "ชื่อ" : "Name"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLocale === "th" ? "รหัสอ้างอิง" : "Ref ID"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLocale === "th" ? "ประเภท" : "Type"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLocale === "th" ? "สถานะ" : "Status"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLocale === "th" ? "รหัสตอบกลับ" : "Response"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLocale === "th" ? "ระยะเวลา" : "Duration"}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.created_at).toLocaleString(
                          currentLocale === "th" ? "th-TH" : "en-US"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.member_submissions?.full_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {log.ref_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            log.request_type === "create"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {log.request_type === "create"
                            ? currentLocale === "th"
                              ? "สร้าง"
                              : "Create"
                            : currentLocale === "th"
                            ? "ลองใหม่"
                            : "Retry"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            log.success
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {log.success
                            ? currentLocale === "th"
                              ? "สำเร็จ"
                              : "Success"
                            : currentLocale === "th"
                            ? "ล้มเหลว"
                            : "Failed"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.response_status || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {log.duration_ms ? `${log.duration_ms}ms` : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {logs.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            {currentLocale === "th"
              ? `แสดง ${logs.length} รายการล่าสุด`
              : `Showing last ${logs.length} entries`}
          </div>
        )}
      </main>
    </div>
  );
}
