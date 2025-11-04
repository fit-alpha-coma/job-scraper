"use client"

import { useState, useEffect, useRef, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LayoutGrid, TableIcon, Heart, Trash2, ExternalLink, Search, X, Filter, Info, CheckCircle2, RefreshCw } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  type JobApplication,
  initDB,
  getAllDayKeys,
  getJobsForDay,
  updateJob,
  deleteJob,
  initializeDummyData,
  searchAllJobs,
  getAllPlatforms,
  filterByStatus,
  syncJobsFromServer,
} from "@/lib/indexeddb"

// Memoized Job Card Component for better performance
const JobCard = memo(({ 
  job, 
  onToggleStar, 
  onToggleApplied, 
  onDelete,
  onOpenDetails,
  formatDate,
  formatLocation,
  formatCompensation
}: {
  job: JobApplication
  onToggleStar: (job: JobApplication) => void
  onToggleApplied: (job: JobApplication) => void
  onDelete: (job: JobApplication) => void
  onOpenDetails: (job: JobApplication) => void
  formatDate: (date: string) => string
  formatLocation: (location: JobApplication["location"]) => string
  formatCompensation: (compensation?: JobApplication["compensation"]) => string | null
}) => {
  return (
    <Card
      className="relative cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => onOpenDetails(job)}
    >
      <CardContent className="p-6">
        <div className="absolute right-4 top-4 flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleStar(job)
            }}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Heart className={`h-5 w-5 ${job.starred ? "fill-red-500 text-red-500" : ""}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleApplied(job)
            }}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <CheckCircle2 className={`h-5 w-5 ${job.applied ? "fill-green-500 text-green-500" : ""}`} />
          </button>
        </div>

        <div className="mb-4">
          <h3 className="mb-1 pr-16 text-lg font-semibold leading-tight text-foreground">{job.title}</h3>
          <p className="text-sm font-medium text-muted-foreground">{job.companyName}</p>
        </div>

        <div className="mb-4 space-y-2 text-sm text-muted-foreground">
          <p>{formatLocation(job.location)}</p>
          <div className="flex items-center gap-2">
            <p>{job.jobType || "N/A"}</p>
            {job.isRemote && (
              <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10">Remote</Badge>
            )}
          </div>
          <p>{formatDate(job.datePosted)}</p>
          {job.compensation && (
            <p className="font-medium text-foreground">{formatCompensation(job.compensation)}</p>
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
            {job.platform}
          </span>
        </div>

        <div className="flex gap-2 border-t pt-4" onClick={(e) => e.stopPropagation()}>
          <a
            href={job.jobUrlDirect || job.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            <ExternalLink className="h-4 w-4" />
            View Job
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(job)
            }}
            className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
})
JobCard.displayName = "JobCard"

// Memoized Table Row Component for better performance
const JobTableRow = memo(({ 
  job, 
  onToggleStar, 
  onToggleApplied, 
  onDelete,
  onOpenDetails,
  formatDate,
  formatLocation
}: {
  job: JobApplication
  onToggleStar: (job: JobApplication) => void
  onToggleApplied: (job: JobApplication) => void
  onDelete: (job: JobApplication) => void
  onOpenDetails: (job: JobApplication) => void
  formatDate: (date: string) => string
  formatLocation: (location: JobApplication["location"]) => string
}) => {
  return (
    <TableRow className="cursor-pointer" onClick={() => onOpenDetails(job)}>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleStar(job)
            }}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Heart className={`h-4 w-4 ${job.starred ? "fill-red-500 text-red-500" : ""}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleApplied(job)
            }}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <CheckCircle2 className={`h-4 w-4 ${job.applied ? "fill-green-500 text-green-500" : ""}`} />
          </button>
        </div>
      </TableCell>
      <TableCell className="font-medium">{job.title}</TableCell>
      <TableCell>{job.companyName}</TableCell>
      <TableCell className="text-muted-foreground">{formatLocation(job.location)}</TableCell>
      <TableCell className="text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm text-muted-foreground">{job.jobType || "N/A"}</span>
          {job.isRemote && (
            <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10">Remote</Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
          {job.platform}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">{formatDate(job.datePosted)}</TableCell>
      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end gap-2">
          <a
            href={job.jobUrlDirect || job.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(job)
            }}
            className="text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  )
})
JobTableRow.displayName = "JobTableRow"

