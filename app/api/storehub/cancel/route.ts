import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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

    // Only allow cancelling failed submissions
    if (record.status !== 'storehub_failed') {
      return NextResponse.json({
        success: false,
        error: 'Can only cancel failed submissions'
      }, { status: 400 });
    }

    // Update status to cancelled
    const { error: updateError } = await (supabase.from('member_submissions') as any)
      .update({
        status: 'cancelled',
        storehub_error: 'Manually cancelled by staff',
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to cancel submission',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Submission cancelled successfully'
    });
  } catch (error: any) {
    console.error('Cancel submission error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

