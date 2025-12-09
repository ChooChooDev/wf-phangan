import LanguageSwitcher from "@/components/LanguageSwitcher";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

async function getStats() {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalResult, todayResult, failedResult] = await Promise.all([
    supabase
      .from("member_submissions")
      .select("count", { count: "exact", head: true }),
    supabase
      .from("member_submissions")
      .select("count", { count: "exact", head: true })
      .gte("created_at", today.toISOString()),
    supabase
      .from("member_submissions")
      .select("count", { count: "exact", head: true })
      .eq("status", "storehub_failed"),
  ]);

  return {
    total: totalResult.count || 0,
    today: todayResult.count || 0,
    failed: failedResult.count || 0,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const stats = await getStats();
  const cookieStore = await cookies();
  const currentLocale = cookieStore.get("NEXT_LOCALE")?.value || "en";

  async function handleLogout() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentLocale === "th"
                ? "ลงทะเบียนสมาชิก"
                : "Member Registration"}
            </h1>
            <div className="flex items-center gap-4">
              <LanguageSwitcher currentLocale={currentLocale} />
              <form action={handleLogout}>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
                >
                  {currentLocale === "th" ? "ออกจากระบบ" : "Logout"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            {currentLocale === "th" ? "ยินดีต้อนรับ" : "Welcome"}, {user.email}
          </h2>
          <p className="text-gray-600">
            {currentLocale === "th"
              ? "เลือกการดำเนินการด้านล่าง"
              : "Select an action below"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">
              {currentLocale === "th" ? "สมาชิกทั้งหมด" : "Total Members"}
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.total}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">
              {currentLocale === "th"
                ? "ลงทะเบียนวันนี้"
                : "Today's Registrations"}
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {stats.today}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">
              {currentLocale === "th"
                ? "การส่งที่ล้มเหลว"
                : "Failed Submissions"}
            </div>
            <div className="text-3xl font-bold text-red-600">
              {stats.failed}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Link href="/register">
            <div className="bg-blue-600 hover:bg-blue-700 transition rounded-lg shadow-lg p-8 text-white cursor-pointer">
              <div className="text-2xl font-bold mb-2">
                {currentLocale === "th" ? "ลงทะเบียนใหม่" : "New Registration"}
              </div>
              <div className="text-blue-100">
                {currentLocale === "th"
                  ? "ลงทะเบียนสมาชิกใหม่"
                  : "Register a new member"}
              </div>
            </div>
          </Link>
          <div className="flex flex-row gap-6 w-full justify-between">
            <Link href="/failed">
              <div className="bg-red-600 hover:bg-red-700 transition rounded-lg shadow-lg p-8 text-white cursor-pointer w-full ">
                <div className="text-2xl font-bold mb-2">
                  {currentLocale === "th"
                    ? "จัดการการส่งที่ล้มเหลว"
                    : "Manage Failed"}
                </div>
                <div className="text-red-100">
                  {currentLocale === "th"
                    ? "ลองใหม่หรือยกเลิกการส่งที่ล้มเหลว"
                    : "Retry or cancel failed submissions"}
                </div>
              </div>
            </Link>

            <Link href="/logs">
              <div className="bg-white hover:bg-gray-50 transition rounded-lg shadow-lg p-8 border-2 border-gray-200 cursor-pointer w-full">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {currentLocale === "th" ? "ดูบันทึก" : "View Logs"}
                </div>
                <div className="text-gray-600">
                  {currentLocale === "th"
                    ? "ดูบันทึกการเรียก API"
                    : "View API call logs"}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
