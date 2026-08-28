const fs = require('fs');
async function main() {
  const username = process.env.GH_USERNAME, token = process.env.GH_TOKEN;
  if (!username || !token) throw new Error('GH_USERNAME and GH_TOKEN are required');
  const query = `query($login: String!, $from: DateTime!, $to: DateTime!) { user(login: $login) { followers { totalCount } repositories(first: 100, privacy: PUBLIC) { totalCount nodes { stargazerCount } } contributionsCollection(from: $from, to: $to) { totalCommitContributions contributionCalendar { totalContributions weeks { contributionDays { contributionCount color } } } } } }`;
  const to = new Date(), from = new Date(to); from.setUTCFullYear(to.getUTCFullYear() - 1);
  const res = await fetch('https://api.github.com/graphql', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables: { login: username, from: from.toISOString(), to: to.toISOString() } }) });
  const body = await res.json(); if (!res.ok || body.errors || !body.data?.user) throw new Error(`GitHub GraphQL failed (${res.status}): ${body.errors?.map(e => e.message).join('; ') || JSON.stringify(body)}`);
  const u = body.data.user, cal = u.contributionsCollection.contributionCalendar, total = cal.totalContributions, commits = u.contributionsCollection.totalCommitContributions;
  const stars = u.repositories.nodes.reduce((sum, repo) => sum + repo.stargazerCount, 0), labels = ['COMMITS', 'REPOS', 'STARS', 'CONTRIBUTED', 'FOLLOWERS'], values = [commits, u.repositories.totalCount, stars, total, u.followers.totalCount];
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 300" width="760" height="300"><text x="18" y="27" fill="#4ade80" font-family="monospace" font-size="12">● GITHUB / @${username}</text><text x="18" y="70" fill="#f1f5f9" font-family="sans-serif" font-size="29" font-weight="bold">${username}</text><text x="18" y="92" fill="#cbd5e1" font-family="sans-serif" font-size="14">Developer · Open-source builder</text><path stroke="#26303b" d="M18 113h724"/>`;
  labels.forEach((label, i) => { const x = 18 + i * 145; svg += `<text x="${x}" y="145" fill="#cbd5e1" font-family="monospace" font-size="11">${label}</text><text x="${x}" y="175" fill="#f1f5f9" font-family="monospace" font-size="25">${values[i]}</text>`; });
  svg += '<path stroke="#26303b" d="M18 190h724"/><text x="18" y="211" fill="#94a3b8" font-family="monospace" font-size="11">CONTRIBUTIONS</text><text x="742" y="211" text-anchor="end" fill="#f1f5f9" font-family="monospace" font-size="12">' + total + ' IN THE LAST YEAR</text>';
  cal.weeks.flatMap(w => w.contributionDays).slice(-365).forEach((d, i) => { const x = 18 + Math.floor(i / 7) * 13, y = 220 + (i % 7) * 10; svg += `<rect x="${x}" y="${y}" width="10" height="8" rx="1" fill="${d.contributionCount ? d.color : '#1b2430'}"/>`; });
  fs.writeFileSync('stats.svg', svg + `<path stroke="#26303b" d="M18 298h724"/><text x="18" y="294" fill="#94a3b8" font-family="monospace" font-size="10">github.com/${username}</text></svg>`);
  console.log(`Updated stats for ${username}: ${total} contributions, ${commits} commits this year, ${stars} stars`);
}
main().catch(e => { console.error(e); process.exit(1); });
