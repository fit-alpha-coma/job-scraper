import { NextResponse } from 'next/server';
import { scrapeJobs } from 'ts-jobspy';

const searchTerms = [
  'Software engineer',
  'Frontend developer',
  'Backend developer',
  'Fullstack developer',
  'AI engineer',
  'Machine learning engineer',
  'Cloud engineer',
];

async function scrape(searchTerm: string) {
  const jobs = await scrapeJobs({
    siteName: ['indeed', 'linkedin'], // Only these two are currently working
    searchTerm,
    location: 'Philippines',
    countryIndeed: 'philippines', // Required for Indeed - supports 60+ countries with autocomplete
    hoursOld: 24,
  });

  // Export to JSON
  await jobs.toJson('jobs.json', { pretty: true });
}

// deduplicate overall jobs
function deduplicateJobs(jobs: any[]) {
  const seen = new Set();
  const deduped = [];
  for (const job of jobs) {
    const identifier = job.id || job.jobUrl;
    if (!seen.has(identifier)) {
      seen.add(identifier);
      deduped.push(job);
    }
  }
  return deduped;
}
// get current date in yyyy-mm-dd format
function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
import { writeFileSync } from 'fs';
export async function GET() {
  let allJobs: any[] = [];
  for (const term of searchTerms) {
    const jobs = await scrapeJobs({
      siteName: ['indeed', 'linkedin'],
      searchTerm: term,
      location: 'Philippines',
      countryIndeed: 'philippines',
      hoursOld: 24,
    });
    allJobs = allJobs.concat(jobs.toArray());
  }
  const dedupedJobs = deduplicateJobs(allJobs);
  // add platform property based on id prefix
  dedupedJobs.forEach((job) => {
    if (job.id.startsWith('in')) {
      job.platform = 'Indeed';
    } else if (job.id.startsWith('li')) {
      job.platform = 'LinkedIn';
    } else {
      job.platform = 'Unknown';
    }
  });
  // save to public/jobs/yyyy-mm-dd.json
  writeFileSync(`public/jobs/${getCurrentDate()}.json`, JSON.stringify(dedupedJobs, null, 2));
  return NextResponse.json({ message: 'Scraping completed', totalJobs: dedupedJobs.length });
}