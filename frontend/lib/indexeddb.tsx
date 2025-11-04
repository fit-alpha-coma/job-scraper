export interface JobApplication {
  id: string
  title: string
  description?: string
  companyName: string
  companyUrl?: string
  companyUrlDirect?: string
  location: {
    city?: string
    state?: string
    country?: string
  }
  jobType?: string
  compensation?: {
    interval?: string
    minAmount?: number
    maxAmount?: number
    currency?: string
  }
  datePosted: string
  jobUrl: string
  jobUrlDirect?: string
  isRemote?: boolean
  companyAddresses?: string
  companyIndustry?: string
  companyNumEmployees?: string
  companyRevenue?: string
  companyDescription?: string
  companyLogo?: string
  platform: string
  starred: boolean
  applied: boolean
}

const DB_NAME = "jobmaxx-db"
const DB_VERSION = 2
const STORE_NAME = "jobs-by-day"

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "dayKey" })
        objectStore.createIndex("dayKey", "dayKey", { unique: true })
      }
    }
  })
}

export function getDayKey(dateString: string): string {
  return dateString.split("T")[0]
}

export async function saveJobsForDay(dayKey: string, jobs: JobApplication[]): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put({ dayKey, jobs })

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getJobsForDay(dayKey: string): Promise<JobApplication[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(dayKey)

    request.onsuccess = () => {
      const result = request.result
      resolve(result ? result.jobs : [])
    }
    request.onerror = () => reject(request.error)
  })
}

export async function getAllDayKeys(): Promise<string[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAllKeys()

    request.onsuccess = () => {
      const keys = request.result as string[]
      keys.sort((a, b) => b.localeCompare(a))
      resolve(keys)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function updateJob(job: JobApplication): Promise<void> {
  const dayKey = getDayKey(job.datePosted)
  const jobs = await getJobsForDay(dayKey)
  const updatedJobs = jobs.map((j) => (j.id === job.id ? job : j))
  await saveJobsForDay(dayKey, updatedJobs)
}

export async function deleteJob(job: JobApplication): Promise<void> {
  const dayKey = getDayKey(job.datePosted)
  const jobs = await getJobsForDay(dayKey)
  const updatedJobs = jobs.filter((j) => j.id !== job.id)

  if (updatedJobs.length === 0) {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(dayKey)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } else {
    await saveJobsForDay(dayKey, updatedJobs)
  }
}

export async function initializeDummyData(): Promise<void> {
  const dayKeys = await getAllDayKeys()
  if (dayKeys.length > 0) return

  const DUMMY_DATA: JobApplication[] = [
    {
      id: "1",
      platform: "LinkedIn",
      jobUrl: "https://linkedin.com/jobs/view/123",
      title: "Senior Frontend Developer",
      companyName: "TechCorp Inc.",
      location: { city: "San Francisco", state: "CA", country: "USA" },
      datePosted: "2025-01-15",
      starred: false,
      applied: false,
      jobType: "Full-time",
      isRemote: false,
      compensation: { minAmount: 120000, maxAmount: 160000, currency: "USD", interval: "yearly" },
      description: "We are looking for an experienced frontend developer...",
    },
    {
      id: "2",
      platform: "Indeed",
      jobUrl: "https://indeed.com/job/456",
      title: "Full Stack Engineer",
      companyName: "StartupXYZ",
      location: { city: "Remote", country: "USA" },
      datePosted: "2025-01-20",
      starred: true,
      applied: false,
      jobType: "Full-time",
      isRemote: true,
      compensation: { minAmount: 100000, maxAmount: 140000, currency: "USD", interval: "yearly" },
    },
    {
      id: "3",
      platform: "Glassdoor",
      jobUrl: "https://glassdoor.com/job/789",
      title: "React Developer",
      companyName: "Digital Solutions Ltd",
      location: { city: "New York", state: "NY", country: "USA" },
      datePosted: "2025-01-18",
      starred: false,
      applied: false,
      jobType: "Contract",
      isRemote: false,
    },
    {
      id: "4",
      platform: "LinkedIn",
      jobUrl: "https://linkedin.com/jobs/view/321",
      title: "UI/UX Engineer",
      companyName: "DesignHub",
      location: { city: "Austin", state: "TX", country: "USA" },
      datePosted: "2025-01-22",
      starred: true,
      applied: false,
      jobType: "Full-time",
      isRemote: false,
      compensation: { minAmount: 90000, maxAmount: 130000, currency: "USD", interval: "yearly" },
    },
    {
      id: "5",
      platform: "AngelList",
      jobUrl: "https://angellist.com/job/654",
      title: "Software Engineer",
      companyName: "InnovateLabs",
      location: { city: "Seattle", state: "WA", country: "USA" },
      datePosted: "2025-01-25",
      starred: false,
      applied: false,
      jobType: "Full-time",
      isRemote: true,
      companyDescription: "<p>InnovateLabs is a cutting-edge technology company focused on AI solutions.</p>",
    },
  ]

  const jobsByDay = DUMMY_DATA.reduce(
    (acc, job) => {
      const dayKey = getDayKey(job.datePosted)
      if (!acc[dayKey]) acc[dayKey] = []
      acc[dayKey].push(job)
      return acc
    },
    {} as Record<string, JobApplication[]>,
  )

  for (const [dayKey, jobs] of Object.entries(jobsByDay)) {
    await saveJobsForDay(dayKey, jobs)
  }
}

export async function searchAllJobs(query: string): Promise<JobApplication[]> {
  if (!query.trim()) return []

  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const allDayRecords = request.result
      const allJobs: JobApplication[] = []

      for (const record of allDayRecords) {
        allJobs.push(...record.jobs)
      }

      const searchLower = query.toLowerCase()
      const filtered = allJobs.filter((job) => {
        const locationStr = [job.location.city, job.location.state, job.location.country]
          .filter(Boolean)
          .join(", ")
          .toLowerCase()

        return (
          job.title.toLowerCase().includes(searchLower) ||
          job.companyName.toLowerCase().includes(searchLower) ||
          locationStr.includes(searchLower)
        )
      })

      filtered.sort((a, b) => b.datePosted.localeCompare(a.datePosted))
      resolve(filtered)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function getAllPlatforms(): Promise<string[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const allDayRecords = request.result
      const platforms = new Set<string>()

      for (const record of allDayRecords) {
        for (const job of record.jobs) {
          platforms.add(job.platform)
        }
      }

      resolve(Array.from(platforms).sort())
    }
    request.onerror = () => reject(request.error)
  })
}

