import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import Header from '@/components/core1/header'
import Footer from '@/components/core1/footer'
import FadeIn from '@/components/core1/fade-in'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { Briefcase, MapPin, Calendar, Clock, ArrowLeft, Building2, CheckCircle2, X } from "lucide-react"
import wallpaperHeader from "@/assets/jobportal.png"

export default function JobPortal() {
  const [darkMode, setDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [formData, setFormData] = useState({
    employee_code: '',
    last_name: '',
    first_name: '',
    middle_name: '',
    suffix: '',
    email: '',
    phone: '',
    position: '',
    job_title: '',
    job: '',
    status: 'pending',
    hire_date: '',
    employment_type: '',
    street_address: '',
    city: '',
    state: '',
    zip: '',
    university: '',
    course: '',
    year_level: '',
    resume: null,
    driver_license: null,
    termsAccepted: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('')
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState(null)

  // Fetch jobs from HR1 API
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setJobsLoading(true)

        // Fetch from HR1 API
        const envBackend = import.meta.env.VITE_HR1_BACKEND || 'https://back.jobfithr1.jampzdev.com'
        const baseUrl = envBackend.replace(/\/$/, '')
        const response = await fetch(`${baseUrl}/api/job-postings/approved`)

        if (response.ok) {
          const data = await response.json()
          console.log('Jobs from HR1:', data)

          const jobsArray = Array.isArray(data) ? data : (data.data || [])
          const transformedJobs = jobsArray.map(job => ({
            id: job.id,
            title: job.title || job.position || 'Position Available',
            location: job.location || 'Main Office',
            type: job.employment_type || job.type || 'Full-time',
            description: job.description || '',
            department: job.department || '',
            salary: job.salary_range || job.salary || 'Competitive',
            status: job.status || 'open',
            requirements: job.requirements || '',
            responsibilities: job.responsibilities || '',
            application_deadline: job.application_deadline || ''
          }))

          setJobs(transformedJobs)
        } else {
          console.error('Failed to fetch jobs:', response.status)
          setJobs([])
        }
      } catch (error) {
        console.error('Error fetching jobs:', error)
        setJobs([])
      } finally {
        setJobsLoading(false)
      }
    }

    fetchJobs()
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setDarkMode(true)
    }
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  useEffect(() => {
    if (!showApplyForm) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [showApplyForm])

  const filteredJobs = jobs.filter(job => {
    const query = searchQuery.toLowerCase()
    return job.title.toLowerCase().includes(query) ||
      job.location.toLowerCase().includes(query) ||
      (job.type && job.type.toLowerCase().includes(query)) ||
      (job.department && job.department.toLowerCase().includes(query)) ||
      (job.description && job.description.toLowerCase().includes(query))
  })

  const handleViewJob = (job) => {
    setSelectedJob(job)
  }

  const handleApplyNow = (position) => {
    setShowApplyForm(true)
    setFormData(prev => ({
      ...prev,
      position,
      job_title: position,
      job: position,
      employment_type: position
    }))
  }

  const handleOpenApplyForm = () => {
    setShowApplyForm(true)
  }

  const handleCloseApplyForm = () => {
    setShowApplyForm(false)
  }

  const handleInputChange = (e) => {
    const { name, value, files, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : (type === 'checkbox' ? checked : value)
    }))
  }

  const getApplicantFullName = () => {
    const last = (formData.last_name || '').trim()
    const first = (formData.first_name || '').trim()
    const middle = (formData.middle_name || '').trim()

    const core = [first, middle, last].filter(Boolean).join(' ')
    return core
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.termsAccepted) {
      toast.error('Please accept the Terms & Conditions to submit your application.')
      return
    }

    if (formData.resume && formData.resume.type !== 'application/pdf') {
      toast.error('Please upload your resume in PDF format only.')
      return
    }

    const isDriverJob = formData.position && formData.position.toLowerCase().includes('driver')
    if (isDriverJob && !formData.driver_license) {
      toast.error("Please attach your driver's license for this position.")
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('')

    try {
      // Generate unique employee code
      const timestamp = Date.now()
      const randomNum = Math.floor(Math.random() * 1000)
      const employeeCode = `EMP${timestamp}${randomNum}`

      // Create form data for file upload - match HR1 exact structure
      const submitData = new FormData()
      submitData.append('employee_code', employeeCode)
      submitData.append('name', getApplicantFullName())
      submitData.append('email', formData.email)
      submitData.append('phone', formData.phone)
      submitData.append('status', 'pending')
      submitData.append('hire_date', new Date().toISOString().split('T')[0])

      // Job fields - match HR1 exact field names
      submitData.append('job_title', formData.position)
      submitData.append('job', formData.position)
      submitData.append('department', '') // HR1 will set based on job title

      // Personal info fields - match HR1 exact structure
      submitData.append('last_name', formData.last_name)
      submitData.append('first_name', formData.first_name)
      submitData.append('middle_name', formData.middle_name)

      // Address fields - match HR1 exact field names
      submitData.append('street_address', formData.street_address)
      submitData.append('city', formData.city)
      submitData.append('state', formData.state)
      submitData.append('zip', formData.zip)

      // Education fields - match HR1 exact field names
      submitData.append('university', formData.university)
      submitData.append('course', formData.course)
      submitData.append('year_level', formData.year_level)

      // Resume file
      if (formData.resume) {
        submitData.append('resume', formData.resume)
      }

      if (formData.driver_license) {
        submitData.append('driver_license', formData.driver_license)
      }

      // Submit to HR1 backend API
      const envBackend = import.meta.env.VITE_HR1_BACKEND || 'https://back.jobfithr1.jampzdev.com'
      const baseUrl = envBackend.replace(/\/$/, '')

      let response = await fetch(`${baseUrl}/api/applicants`, {
        method: 'POST',
        body: submitData,
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        // Try alternative endpoint
        response = await fetch(`${baseUrl}/api/applicants/register`, {
          method: 'POST',
          body: submitData,
          headers: {
            'Accept': 'application/json',
          },
        })
      }

      if (response.ok) {
        const result = await response.json()
        setSubmitStatus('success')
        toast.success(`Application submitted successfully! Your application has been sent to the HR system. Applicant ID: ${result.id || 'N/A'}`)

        // Reset form
        setFormData({
          employee_code: '',
          last_name: '',
          first_name: '',
          middle_name: '',
          email: '',
          phone: '',
          position: jobs.length > 0 ? jobs[0].title : '',
          job_title: jobs.length > 0 ? jobs[0].title : '',
          job: jobs.length > 0 ? jobs[0].title : '',
          status: 'pending',
          hire_date: '',
          employment_type: jobs.length > 0 ? jobs[0].title : '',
          street_address: '',
          city: '',
          state: '',
          zip: '',
          university: '',
          course: '',
          year_level: '',
          resume: null,
          driver_license: null,
          termsAccepted: false
        })

        // Clear file input
        const fileInput = document.getElementById('resume')
        if (fileInput) fileInput.value = ''

        const licenseInput = document.getElementById('driver_license')
        if (licenseInput) licenseInput.value = ''

      } else {
        const errorText = await response.text()
        setSubmitStatus('error')

        let errorMessage = 'Failed to submit application'
        try {
          const error = JSON.parse(errorText)
          errorMessage = error.message || error.error || (error.errors ? Object.values(error.errors).flat().join(', ') : errorMessage)
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }

        toast.error(`Error: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Submission error:', error)
      setSubmitStatus('error')
      toast.error(`Network error: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex justify-center">
      <div className="max-w-[1920px] w-full">
        <div className="relative overflow-hidden">
          {/* Background image with blur effect like landing page */}
          <img
            src={wallpaperHeader}
            alt="job opportunities background"
            className="absolute inset-0 w-full h-full object-cover -z-10 blur-[4px]"
          />

          {/* Content above background */}
          <div className="relative z-10">
            <Header />

            {!selectedJob && (
              <div className="p-60 px-10 flex justify-center">
                <FadeIn className="p-8 rounded-lg bg-white lg:w-[700px] flex flex-col">
                  <h1 className="text-[30px] text-center font-bold">Join Our Team at</h1>
                  <p className="text-(--primary) lg:text-[50px] text-center font-bold leading-tight text-[40px]">
                    JOLI Travel And Tours
                  </p>
                  <p className="my-4 text-center">
                    Explore career opportunities and apply today to become part of our growing team.
                  </p>

                  <Button size="lg" className="cursor-pointer self-center" onClick={() => handleApplyNow('General Application')}>
                    Apply Now
                  </Button>
                </FadeIn>
              </div>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          <FadeIn>
            {selectedJob ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Button
                  variant="ghost"
                  className="mb-6 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setSelectedJob(null)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                      <div className="mb-6">
                        <h2 className="text-3xl font-bold mb-2">{selectedJob.title}</h2>
                        <div className="flex flex-wrap gap-4 text-gray-600">
                          {selectedJob.department && (
                            <div className="flex items-center">
                              <Building2 className="mr-1.5 h-4 w-4 text-primary" />
                              {selectedJob.department}
                            </div>
                          )}
                          <div className="flex items-center">
                            <MapPin className="mr-1.5 h-4 w-4 text-primary" />
                            {selectedJob.location}
                          </div>
                          <div className="flex items-center">
                            <Briefcase className="mr-1.5 h-4 w-4 text-primary" />
                            {selectedJob.type}
                          </div>
                        </div>
                      </div>

                      {selectedJob.description && (
                        <div className="mb-8">
                          <h3 className="text-lg font-semibold mb-3">About the Role</h3>
                          <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                            {selectedJob.description}
                          </div>
                        </div>
                      )}

                      {selectedJob.responsibilities && (
                        <div className="mb-8">
                          <h3 className="text-lg font-semibold mb-3">Key Responsibilities</h3>
                          <div className="text-gray-600 leading-relaxed whitespace-pre-line pl-4 border-l-2 border-primary/20">
                            {selectedJob.responsibilities}
                          </div>
                        </div>
                      )}

                      {selectedJob.requirements && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Requirements</h3>
                          <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                            {selectedJob.requirements}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-4">
                      <h3 className="font-semibold text-lg mb-4">Job Overview</h3>

                      <div className="space-y-4 mb-6">
                        <div className="flex items-start">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-3">
                            <Briefcase className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Employment Type</p>
                            <p className="font-medium">{selectedJob.type}</p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="p-2 bg-green-50 text-green-600 rounded-lg mr-3">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="font-medium">{selectedJob.location}</p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg mr-3">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Department</p>
                            <p className="font-medium">{selectedJob.department || 'General'}</p>
                          </div>
                        </div>

                        {selectedJob.application_deadline && (
                          <div className="flex items-start">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg mr-3">
                              <Clock className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Deadline</p>
                              <p className="font-medium">{new Date(selectedJob.application_deadline).toLocaleDateString()}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        size="lg"
                        className="w-full text-base font-semibold py-6 shadow-md hover:shadow-lg transition-all"
                        onClick={() => handleApplyNow(selectedJob.title)}
                      >
                        Apply for this Position
                      </Button>

                      <p className="text-xs text-gray-400 text-center mt-4">
                        Please ensure your resume is up to date before applying.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-8 text-center">Available Jobs</h2>

                <div className="max-w-md mx-auto mb-8">
                  <Input
                    id="job-search"
                    type="text"
                    placeholder="Search jobs (e.g. developer, HR, remote)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoComplete="off"
                  />
                </div>

                {jobsLoading ? (
                  <p style={{ textAlign: 'center', padding: '2rem' }}>Loading job vacancies...</p>
                ) : filteredJobs.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No jobs found.</p>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobs.map((job) => (
                      <Card
                        key={job.id}
                        className="h-full hover:shadow-lg transition-shadow cursor-pointer ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:border-primary/50"
                        onClick={() => handleViewJob(job)}
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start mb-2">
                            <CardTitle className="text-xl">{job.title}</CardTitle>
                            <Badge variant="secondary">{job.type}</Badge>
                          </div>
                          <CardDescription>
                            {job.department && <span>{job.department} • </span>}
                            {job.location}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                          {job.description && (
                            <p className="text-gray-600 mb-4 line-clamp-3">{job.description}</p>
                          )}

                          <Button
                            className="w-full mt-auto"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApplyNow(job.title)
                            }}
                          >
                            Apply Now
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </FadeIn>
        </div>

        {/* Application Form Modal */}
        {showApplyForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleCloseApplyForm}>
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Job Application</h2>
                  <Button variant="ghost" onClick={handleCloseApplyForm}>
                    ×
                  </Button>
                </div>

                {submitStatus === 'success' && (
                  <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                    ✓ Application submitted successfully! It will appear in the HR system.
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    ✗ Failed to submit application. Please try again.
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        type="text"
                        placeholder="Enter your last name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        type="text"
                        placeholder="Enter your first name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <Label htmlFor="middle_name">Middle Name</Label>
                      <Input
                        id="middle_name"
                        name="middle_name"
                        type="text"
                        placeholder="Enter your middle name"
                        value={formData.middle_name}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="mb-4">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="mb-4">
                    <Label htmlFor="position">Select Position *</Label>
                    <Select value={formData.position} onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      position: value,
                      job_title: value,
                      job: value,
                      employment_type: value
                    }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a position" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobs.length > 0 ? (
                          jobs.map((job) => (
                            <SelectItem key={job.id} value={job.title}>
                              {job.title} - {job.location}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-positions" disabled>
                            No positions available - Please check back later
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="street_address">Street Address *</Label>
                      <Input
                        id="street_address"
                        name="street_address"
                        type="text"
                        placeholder="Street Address"
                        value={formData.street_address}
                        onChange={handleInputChange}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        type="text"
                        placeholder="City"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State / Province *</Label>
                      <Input
                        id="state"
                        name="state"
                        type="text"
                        placeholder="State / Province"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip">ZIP / Postal Code *</Label>
                      <Input
                        id="zip"
                        name="zip"
                        type="text"
                        placeholder="ZIP / Postal Code"
                        value={formData.zip}
                        onChange={handleInputChange}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label htmlFor="university">University / College *</Label>
                      <Input
                        id="university"
                        name="university"
                        type="text"
                        placeholder="Enter your university or college"
                        value={formData.university}
                        onChange={handleInputChange}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="course">Course / Major *</Label>
                      <Input
                        id="course"
                        name="course"
                        type="text"
                        placeholder="Enter your course or major"
                        value={formData.course}
                        onChange={handleInputChange}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="year_level">Year Level *</Label>
                      <Select value={formData.year_level} onValueChange={(value) => setFormData(prev => ({ ...prev, year_level: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1st Year">1st Year</SelectItem>
                          <SelectItem value="2nd Year">2nd Year</SelectItem>
                          <SelectItem value="3rd Year">3rd Year</SelectItem>
                          <SelectItem value="4th Year">4th Year</SelectItem>
                          <SelectItem value="5th Year">5th Year</SelectItem>
                          <SelectItem value="Graduate">Graduate</SelectItem>
                          <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label htmlFor="resume">Upload Resume / CV *</Label>
                    <Input
                      id="resume"
                      name="resume"
                      type="file"
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      accept=".pdf"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Accepted formats: PDF only. Max file size: 1GB
                    </p>
                  </div>

                  {formData.position && formData.position.toLowerCase().includes('driver') && (
                    <div className="mb-4">
                      <Label htmlFor="driver_license">Driver's License *</Label>
                      <Input
                        id="driver_license"
                        name="driver_license"
                        type="file"
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        accept="image/*,.pdf"
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Required for Driver positions. Accepted formats: PDF, Images
                      </p>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="termsAccepted"
                        checked={formData.termsAccepted}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, termsAccepted: checked }))}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor="termsAccepted" className="text-sm">
                        I agree to the Terms & Conditions
                      </Label>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      By submitting this application, you confirm that the information you provided is true and accurate to the best of your knowledge. You agree that Joli Tours may use your information for recruitment and hiring purposes and may contact you via email or phone regarding your application.
                    </p>
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}



        <Footer />
        <Toaster />
      </div>
    </div>
  )
}