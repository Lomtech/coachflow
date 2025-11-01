const SUPABASE_URL = '__SUPABASE_URL__';
const SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentCoach = null;

(async function init() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) { window.location.href = 'login.html'; return; }
  
  const { data: coach } = await supabaseClient.from('coaches').select('*').eq('user_id', session.user.id).single();
  if (!coach) return;
  
  currentCoach = coach;
  await loadMembers();
})();

async function loadMembers() {
  const tbody = document.querySelector('#membersTable tbody');
  
  const { data: subs, error } = await supabaseClient
    .from('subscriptions')
    .select('*, packages(name)')
    .eq('coach_id', currentCoach.id)
    .order('created_at', { ascending: false });
  
  if (error || !subs || subs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Noch keine Mitglieder</td></tr>';
    return;
  }
  
  tbody.innerHTML = subs.map(sub => `
    <tr>
      <td>${sub.customer_name || 'N/A'}</td>
      <td>${sub.customer_email}</td>
      <td>${sub.packages?.name || 'N/A'}</td>
      <td><span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; background: ${sub.status === 'active' ? '#d1fae5' : '#fee2e2'}; color: ${sub.status === 'active' ? '#065f46' : '#991b1b'};">${sub.status}</span></td>
      <td>${new Date(sub.created_at).toLocaleDateString('de-DE')}</td>
    </tr>
  `).join('');
}