const fs = require('fs');
async function main() {
const owner = process.env.GITHUB_OWNER;
const token = process.env.GITHUB_TOKEN;
const today = new Date(); today.setUTCHours(0, 0, 0, 0);
const since = new Date(today); since.setUTCDate(since.getUTCDate() - 7);
const q = `author:${owner} committer-date:${since.toISOString().slice(0, 10)}..${new Date().toISOString().slice(0, 10)}`;
const res = await fetch(`https://api.github.com/search/commits?q=${encodeURIComponent(q)}&per_page=100`, {
  headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
});
if (!res.ok) throw new Error(`GitHub API: ${res.status} ${await res.text()}`);
const commits = (await res.json()).items || [];
const dates = commits.map(c => new Date(c.commit.author.date));
const todayCount = dates.filter(d => d >= today).length;
const lastCommit = dates.sort((a, b) => b - a)[0];
const daysIdle = lastCommit ? Math.floor((today - new Date(lastCommit).setUTCHours(0, 0, 0, 0)) / 864e5) : 99;
const mood = daysIdle >= 5 ? 'sad' : todayCount >= 6 ? 'excited' : todayCount ? 'happy' : daysIdle >= 2 ? 'sleepy' : 'sleepy';
fs.copyFileSync(`coding-pet/pet-${mood}.svg`, 'coding-pet/pet.svg');
console.log(`Coding Pet: ${mood} (${todayCount} commits today, ${daysIdle} idle days)`);
}
main().catch(error => { console.error(error); process.exit(1); });
