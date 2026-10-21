// "Who's Doing What": pure rendering logic for the Office tab (portraits with status badges + live activity feed).
// No DOM access: functions return HTML strings; tested in tests/dashboard/dashboard-team.test.js.
// Needs dashboard-sprites.js (renderSprite) loaded first.
const TEAM_GROUPS = [
  { key: 'leadership',  title: 'Leadership',  roles: ['lead', 'quant'] },
  { key: 'engineering', title: 'Engineering', roles: ['dev-python', 'dev-python-jr', 'dev-mql5', 'integrator'] },
  { key: 'quality',     title: 'Quality',     roles: ['test-unit', 'test-parity', 'qa', 'safety'] },
  { key: 'operations',  title: 'Operations',  roles: ['ops', 'deployer'] },
];
// Stage shown in the badge for an agent that holds an in-progress task.
const TEAM_STAGE = {
  'lead': 'coordinating', 'quant': 'researching', 'dev-python': 'building', 'dev-python-jr': 'building', 'dev-mql5': 'building',
  'integrator': 'merging', 'test-unit': 'verifying', 'test-parity': 'verifying',
  'qa': 'reviewing', 'safety': 'reviewing', 'ops': 'sweeping', 'deployer': 'deploying',
};
// Non-agent actors that may write activity rows (shown with a gear instead of a portrait).
const TEAM_SYSTEM_ACTORS = { watchdog: 'Watchdog', system: 'Runner' };

function teamEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
// API timestamps are UTC without a zone suffix; treat them as UTC.
function teamToMs(ts) {
  if (ts == null) return NaN;
  const s = String(ts);
  return Date.parse(/(Z|[+-]\d\d:?\d\d)$/i.test(s) ? s : s + 'Z');
}
function teamAgo(ms, nowMs) {
  if (!Number.isFinite(ms)) return '';
  const m = Math.max(0, Math.floor((nowMs - ms) / 60000));
  return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.floor(m / 60) + ' h ago' : Math.floor(m / 1440) + ' d ago';
}
// "Oct 10, 11:41 AM" (local time; tz is injectable for tests).
function teamClock(ms, tz) {
  if (!Number.isFinite(ms)) return '';
  const o = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
  if (tz) o.timeZone = tz;
  return new Date(ms).toLocaleString('en-US', o);
}

// Who an activity row belongs to: { kind:'agent'|'system'|'unknown', role, name }.
function teamActor(row, roster) {
  const a = String(row && row.agent || '');
  const hit = roster.find(r => r.role === a);
  if (hit) return { kind: 'agent', role: hit.role, name: hit.name };
  if (TEAM_SYSTEM_ACTORS[a]) return { kind: 'system', role: a, name: TEAM_SYSTEM_ACTORS[a] };
  return { kind: 'unknown', role: a, name: a || 'System' };
}
// Drop a duplicated leading actor name ("Frank assigned #3" under "Frank:") and cap very long legacy lines.
function teamFeedText(message, actorName) {
  let t = String(message == null ? '' : message).trim();
  if (actorName && t.toLowerCase().startsWith(actorName.toLowerCase() + ' ')) t = t.slice(actorName.length + 1);
  return t.length > 170 ? t.slice(0, 167) + '...' : t;
}

// roster: [{role,name,title}], tasks: /api/office/tasks, activity newest first, opts: { offline:boolean }.
// Returns { role -> { state, label, taskId, title, count } }; state drives the badge colour.
function teamStatus(roster, tasks, activity, opts) {
  const o = opts || {};
  const all = tasks || [];
  const inProg = all.filter(t => t.status === 'in_progress');
  const working = inProg.filter(t => t.active);
  const out = {};
  for (const a of roster) {
    const mine = a.role === 'lead' ? (!o.sprint ? [] : working.length ? working : [{ title: 'sprint running', taskId: null }]) : inProg.filter(t => t.active === a.role);
    const blocked = all.find(t => t.assignee === a.role && t.kind === 'ticket' && (t.status === 'waiting_human' || false));
    let s;
    if (o.offline) s = { state: 'offline', label: 'offline', count: mine.length };
    else if (mine.length) {
      let label = TEAM_STAGE[a.role] || 'working';
      if (a.role !== 'lead' && mine[0].stage === 'fixing review feedback') label = 'fixing';
      if (a.role !== 'lead' && !o.sprint) label = 'paused';
      const last = (activity || []).find(e => e.agent === a.role);
      s = { state: label, label, taskId: a.role === 'lead' ? null : mine[0].taskId,
            title: a.role === 'lead' ? (mine[0].taskId === null ? 'sprint running' : mine.length + ' task' + (mine.length > 1 ? 's' : '') + ' in flight') : mine[0].title, count: mine.length };
    } else if (blocked) s = { state: 'blocked', label: 'blocked', taskId: blocked.taskId, title: blocked.title, count: 1 };
    else s = { state: 'idle', label: 'idle', count: 0 };
    out[a.role] = s;
  }
  return out;
}

