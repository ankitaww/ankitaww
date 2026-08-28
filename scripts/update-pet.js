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
  fs.copyFileSync(`states/${mood}.svg`, 'pet.svg');
  console.log(`Mood: ${mood} (today: ${today}, 7d: ${last7})`);
}
main().catch(e => { console.error(e); process.exit(1); });
