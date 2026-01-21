import { Fragment, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Combobox } from './ui/combobox'
import { Skeleton } from './ui/skeleton'
import { useToast } from './ui/toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { EditDialog } from './EditDialog'
import { Search, Filter, ChevronDown, ChevronUp, Loader2, Edit } from 'lucide-react'

function normalizeSteps(testSteps) {
  if (Array.isArray(testSteps)) return testSteps
  if (typeof testSteps === 'string') {
    return testSteps
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
  }
  return []
}

function DataTable() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterModule, setFilterModule] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [expandedRow, setExpandedRow] = useState(null)
  const [rows, setRows] = useState([])
  const [loadError, setLoadError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [editingItem, setEditingItem] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  const { addToast } = useToast()

  useEffect(() => {
    let cancelled = false

    async function loadFromSupabase() {
      if (!supabase) {
        setLoadError(
          'Supabase client not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY in .env and restart.',
        )
        setIsLoading(false)
        return
      }

      const table = import.meta.env.VITE_SUPABASE_TABLE || 'uat'
      // Prefer sorting by numeric `id` (if the table has it), otherwise fallback to `case_id`.
      let result = await supabase.from(table).select('*').order('id', { ascending: true })
      if (result.error) {
        result = await supabase.from(table).select('*').order('case_id', { ascending: true })
      }
      const { data, error } = result

      if (cancelled) return

      if (error) {
        setLoadError(`${error.message} (table: ${table})`)
        setIsLoading(false)
        return
      }

      setRows(Array.isArray(data) ? data : [])
      setLoadError('')
      setIsLoading(false)
    }

    loadFromSupabase()

    return () => {
      cancelled = true
    }
  }, [])

  // Get unique modules for filter
  const uniqueModules = useMemo(() => {
    const modules = [...new Set(rows.map(item => item.module).filter(Boolean))]
    return modules.sort()
  }, [rows])

  // Convert modules to combobox options
  const moduleOptions = useMemo(() => {
    return [
      { value: '', label: 'Semua Module' },
      ...uniqueModules.map(module => ({
        value: module,
        label: module
      }))
    ]
  }, [uniqueModules])

  // Calculate statistics
  const statistics = useMemo(() => {
    const stats = {
      total: rows.length,
      pass: 0,
      fail: 0,
      pending: 0
    }

    rows.forEach(item => {
      const status = (item.status || 'Pending').toLowerCase()
      if (status === 'pass') stats.pass++
      else if (status === 'fail') stats.fail++
      else stats.pending++
    })

    return stats
  }, [rows])

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return rows.filter(item => {
      const searchableSteps = normalizeSteps(item.test_steps).join(' ')
      const matchesSearch =
        term === '' ||
        (item.case_id || '').toLowerCase().includes(term) ||
        (item.module || '').toLowerCase().includes(term) ||
        (item.test_case || '').toLowerCase().includes(term) ||
        (item.expected_result || '').toLowerCase().includes(term) ||
        (item.actual_result || '').toLowerCase().includes(term) ||
        searchableSteps.toLowerCase().includes(term)
      
      const matchesModule = filterModule === '' || item.module === filterModule
      const matchesStatus = filterStatus === '' || item.status === filterStatus

      return matchesSearch && matchesModule && matchesStatus
    })
  }, [rows, searchTerm, filterModule, filterStatus])

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index)
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setIsEditDialogOpen(true)
  }

  const handleSave = async (updatedItem) => {
    if (!supabase) {
      addToast({
        title: 'Error',
        description: 'Supabase client not configured',
        variant: 'error'
      })
      return
    }

    const table = import.meta.env.VITE_SUPABASE_TABLE || 'uat'
    
    const { error } = await supabase
      .from(table)
      .update({
        case_id: updatedItem.case_id,
        module: updatedItem.module,
        test_case: updatedItem.test_case,
        test_steps: updatedItem.test_steps,
        expected_result: updatedItem.expected_result,
        actual_result: updatedItem.actual_result,
        status: updatedItem.status,
        note: updatedItem.note
      })
      .eq('id', updatedItem.id)

    if (error) {
      addToast({
        title: 'Error',
        description: `Gagal menyimpan: ${error.message}`,
        variant: 'error'
      })
      throw error
    }

    // Update local state
    setRows(prevRows => 
      prevRows.map(row => 
        row.id === updatedItem.id 
          ? { ...row, ...updatedItem }
          : row
      )
    )

    // Show success toast
    addToast({
      title: 'Berhasil',
      description: 'Test case berhasil diperbarui',
      variant: 'success'
    })
  }

  const getStatusVariant = (status) => {
    const statusLower = (status || 'pending').toLowerCase()
    switch (statusLower) {
      case 'pass':
        return 'success'
      case 'fail':
        return 'destructive'
      case 'pending':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">UAT Test Cases</CardTitle>
          <CardDescription>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat data dari Supabase...
              </div>
            ) : (
              <>
                Menampilkan {filteredData.length} dari {rows.length} test cases
                {loadError && (
                  <span className="text-destructive ml-2">
                    • Error: {loadError}
                  </span>
                )}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statistics Section */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <Skeleton className="h-4 w-16 mx-auto" />
                      <Skeleton className="h-9 w-20 mx-auto" />
                      <Skeleton className="h-3 w-12 mx-auto" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-3xl font-bold">{statistics.total}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">Pass</p>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-400">{statistics.pass}</p>
                    <p className="text-xs text-muted-foreground">
                      {statistics.total > 0 ? Math.round((statistics.pass / statistics.total) * 100) : 0}%
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">Fail</p>
                    <p className="text-3xl font-bold text-red-700 dark:text-red-400">{statistics.fail}</p>
                    <p className="text-xs text-muted-foreground">
                      {statistics.total > 0 ? Math.round((statistics.fail / statistics.total) * 100) : 0}%
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Pending</p>
                    <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{statistics.pending}</p>
                    <p className="text-xs text-muted-foreground">
                      {statistics.total > 0 ? Math.round((statistics.pending / statistics.total) * 100) : 0}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters Section */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="search" className="text-sm font-medium flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Pencarian
                </label>
                <Input
                  id="search"
                  type="text"
                  placeholder="Cari Case ID, Module, Test Case..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter Module
                </label>
                <Combobox
                  options={moduleOptions}
                  value={filterModule}
                  onChange={setFilterModule}
                  placeholder="Pilih module..."
                  searchPlaceholder="Cari module..."
                  emptyText="Module tidak ditemukan."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="status-filter" className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter Status
                </label>
                <Select
                  id="status-filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Semua Status</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                  <option value="Pending">Pending</option>
                </Select>
              </div>
            </div>
          )}

          {/* Table Section */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">No</TableHead>
                  <TableHead className="w-[120px]">Case ID</TableHead>
                  <TableHead className="w-[200px]">Module</TableHead>
                  <TableHead className="min-w-[300px]">Test Case</TableHead>
                  <TableHead className="min-w-[250px]">Expected Result</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-9 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-9 w-9" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Search className="h-8 w-8 mb-2" />
                        <p>Tidak ada data yang ditemukan</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item, index) => (
                    <Fragment key={item.id ?? item.case_id ?? index}>
                      <TableRow className={expandedRow === index ? 'bg-muted/50' : ''}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-mono text-xs">{item.case_id}</TableCell>
                        <TableCell>{item.module}</TableCell>
                        <TableCell>{item.test_case}</TableCell>
                        <TableCell className="text-muted-foreground">{item.expected_result}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(item.status)}>
                            {item.status || 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            aria-label="Edit test case"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRow(index)}
                            aria-label="Toggle details"
                          >
                            {expandedRow === index ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedRow === index && (
                        <TableRow key={`${item.id ?? item.case_id ?? index}-detail`}>
                          <TableCell colSpan={8} className="bg-muted/30">
                            <div className="p-4 space-y-4">
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold">Test Steps:</h4>
                                <ol className="list-decimal list-inside space-y-1 text-sm">
                                  {normalizeSteps(item.test_steps).map((step, stepIndex) => (
                                    <li key={stepIndex} className="text-muted-foreground">{step}</li>
                                  ))}
                                </ol>
                              </div>
                              {item.actual_result && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold">Actual Result:</h4>
                                  <p className="text-sm text-muted-foreground">{item.actual_result}</p>
                                </div>
                              )}
                              {item.note && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold">Catatan:</h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.note}</p>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EditDialog
        item={editingItem}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSave}
      />
    </div>
  )
}

export default DataTable