function teamBadge(st) {
  return '<span class="bdg bdg-' + teamEsc(st.state) + '">' + teamEsc(st.label) + '</span>';
}

function teamTile(a, st) {
  const busy = st.state !== 'idle' && st.state !== 'offline' && st.state !== 'blocked' ? ' busy' : '';
  return '<div class="tile' + busy + '" tabindex="0" data-role="' + teamEsc(a.role) + '">'
    + '<span class="pf">' + (typeof renderSprite === 'function' ? renderSprite(a.role) : '') + '</span>'
    + '<span class="tn">' + teamEsc(a.name) + '</span>'
    + teamBadge(st)
    + '<span class="tr">' + teamEsc(a.title.split(' · ')[0]) + '</span>'
    + '<span class="ti">' + teamEsc(st.taskId ? '#' + st.taskId : st.count > 1 ? st.count + ' tasks' : '') + '</span></div>';
}

// Hover popover card for one agent.
function renderAgentCard(a, st, activity, roster, nowMs, tz) {
  const mentions = new RegExp('\\b' + a.name + '\\b');
  const recent = (activity || []).filter(e => e.agent === a.role || mentions.test(String(e.message || ''))).slice(0, 3);
  return '<div class="pop-h"><span class="pf sm">' + renderSprite(a.role) + '</span><div><div class="pn-n">' + teamEsc(a.name) + ' ' + teamBadge(st) + '</div>'
    + '<div class="pn-s">' + teamEsc(a.title) + '</div></div></div>'
    + '<div class="pn-now">' + (st.taskId ? '<span class="tid">#' + teamEsc(st.taskId) + '</span> ' + teamEsc(st.title)
        : st.title ? teamEsc(st.title) : '<span class="dim">Nothing assigned</span>') + '</div>'
    + '<div class="pn-t">Recent</div>'
    + (recent.length ? recent.map(e => {
        const act = teamActor(e, roster);
        return '<div class="ev"><span class="dim">' + teamEsc(teamClock(teamToMs(e.ts), tz)) + '</span> ' + teamEsc(teamFeedText(e.message, act.name)) + '</div>';
      }).join('') : '<div class="dim">nothing recent</div>');
}

function renderFeed(roster, activity, tz, limit) {
  const rows = (activity || []).slice(0, limit || 30);
  if (!rows.length) return '<div class="dim fr-empty">No activity yet.</div>';
  return rows.map(e => {
    const act = teamActor(e, roster);
    const avatar = act.kind === 'agent'
      ? '<span class="pf xs">' + renderSprite(act.role) + '</span>'
      : '<span class="pf xs gear" title="' + teamEsc(act.name) + '">⚙</span>';
    return '<div class="fr"><span class="ft">' + teamEsc(teamClock(teamToMs(e.ts), tz)) + '</span>' + avatar
      + '<span class="fx"><b class="who-name">' + teamEsc(act.name) + ':</b> '
      + (e.taskId ? '<span class="tid">#' + teamEsc(e.taskId) + '</span> ' : '')
      + teamEsc(teamFeedText(e.message, act.name)) + '</span></div>';
  }).join('');
}

function renderTeamSection(roster, tasks, activity, opts, tz) {
  const status = teamStatus(roster, tasks, activity, opts);
  const byRole = {}; roster.forEach(a => { byRole[a.role] = a; });
  let left = '';
  for (const g of TEAM_GROUPS) {
    const tiles = g.roles.map(r => byRole[r]).filter(Boolean).map(a => teamTile(a, status[a.role])).join('');
    if (tiles) left += '<div class="grp"><h4>' + teamEsc(g.title) + '</h4><div class="tiles">' + tiles + '</div></div>';
  }
  const right = '<div class="feed-h">Activity</div><div class="feed">' + renderFeed(roster, activity, tz, 40) + '</div>';
  return '<div class="team"><div class="team-groups">' + left + '</div><div class="team-panel">' + right + '</div></div>';
}

if (typeof module !== 'undefined' && module.exports)
  module.exports = { TEAM_GROUPS, teamStatus, teamActor, teamFeedText, teamToMs, teamAgo, teamClock, renderAgentCard, renderFeed, renderTeamSection };