export async function filterJobs(
  platforms: string[],
  dateFrom: string | null,
  dateTo: string | null,
): Promise<JobApplication[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const allDayRecords = request.result
      let allJobs: JobApplication[] = []

      for (const record of allDayRecords) {
        allJobs.push(...record.jobs)
      }

      if (platforms.length > 0) {
        allJobs = allJobs.filter((job) => platforms.includes(job.platform))
      }

      if (dateFrom) {
        allJobs = allJobs.filter((job) => job.datePosted >= dateFrom)
      }
      if (dateTo) {
        allJobs = allJobs.filter((job) => job.datePosted <= dateTo)
      }

      allJobs.sort((a, b) => b.datePosted.localeCompare(a.datePosted))
      resolve(allJobs)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function filterByStatus(
  starred?: boolean,
  applied?: boolean,
  platforms: string[] = [],
  dateFrom: string | null = null,
  dateTo: string | null = null,
): Promise<JobApplication[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const allDayRecords = request.result
      const results: JobApplication[] = []

      for (const record of allDayRecords) {
        for (const job of record.jobs) {
          if (starred !== undefined && job.starred !== starred) {
            continue
          }

          if (applied !== undefined && job.applied !== applied) {
            continue
          }

          if (platforms.length > 0 && !platforms.includes(job.platform)) {
            continue
          }

          const jobDate = new Date(job.datePosted)
          if (dateFrom && jobDate < new Date(dateFrom)) {
            continue
          }
          if (dateTo && jobDate > new Date(dateTo)) {
            continue
          }

          results.push(job)
        }
      }

      results.sort((a, b) => b.datePosted.localeCompare(a.datePosted))
      resolve(results)
    }
    request.onerror = () => reject(request.error)
  })
}

// Fetch jobs from server for a specific date
export async function fetchJobsFromServer(dateKey: string): Promise<JobApplication[]> {
  try {
    const response = await fetch(`/jobs/${dateKey}.json`)
    if (!response.ok) {
      if (response.status === 404) {
        return [] // No jobs for this date
      }
      throw new Error(`Failed to fetch jobs: ${response.status}`)
    }
    const jobs = await response.json()
    return jobs
  } catch (error) {
    console.error(`Error fetching jobs for ${dateKey}:`, error)
    return []
  }
}

// Get list of missing day keys from today back to 7 days
export async function getMissingDayKeys(): Promise<string[]> {
  const existingKeys = await getAllDayKeys()
  const existingKeysSet = new Set(existingKeys)
  const missingKeys: string[] = []
  
  const today = new Date()
  
  // Check for the last 7 days including today
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dayKey = getDayKey(date.toISOString())
    
    if (!existingKeysSet.has(dayKey)) {
      missingKeys.push(dayKey)
    }
  }
  
  return missingKeys
}

// Fetch and store missing jobs from server
export async function syncJobsFromServer(): Promise<{ 
  fetched: number, 
  stored: number,
  days: string[] 
}> {
  const missingKeys = await getMissingDayKeys()
  
  if (missingKeys.length === 0) {
    return { fetched: 0, stored: 0, days: [] }
  }
  
  let totalStored = 0
  const storedDays: string[] = []
  
  for (const dayKey of missingKeys) {
    const jobs = await fetchJobsFromServer(dayKey)
    if (jobs.length > 0) {
      // Add default starred and applied properties if not present
      const processedJobs = jobs.map(job => ({
        ...job,
        starred: job.starred ?? false,
        applied: job.applied ?? false,
      }))
      
      await saveJobsForDay(dayKey, processedJobs)
      totalStored += processedJobs.length
      storedDays.push(dayKey)
    }
  }
  
  return { 
    fetched: missingKeys.length, 
    stored: totalStored,
    days: storedDays
  }
}
