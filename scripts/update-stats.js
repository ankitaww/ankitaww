const fs = require('fs');
async function main() {
  const username = process.env.GH_USERNAME, token = process.env.GH_TOKEN;
  if (!username || !token) throw new Error('GH_USERNAME and GH_TOKEN are required');
  const query = `query($login: String!, $from: DateTime!, $to: DateTime!) { user(login: $login) { followers { totalCount } following { totalCount } repositories(privacy: PUBLIC) { totalCount } contributionsCollection(from: $from, to: $to) { totalCommitContributions contributionCalendar { totalContributions weeks { contributionDays { date contributionCount color } } } } } }`;
  const to = new Date(), from = new Date(to); from.setUTCFullYear(to.getUTCFullYear() - 1);
  const res = await fetch('https://api.github.com/graphql', { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables: { login: username, from: from.toISOString(), to: to.toISOString() } }) });
  const body = await res.json();
  if (!res.ok || body.errors || !body.data?.user) throw new Error(`GitHub GraphQL failed (${res.status}): ${body.errors?.map(e => e.message).join('; ') || JSON.stringify(body)}`);
  const u = body.data.user, calendar = u.contributionsCollection.contributionCalendar;
  const commits = u.contributionsCollection.totalCommitContributions, total = calendar.totalContributions;
  const labels = ['Contributions', 'Year commits', 'Repositories', 'Followers', 'Following'];
  const values = [total, commits, u.repositories.totalCount, u.followers.totalCount, u.following.totalCount];
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 205" width="560" height="205"><text x="24" y="30" fill="#bb9af7" font-family="sans-serif" font-size="16" font-weight="bold">${username} · GitHub activity</text>`;
  labels.forEach((label, i) => { const x = [24, 135, 246, 359, 445][i]; svg += `<text x="${x}" y="65" fill="#a9b1d6" font-family="sans-serif" font-size="14">${label}</text><text x="${x}" y="92" fill="#7aa2f7" font-family="monospace" font-size="20" font-weight="bold">${values[i]}</text>`; });
  svg += '<text x="24" y="122" fill="#a9b1d6" font-family="sans-serif" font-size="13">Contributions in the last year</text>';
  const days = calendar.weeks.flatMap(w => w.contributionDays).slice(-365);
  days.forEach((d, i) => { const x = 24 + Math.floor(i / 7) * 10, y = 134 + (i % 7) * 9; svg += `<rect x="${x}" y="${y}" width="8" height="8" rx="1" fill="${d.contributionCount ? d.color : '#292e42'}"/>`; });
  fs.writeFileSync('stats.svg', svg + '</svg>'); console.log(`Updated stats for ${username}: ${total} contributions, ${commits} commits this year`);
}
main().catch(e => { console.error(e); process.exit(1); });
