const fs = require('fs');
async function main() {
  const username = process.env.GH_USERNAME, token = process.env.GH_TOKEN;
  if (!username || !token) throw new Error('GH_USERNAME and GH_TOKEN are required');
  const query = `query($login: String!, $from: DateTime!, $to: DateTime!) { user(login: $login) { followers { totalCount } repositories(first: 100, privacy: PUBLIC) { totalCount nodes { stargazerCount } } contributionsCollection(from: $from, to: $to) { totalCommitContributions contributionCalendar { totalContributions weeks { contributionDays { contributionCount color } } } } } }`;
  const to = new Date(), from = new Date(to); from.setUTCFullYear(to.getUTCFullYear() - 1);
  const res = await fetch('https://api.github.com/graphql', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables: { login: username, from: from.toISOString(), to: to.toISOString() } }) });
  const body = await res.json(); if (!res.ok || body.errors || !body.data?.user) throw new Error(`GitHub GraphQL failed (${res.status}): ${body.errors?.map(e => e.message).join('; ') || JSON.stringify(body)}`);
  const u = body.data.user, cal = u.contributionsCollection.contributionCalendar, total = cal.totalContributions, commits = u.contributionsCollection.totalCommitContributions, stars = u.repositories.nodes.reduce((sum, repo) => sum + repo.stargazerCount, 0);
  const labels = ['Commits', 'Repos', 'Stars', 'Contributed', 'Followers'], values = [commits, u.repositories.totalCount, stars, total, u.followers.totalCount];
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 205" width="560" height="205"><rect width="560" height="205" rx="12" fill="#1b1b2b"/><text x="24" y="30" fill="#a78bfa" font-family="sans-serif" font-size="16" font-weight="bold">${username} · GitHub activity</text>`;
  labels.forEach((label, i) => { const x = [24, 135, 246, 359, 470][i]; svg += `<text x="${x}" y="65" fill="#a9b1d6" font-family="sans-serif" font-size="13">${label}</text><text x="${x}" y="92" fill="#60a5fa" font-family="monospace" font-size="20" font-weight="bold">${values[i]}</text>`; });
  svg += '<text x="24" y="122" fill="#93c5fd" font-family="sans-serif" font-size="13">Contributions in the last year</text>';
  cal.weeks.flatMap(w => w.contributionDays).slice(-365).forEach((d, i) => { const x = 24 + Math.floor(i / 7) * 10, y = 134 + (i % 7) * 9; svg += `<rect x="${x}" y="${y}" width="8" height="8" rx="1" fill="${d.contributionCount ? d.color : '#303047'}"/>`; });
  fs.writeFileSync('stats.svg', svg + '</svg>'); console.log(`Updated stats for ${username}: ${total} contributions, ${commits} commits, ${stars} stars`);
}
main().catch(e => { console.error(e); process.exit(1); });
