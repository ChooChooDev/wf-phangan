'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';

type FailedSubmission = {
  id: string;
  ref_id: string;
  passport_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  nationality: string;
  date_of_birth: string;
  status: string;
  storehub_error: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
};

export default function FailedSubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<FailedSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [currentLocale, setCurrentLocale] = useState('en');
  const [error, setError] = useState('');

  useEffect(() => {
    const locale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] || 'en';
    setCurrentLocale(locale);

    fetchFailedSubmissions();
  }, []);

  const fetchFailedSubmissions = async () => {
    try {
      const supabase = createClient();
      const { data: user } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('member_submissions')
        .select('*')
        .eq('status', 'storehub_failed')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching submissions:', error);
        setError('Failed to load submissions');
      } else {
        setSubmissions(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (submissionId: string) => {
    setProcessingId(submissionId);
    setError('');

    try {
      const response = await fetch('/api/storehub/manual-retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });

      const result = await response.json();

      if (result.success) {
        alert(currentLocale === 'th' ? 'ส่งสำเร็จ!' : 'Successfully sent to StoreHub!');
        await fetchFailedSubmissions(); // Refresh the list
      } else {
        alert(
          currentLocale === 'th'
            ? `เกิดข้อผิดพลาด: ${result.error}`
            : `Error: ${result.error}`
        );
      }
    } catch (err) {
      console.error('Retry error:', err);
      alert(currentLocale === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (submissionId: string) => {
    const confirmed = confirm(
      currentLocale === 'th'
        ? 'คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการส่งนี้?'
        : 'Are you sure you want to cancel this submission?'
    );

    if (!confirmed) return;

    setProcessingId(submissionId);
    setError('');

    try {
      const response = await fetch('/api/storehub/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });

      const result = await response.json();

      if (result.success) {
        alert(currentLocale === 'th' ? 'ยกเลิกสำเร็จ' : 'Successfully cancelled');
        await fetchFailedSubmissions(); // Refresh the list
      } else {
        alert(
          currentLocale === 'th'
            ? `เกิดข้อผิดพลาด: ${result.error}`
            : `Error: ${result.error}`
        );
      }
    } catch (err) {
      console.error('Cancel error:', err);
      alert(currentLocale === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentLocale === 'th' ? 'การส่งที่ล้มเหลว' : 'Failed Submissions'}
            </h1>
            <div className="flex items-center gap-4">
              <LanguageSwitcher currentLocale={currentLocale} />
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
              >
                {currentLocale === 'th' ? 'กลับหน้าหลัก' : 'Back to Dashboard'}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {currentLocale === 'th' ? 'กำลังโหลด...' : 'Loading...'}
              </p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {currentLocale === 'th'
                  ? 'ไม่มีการส่งที่ล้มเหลว'
                  : 'No failed submissions'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLocale === 'th' ? 'รหัสอ้างอิง' : 'Ref ID'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLocale === 'th' ? 'ชื่อ' : 'Name'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLocale === 'th' ? 'หนังสือเดินทาง' : 'Passport'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLocale === 'th' ? 'ความพยายาม' : 'Attempts'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLocale === 'th' ? 'ข้อผิดพลาด' : 'Error'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLocale === 'th' ? 'อัปเดตล่าสุด' : 'Last Updated'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLocale === 'th' ? 'การดำเนินการ' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {submission.ref_id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {submission.passport_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission.retry_count}
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600 max-w-xs truncate">
                        {submission.storehub_error || 'Unknown error'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(submission.updated_at).toLocaleString(
                          currentLocale === 'th' ? 'th-TH' : 'en-GB'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleRetry(submission.id)}
                          disabled={processingId === submission.id}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingId === submission.id
                            ? (currentLocale === 'th' ? 'กำลังดำเนินการ...' : 'Processing...')
                            : (currentLocale === 'th' ? 'ลองใหม่' : 'Retry')}
                        </button>
                        <button
                          onClick={() => handleCancel(submission.id)}
                          disabled={processingId === submission.id}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {currentLocale === 'th' ? 'ยกเลิก' : 'Cancel'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {submissions.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            {currentLocale === 'th'
              ? `แสดง ${submissions.length} รายการที่ล้มเหลว`
              : `Showing ${submissions.length} failed submission${submissions.length !== 1 ? 's' : ''}`}
          </div>
        )}
      </main>
    </div>
  );
}

