import { prisma } from '../../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId, plan } = await request.json();
    if (!userId || !plan) {
      return new Response(JSON.stringify({ error: 'Missing userId or plan' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { runningGoal: plan },
    });
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Error updating plan:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
