const fs = require('fs');
async function main() {
  const username = process.env.GH_USERNAME, token = process.env.GH_TOKEN;
  const query = `query { user(login: "${username}") { followers { totalCount } following { totalCount } repositories(privacy: PUBLIC) { totalCount } contributionsCollection { totalCommitContributions contributionCalendar { totalContributions weeks { contributionDays { date contributionCount color } } } } } }`;
  const res = await fetch('https://api.github.com/graphql', { method: 'POST', headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
  if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
  const body = await res.json(); if (body.errors) throw new Error(body.errors[0].message);
  const u = body.data.user, calendar = u.contributionsCollection.contributionCalendar;
  const commits = u.contributionsCollection.totalCommitContributions, total = calendar.totalContributions;
  const labels = ['Contributions', 'Year commits', 'Repositories', 'Followers', 'Following'];
  const values = [total, commits, u.repositories.totalCount, u.followers.totalCount, u.following.totalCount];
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 190" width="520" height="190"><rect width="520" height="190" rx="12" fill="#1a1b26"/><text x="24" y="30" fill="#bb9af7" font-family="sans-serif" font-size="16" font-weight="bold">${username} · GitHub activity</text>`;
  labels.forEach((label, i) => { const x = [24, 135, 246, 359, 445][i]; svg += `<text x="${x}" y="65" fill="#a9b1d6" font-family="sans-serif" font-size="14">${label}</text><text x="${x}" y="92" fill="#7aa2f7" font-family="monospace" font-size="20" font-weight="bold">${values[i]}</text>`; });
  svg += '<text x="24" y="122" fill="#a9b1d6" font-family="sans-serif" font-size="13">Contributions in the last year</text>';
  const days = calendar.weeks.flatMap(w => w.contributionDays).slice(-365);
  days.forEach((d, i) => { const x = 24 + Math.floor(i / 7) * 9, y = 134 + (i % 7) * 7; svg += `<rect x="${x}" y="${y}" width="6" height="6" rx="1" fill="${d.contributionCount ? d.color : '#292e42'}"/>`; });
  fs.writeFileSync('stats.svg', svg + '</svg>'); console.log(`Updated stats for ${username}: ${total} contributions, ${commits} commits this year`);
}
main().catch(e => { console.error(e); process.exit(1); });
