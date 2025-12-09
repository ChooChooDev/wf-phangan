import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { STOREHUB_TAG } from '@/lib/constants';

/**
 * DEPRECATED: This endpoint is no longer used for automatic retries.
 * Staff should use the /failed page to manually retry or cancel failed submissions.
 * Keeping this endpoint for backward compatibility or manual triggering if needed.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServiceClient();

    const { data: failedSubmissions, error: fetchError } = await (supabase
      .from('member_submissions')
      .select('*')
      .eq('status', 'storehub_failed' as any)
      .lt('retry_count', 5)
      .order('created_at', { ascending: true })
      .limit(10) as any);

    if (fetchError || !failedSubmissions || failedSubmissions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No failed submissions to retry',
        retried: 0,
      });
    }

    const results = {
      total: failedSubmissions.length,
      success: 0,
      failed: 0,
    };

    for (const submission of failedSubmissions) {
      const startTime = Date.now();
      const record = submission as any;

      try {
        const storeHubPayload = {
          refId: record.ref_id,
          firstName: record.first_name,
          lastName: record.last_name,
          address1: record.passport_number,
          state: record.nationality,
          birthday: record.date_of_birth,
          tags: [STOREHUB_TAG],
        };

        // Create Basic Auth header using username:password from .env.local
        const authHeader = Buffer.from(
          `${process.env.STOREHUB_USERNAME}:${process.env.STOREHUB_PASSWORD}`
        ).toString('base64');

        // Send POST request to StoreHub API
        const storeHubResponse = await fetch('https://api.storehubhq.com/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${authHeader}`,
          },
          body: JSON.stringify(storeHubPayload),
        });

        const duration = Date.now() - startTime;
        const responseText = await storeHubResponse.text();
        let responseBody;

        try {
          responseBody = JSON.parse(responseText);
        } catch {
          responseBody = { raw: responseText };
        }

        const success = storeHubResponse.ok;

        await supabase.from('api_logs').insert({
          member_submission_id: record.id,
          ref_id: record.ref_id,
          request_type: 'retry',
          request_body: storeHubPayload,
          request_headers: { 'Content-Type': 'application/json' },
          response_status: storeHubResponse.status,
          response_body: responseBody,
          success,
          error_message: success ? null : responseText,
          duration_ms: duration,
          created_by: null,
        } as any);

        if (success) {
          await (supabase.from('member_submissions') as any)
            .update({
              status: 'success',
              storehub_synced_at: new Date().toISOString(),
              storehub_error: null,
              retry_count: record.retry_count + 1,
            })
            .eq('id', record.id);

          results.success++;
        } else {
          await (supabase.from('member_submissions') as any)
            .update({
              storehub_error: responseText,
              retry_count: record.retry_count + 1,
            })
            .eq('id', record.id);

          results.failed++;
        }
      } catch (error: any) {
        console.error(`Retry failed for submission ${record.id}:`, error);

        await (supabase.from('member_submissions') as any)
          .update({
            storehub_error: error.message,
            retry_count: record.retry_count + 1,
          })
          .eq('id', record.id);

        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Retried ${results.total} submissions`,
      results,
    });
  } catch (error: any) {
    console.error('Retry job error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  return POST(request);
}
