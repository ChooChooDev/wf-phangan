import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { STOREHUB_TAG } from '@/lib/constants';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { submissionId } = await request.json();

    if (!submissionId) {
      return NextResponse.json({ success: false, error: 'Missing submissionId' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Fetch the submission
    const { data: submission, error: fetchError } = await supabase
      .from('member_submissions')
      .select('*')
      .eq('id', submissionId)
      .maybeSingle();

    if (fetchError || !submission) {
      return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 });
    }

    const record = submission as any;

    // Only allow retry for failed submissions
    if (record.status !== 'storehub_failed') {
      return NextResponse.json({
        success: false,
        error: 'Can only retry failed submissions'
      }, { status: 400 });
    }

    // Update status to processing
    await (supabase.from('member_submissions') as any)
      .update({ status: 'processing' })
      .eq('id', submissionId);

    // Prepare StoreHub payload
    const storeHubPayload = {
      refId: record.ref_id,
      firstName: record.first_name,
      lastName: record.last_name,
      address1: record.passport_number,
      state: record.nationality,
      birthday: record.date_of_birth,
      tags: [STOREHUB_TAG],
    };

    // Create Basic Auth header
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

    // Log the API call
    await supabase.from('api_logs').insert({
      member_submission_id: submissionId,
      ref_id: record.ref_id,
      request_type: 'retry',
      request_body: storeHubPayload,
      request_headers: { 'Content-Type': 'application/json' },
      response_status: storeHubResponse.status,
      response_body: responseBody,
      success,
      error_message: success ? null : responseText,
      duration_ms: duration,
      created_by: record.created_by,
    } as any);

    // Update submission status
    if (success) {
      await (supabase.from('member_submissions') as any)
        .update({
          status: 'success',
          storehub_synced_at: new Date().toISOString(),
          storehub_error: null,
          retry_count: record.retry_count + 1,
        })
        .eq('id', submissionId);

      return NextResponse.json({ success: true, data: responseBody });
    } else {
      await (supabase.from('member_submissions') as any)
        .update({
          status: 'storehub_failed',
          storehub_error: responseText,
          retry_count: record.retry_count + 1,
        })
        .eq('id', submissionId);

      return NextResponse.json({
        success: false,
        error: `StoreHub API error: ${storeHubResponse.status}`,
        details: responseText,
      });
    }
  } catch (error: any) {
    console.error('Manual retry error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