export default function JobmaxxPage() {
  const [viewMode, setViewMode] = useState<"table" | "card">("card")
  const [jobs, setJobs] = useState<JobApplication[]>([])
  const [dayKeys, setDayKeys] = useState<string[]>([])
  const [loadedDays, setLoadedDays] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [starredCount, setStarredCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<JobApplication[]>([])

  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [filterStarred, setFilterStarred] = useState<boolean | undefined>(undefined)
  const [filterApplied, setFilterApplied] = useState<boolean | undefined>(undefined)
  const [isFiltering, setIsFiltering] = useState(false)
  const [filterResults, setFilterResults] = useState<JobApplication[]>([])
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null)
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initialize = async () => {
      await initDB()
      await initializeDummyData()
      
      // Sync jobs from server for missing days (up to 7 days back)
      try {
        const syncResult = await syncJobsFromServer()
        if (syncResult.stored > 0) {
          console.log(`Synced ${syncResult.stored} jobs from ${syncResult.days.length} day(s)`)
        }
      } catch (error) {
        console.error("Error syncing jobs from server:", error)
      }
      
      const keys = await getAllDayKeys()
      setDayKeys(keys)
      setHasMore(keys.length > 0)
      const platforms = await getAllPlatforms()
      setAvailablePlatforms(platforms)
    }
    initialize()
  }, [])

  const loadMoreJobs = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    const BATCH_SIZE = 3 // Load 3 days at a time

    const daysToLoad = dayKeys.slice(loadedDays, loadedDays + BATCH_SIZE)

    if (daysToLoad.length === 0) {
      setHasMore(false)
      setLoading(false)
      return
    }

    const newJobs: JobApplication[] = []
    for (const dayKey of daysToLoad) {
      const dayJobs = await getJobsForDay(dayKey)
      newJobs.push(...dayJobs)
    }

    setJobs((prev) => [...prev, ...newJobs])
    setLoadedDays((prev) => prev + daysToLoad.length)
    setHasMore(loadedDays + daysToLoad.length < dayKeys.length)
    setLoading(false)
  }, [dayKeys, loadedDays, loading, hasMore])

  useEffect(() => {
    if (dayKeys.length > 0 && loadedDays === 0) {
      loadMoreJobs()
    }
  }, [dayKeys, loadedDays, loadMoreJobs])

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query)

      if (!query.trim()) {
        setIsSearching(false)
        setSearchResults([])
        return
      }

      setIsSearching(true)
      setLoading(true)

      try {
        let results = await searchAllJobs(query)

        if (
          selectedPlatforms.length > 0 ||
          dateFrom ||
          dateTo ||
          filterStarred !== undefined ||
          filterApplied !== undefined
        ) {
          results = results.filter((job) => {
            if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(job.platform)) {
              return false
            }

            const jobDate = new Date(job.datePosted)
            if (dateFrom && jobDate < new Date(dateFrom)) {
              return false
            }
            if (dateTo && jobDate > new Date(dateTo)) {
              return false
            }
            if (filterStarred !== undefined && job.starred !== filterStarred) {
              return false
            }
            if (filterApplied !== undefined && job.applied !== filterApplied) {
              return false
            }

            return true
          })
        }

        setSearchResults(results)
      } catch (error) {
        console.error("Search error:", error)
        setSearchResults([])
      } finally {
        setLoading(false)
      }
    },
    [selectedPlatforms, dateFrom, dateTo, filterStarred, filterApplied],
  )

  const clearSearch = () => {
    setSearchQuery("")
    setIsSearching(false)
    setSearchResults([])
  }

  const applyFilters = async () => {
    const hasFilters =
      selectedPlatforms.length > 0 || dateFrom || dateTo || filterStarred !== undefined || filterApplied !== undefined

    if (!hasFilters) {
      setIsFiltering(false)
      setFilterResults([])
      setFilterSheetOpen(false)
      if (searchQuery.trim()) {
        await handleSearch(searchQuery)
      }
      return
    }

    setIsFiltering(true)
    setLoading(true)

    try {
      if (searchQuery.trim()) {
        const searchRes = await searchAllJobs(searchQuery)
        const filtered = searchRes.filter((job) => {
          if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(job.platform)) {
            return false
          }
          if (filterStarred !== undefined && job.starred !== filterStarred) {
            return false
          }
          if (filterApplied !== undefined && job.applied !== filterApplied) {
            return false
          }
          const jobDate = new Date(job.datePosted)
          if (dateFrom && jobDate < new Date(dateFrom)) {
            return false
          }
          if (dateTo && jobDate > new Date(dateTo)) {
            return false
          }
          return true
        })
        setSearchResults(filtered)
      } else {
        const results = await filterByStatus(
          filterStarred,
          filterApplied,
          selectedPlatforms,
          dateFrom || null,
          dateTo || null,
        )
        setFilterResults(results)
      }
      setFilterSheetOpen(false)
    } catch (error) {
      console.error("Filter error:", error)
      setFilterResults([])
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSelectedPlatforms([])
    setDateFrom("")
    setDateTo("")
    setFilterStarred(undefined)
    setFilterApplied(undefined)
    setIsFiltering(false)
    setFilterResults([])
    if (searchQuery.trim()) {
      handleSearch(searchQuery)
    }
  }

  const toggleStar = useCallback(async (job: JobApplication) => {
    const updatedJob = { ...job, starred: !job.starred }
    await updateJob(updatedJob)

    setJobs((prev) => prev.map((j) => (j.id === job.id ? updatedJob : j)))
    setSearchResults((prev) => prev.map((j) => (j.id === job.id ? updatedJob : j)))
    setFilterResults((prev) => prev.map((j) => (j.id === job.id ? updatedJob : j)))
    if (selectedJob?.id === job.id) {
      setSelectedJob(updatedJob)
    }
  }, [selectedJob])

  const toggleApplied = useCallback(async (job: JobApplication) => {
    const updatedJob = { ...job, applied: !job.applied }
    await updateJob(updatedJob)

    setJobs((prev) => prev.map((j) => (j.id === job.id ? updatedJob : j)))
    setSearchResults((prev) => prev.map((j) => (j.id === job.id ? updatedJob : j)))
    setFilterResults((prev) => prev.map((j) => (j.id === job.id ? updatedJob : j)))
    if (selectedJob?.id === job.id) {
      setSelectedJob(updatedJob)
    }
  }, [selectedJob])

  const handleDeleteJob = useCallback(async (job: JobApplication) => {
    await deleteJob(job)
    setJobs((prev) => prev.filter((j) => j.id !== job.id))
    setSearchResults((prev) => prev.filter((j) => j.id !== job.id))
    setFilterResults((prev) => prev.filter((j) => j.id !== job.id))
    if (selectedJob?.id === job.id) {
      setJobDetailsOpen(false)
      setSelectedJob(null)
    }
  }, [selectedJob])

  const handleManualSync = async () => {
    setIsSyncing(true)
    try {
      const syncResult = await syncJobsFromServer()
      if (syncResult.stored > 0) {
        console.log(`Synced ${syncResult.stored} jobs from ${syncResult.days.length} day(s)`)
        
        // Refresh the day keys and reload if we got new data
        const keys = await getAllDayKeys()
        setDayKeys(keys)
        
        // If we're currently viewing all jobs, we should reload
        if (!isSearching && !isFiltering) {
          setLoadedDays(0)
          setJobs([])
          setHasMore(keys.length > 0)
        }
        
        // Update available platforms
        const platforms = await getAllPlatforms()
        setAvailablePlatforms(platforms)
      }
    } catch (error) {
      console.error("Error during manual sync:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }, [])

  const formatLocation = useCallback((location: JobApplication["location"]) => {
    const parts = [location.city, location.state, location.country].filter(Boolean)
    return parts.length > 0 ? parts.join(", ") : "Location not specified"
  }, [])

  const formatCompensation = useCallback((compensation?: JobApplication["compensation"]) => {
    if (!compensation) return null
    const { minAmount, maxAmount, currency = "USD", interval } = compensation
    if (!minAmount && !maxAmount) return null

    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    })

    if (minAmount && maxAmount) {
      return `${formatter.format(minAmount)} - ${formatter.format(maxAmount)}${interval ? ` / ${interval}` : ""}`
    } else if (minAmount) {
      return `${formatter.format(minAmount)}+${interval ? ` / ${interval}` : ""}`
    } else if (maxAmount) {
      return `Up to ${formatter.format(maxAmount)}${interval ? ` / ${interval}` : ""}`
    }
    return null
  }, [])

  const openJobDetails = useCallback((job: JobApplication) => {
    setSelectedJob(job)
    setJobDetailsOpen(true)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isSearching && !isFiltering) {
          loadMoreJobs()
        }
      },
      { threshold: 0.1 },
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [loadMoreJobs, isSearching, isFiltering])

  useEffect(() => {
    const displayedJobs = isSearching ? searchResults : isFiltering ? filterResults : jobs
    setTotalCount(displayedJobs.length)
    setStarredCount(displayedJobs.filter((j) => j.starred).length)
  }, [jobs, searchResults, filterResults, isSearching, isFiltering])

  const displayedJobs = isSearching ? searchResults : isFiltering ? filterResults : jobs

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Jobmaxx</h1>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-muted-foreground transition-colors hover:text-foreground">
                    <Info className="h-5 w-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-semibold">About Jobmaxx</h4>
                    <p className="text-sm text-muted-foreground">
                      A minimal job application tracker for tech jobs in the Philippines
                    </p>
                    <div className="pt-2 text-sm">
                      <p className="font-medium">Features:</p>
                      <ul className="mt-1 list-inside list-disc space-y-1 text-muted-foreground">
                        <li>Track applications by platform, position, company, and location</li>
                        <li>Star your favorite opportunities</li>
                        <li>Search across all your applications</li>
                        <li>Filter by platform and date range</li>
                        <li>Toggle between table and card views</li>
                      </ul>
                    </div>
                    <div className="pt-2 text-sm">
                      <p className="font-medium">Data Storage:</p>
                      <p className="text-muted-foreground">
                        All data is scraped and updated daily (every 12 NN PHT) from Indeed and LinkedIn. All your changes (heart, applied, delete) are stored locally only.
                      </p>
                    </div>
                    <div className="pt-2 text-sm">
                      <p className="font-medium">Specific Jobs:</p>
                      <ul className="mt-1 list-inside list-disc space-y-1 text-muted-foreground">
                        <li>Software Engineer</li>
                        <li>Frontend developer</li>
                        <li>Backend developer</li>
                        <li>Fullstack developer</li>
                        <li>AI engineer</li>
                        <li>Machine learning engineer</li>
                        <li>Cloud engineer</li>
                      </ul>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <a
                href="https://www.linkedin.com/in/alpharomercoma"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
              >
                by Alpha
              </a>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Tech Jobs in the Philippines</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "card" ? "default" : "outline"} size="sm" onClick={() => setViewMode("card")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by title, company, or location..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Button 
            variant="outline" 
            size="default" 
            onClick={handleManualSync}
            disabled={isSyncing}
            className="bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </Button>

          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="default" className="relative bg-transparent">
                <Filter className="h-4 w-4" />
                {selectedPlatforms.length > 0 ||
                dateFrom ||
                dateTo ||
                filterStarred !== undefined ||
                filterApplied !== undefined ? (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {selectedPlatforms.length +
                      (dateFrom ? 1 : 0) +
                      (dateTo ? 1 : 0) +
                      (filterStarred !== undefined ? 1 : 0) +
                      (filterApplied !== undefined ? 1 : 0)}
                  </span>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Jobs</SheetTitle>
                <SheetDescription>Filter job applications by various criteria</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6 px-4 py-0">
                <div>
                  <h3 className="mb-3 text-sm font-medium">Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-starred"
                        checked={filterStarred === true}
                        onCheckedChange={(checked) => setFilterStarred(checked ? true : undefined)}
                      />
                      <Label htmlFor="filter-starred" className="text-sm font-normal">
                        Starred only
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-applied"
                        checked={filterApplied === true}
                        onCheckedChange={(checked) => setFilterApplied(checked ? true : undefined)}
                      />
                      <Label htmlFor="filter-applied" className="text-sm font-normal">
                        Applied only
                      </Label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-medium">Platform</h3>
                  <div className="space-y-2">
                    {availablePlatforms.map((platform) => (
                      <div key={platform} className="flex items-center space-x-2">
                        <Checkbox
                          id={platform}
                          checked={selectedPlatforms.includes(platform)}
                          onCheckedChange={() =>
                            setSelectedPlatforms((prev) =>
                              prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform],
                            )
                          }
                        />
                        <Label htmlFor={platform} className="text-sm font-normal">
                          {platform}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-medium">Job Posting Date</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="dateFrom" className="text-sm font-normal text-muted-foreground">
                        From
                      </Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateTo" className="text-sm font-normal text-muted-foreground">
                        To
                      </Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={applyFilters} className="flex-1">
                    Apply Filters
                  </Button>
                  <Button onClick={clearFilters} variant="outline">
                    Clear
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {isSearching && (
          <p className="mb-4 text-sm text-muted-foreground">
            Found {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
          </p>
        )}
        {isFiltering && (
          <p className="mb-4 text-sm text-muted-foreground">
            Showing {filterResults.length} filtered result{filterResults.length !== 1 ? "s" : ""}
          </p>
        )}

        <div className="mb-6 flex gap-4 text-sm text-muted-foreground">
          <span>
            {isSearching || isFiltering ? "Results" : "Total"}:{" "}
            <span className="font-medium text-foreground">{totalCount}</span>
          </span>
          <span>
            Starred: <span className="font-medium text-foreground">{starredCount}</span>
          </span>
        </div>

        {displayedJobs.length === 0 && !loading ? (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">
              {isSearching
                ? "No jobs found matching your search"
                : isFiltering
                  ? "No jobs found matching your filters"
                  : "No job applications yet"}
            </p>
          </div>
        ) : viewMode === "table" ? (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedJobs.map((job) => (
                  <JobTableRow
                    key={job.id}
                    job={job}
                    onToggleStar={toggleStar}
                    onToggleApplied={toggleApplied}
                    onDelete={handleDeleteJob}
                    onOpenDetails={openJobDetails}
                    formatDate={formatDate}
                    formatLocation={formatLocation}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onToggleStar={toggleStar}
                onToggleApplied={toggleApplied}
                onDelete={handleDeleteJob}
                onOpenDetails={openJobDetails}
                formatDate={formatDate}
                formatLocation={formatLocation}
                formatCompensation={formatCompensation}
              />
            ))}
          </div>
        )}

        {loading && (
          <div className="mt-8 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        )}

        {!isSearching && !isFiltering && <div ref={observerTarget} className="h-4" />}

        {!hasMore && displayedJobs.length > 0 && !isSearching && !isFiltering && (
          <div className="mt-8 text-center text-sm text-muted-foreground">No more jobs to load</div>
        )}
      </div>

      <Dialog open={jobDetailsOpen} onOpenChange={setJobDetailsOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedJob.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Company Info */}
                <div className="flex items-start gap-4">
                  {selectedJob.companyLogo && (
                    <img
                      src={selectedJob.companyLogo || "/placeholder.svg"}
                      alt={selectedJob.companyName}
                      className="h-16 w-16 rounded-lg object-contain"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{selectedJob.companyName}</h3>
                    {selectedJob.companyUrl && (
                      <a
                        href={selectedJob.companyUrlDirect || selectedJob.companyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Visit Company Website
                      </a>
                    )}
                  </div>
                </div>

                {/* Key Details */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p className="mt-1">{formatLocation(selectedJob.location)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Job Type</p>
                    <p className="mt-1">{selectedJob.jobType || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Posted Date</p>
                    <p className="mt-1">{formatDate(selectedJob.datePosted)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Platform</p>
                    <p className="mt-1">{selectedJob.platform}</p>
                  </div>
                  {selectedJob.compensation && (
                    <div className="sm:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Compensation</p>
                      <p className="mt-1 text-lg font-semibold">{formatCompensation(selectedJob.compensation)}</p>
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {selectedJob.isRemote && <Badge className="bg-green-500/10 text-green-600">Remote</Badge>}
                  {selectedJob.jobType && <Badge variant="secondary">{selectedJob.jobType}</Badge>}
                  {selectedJob.starred && <Badge variant="outline">Starred</Badge>}
                  {selectedJob.applied && <Badge variant="outline">Applied</Badge>}
                </div>

                {/* Job Description */}
                {selectedJob.description && (
                  <div>
                    <h4 className="mb-2 font-semibold">Job Description</h4>
                    <div
                      className="prose prose-sm max-w-none text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: selectedJob.description }}
                    />
                  </div>
                )}

                {/* Company Description */}
                {selectedJob.companyDescription && (
                  <div>
                    <h4 className="mb-2 font-semibold">About the Company</h4>
                    <div
                      className="prose prose-sm max-w-none text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: selectedJob.companyDescription }}
                    />
                  </div>
                )}

                {/* Additional Company Info */}
                {(selectedJob.companyIndustry ||
                  selectedJob.companyNumEmployees ||
                  selectedJob.companyRevenue ||
                  selectedJob.companyAddresses) && (
                  <div>
                    <h4 className="mb-3 font-semibold">Company Details</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {selectedJob.companyIndustry && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Industry</p>
                          <p className="mt-1 text-sm">{selectedJob.companyIndustry}</p>
                        </div>
                      )}
                      {selectedJob.companyNumEmployees && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Company Size</p>
                          <p className="mt-1 text-sm">{selectedJob.companyNumEmployees} employees</p>
                        </div>
                      )}
                      {selectedJob.companyRevenue && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                          <p className="mt-1 text-sm">{selectedJob.companyRevenue}</p>
                        </div>
                      )}
                      {selectedJob.companyAddresses && (
                        <div className="sm:col-span-2">
                          <p className="text-sm font-medium text-muted-foreground">Addresses</p>
                          <p className="mt-1 text-sm">{selectedJob.companyAddresses}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 border-t pt-4">
                  <a
                    href={selectedJob.jobUrlDirect || selectedJob.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Apply Now
                  </a>
                  <Button
                    variant="outline"
                    onClick={() => toggleStar(selectedJob)}
                  >
                    <Heart className={`h-4 w-4 ${selectedJob.starred ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => toggleApplied(selectedJob)}
                  >
                    <CheckCircle2 className={`h-4 w-4 ${selectedJob.applied ? "fill-green-500 text-green-500" : ""}`} />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteJob(selectedJob)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
