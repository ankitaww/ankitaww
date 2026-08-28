const fs = require('fs');
async function main() {
  const username = process.env.GH_USERNAME, token = process.env.GH_TOKEN;
  const query = `query { user(login: "${username}") { contributionsCollection { contributionCalendar { weeks { contributionDays { date contributionCount } } } } } }`;
  const res = await fetch('https://api.github.com/graphql', { method: 'POST', headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
  if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0].message);
  const days = data.data.user.contributionsCollection.contributionCalendar.weeks.flatMap(w => w.contributionDays);
  const today = days.at(-1).contributionCount, last3 = days.slice(-3).reduce((s, d) => s + d.contributionCount, 0), last7 = days.slice(-7).reduce((s, d) => s + d.contributionCount, 0);
  let mood = last7 === 0 ? 'sad' : today >= 10 ? 'excited' : today > 0 ? 'happy' : last3 === 0 ? 'sleepy' : 'sleepy';
  const hat = '<path fill="#ffcf56" d="M38 23h24l-5-18H43z"/><rect x="34" y="21" width="32" height="5" fill="#ff8c42"/>';
  let svg = fs.readFileSync(`states/${mood}.svg`, 'utf8');
  svg = svg.replace('<rect x="43" y="61" width="14" height="4"/>', '<path d="M43 61h4v3h6v-3h4v4h-4v3h-6v-3h-4z"/>');
  svg = svg.replace('<rect x="32" y="48" width="12" height="4"/>', '<rect x="32" y="49" width="12" height="3"/>');
  svg = svg.replace('<rect x="56" y="48" width="12" height="4"/>', '<rect x="56" y="49" width="12" height="3"/>');
  svg = svg.replace('</svg>', hat + '</svg>');
  fs.writeFileSync('pet.svg', svg);
  console.log(`Mood: ${mood} (today: ${today}, 7d: ${last7})`);
}
main().catch(e => { console.error(e); process.exit(1); });
