import { corsHeaders } from '../shared/cors.ts';
import { getAuthClient, getServiceClient } from '../shared/auth.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authClient = getAuthClient(request.headers.get('Authorization'));
    const serviceClient = getServiceClient();
    const { data: userResult, error: userError } = await authClient.auth.getUser();

    if (userError || !userResult.user) {
      return Response.json({ error: 'unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json();
    const sessionId = body?.sessionId as string | undefined;
    const clientDurationSeconds = Number(body?.clientDurationSeconds ?? 0);

    if (!sessionId) {
      return Response.json({ error: 'sessionId_required' }, { status: 400, headers: corsHeaders });
    }

    const { data, error } = await serviceClient.rpc('private_finish_workout_session', {
      p_user_id: userResult.user.id,
      p_session_id: sessionId,
      p_client_duration_seconds: clientDurationSeconds,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400, headers: corsHeaders });
    }

    const payload = Array.isArray(data) ? data[0] : data;

    return Response.json(
      {
        sessionId: payload.session_id,
        confirmedXp: payload.confirmed_xp,
        confirmedSeconds: payload.confirmed_seconds,
        xpTotal: payload.xp_total,
        level: payload.level,
        dailyRank: payload.daily_rank,
        weeklyRank: payload.weekly_rank,
        endedAt: payload.ended_at,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'unexpected_error' },
      { status: 500, headers: corsHeaders }
    );
  }
});
