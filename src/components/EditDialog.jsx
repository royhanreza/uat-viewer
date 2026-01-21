import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { Textarea } from './ui/textarea'
import { Loader2 } from 'lucide-react'

function normalizeSteps(testSteps) {
  if (Array.isArray(testSteps)) return testSteps.join('\n')
  if (typeof testSteps === 'string') return testSteps
  return ''
}

export function EditDialog({ item, open, onOpenChange, onSave }) {
  const [formData, setFormData] = useState({
    case_id: '',
    module: '',
    test_case: '',
    test_steps: '',
    expected_result: '',
    actual_result: '',
    status: 'Pending',
    note: ''
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setFormData({
        case_id: item.case_id || '',
        module: item.module || '',
        test_case: item.test_case || '',
        test_steps: normalizeSteps(item.test_steps),
        expected_result: item.expected_result || '',
        actual_result: item.actual_result || '',
        status: item.status || 'Pending',
        note: item.note || ''
      })
    }
  }, [item])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Convert test_steps back to array if needed
      const testStepsArray = formData.test_steps
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)

      await onSave({
        ...item,
        ...formData,
        test_steps: testStepsArray
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Test Case</DialogTitle>
          <DialogDescription>
            Update semua informasi test case
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="case-id">Case ID *</Label>
            <Input
              id="case-id"
              value={formData.case_id}
              onChange={(e) => handleChange('case_id', e.target.value)}
              placeholder="Masukkan Case ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="module">Module *</Label>
            <Input
              id="module"
              value={formData.module}
              onChange={(e) => handleChange('module', e.target.value)}
              placeholder="Masukkan Module"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-case">Test Case *</Label>
            <Textarea
              id="test-case"
              value={formData.test_case}
              onChange={(e) => handleChange('test_case', e.target.value)}
              placeholder="Masukkan Test Case"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-steps">Test Steps (pisahkan dengan enter)</Label>
            <Textarea
              id="test-steps"
              value={formData.test_steps}
              onChange={(e) => handleChange('test_steps', e.target.value)}
              placeholder="Step 1&#10;Step 2&#10;Step 3"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected-result">Expected Result *</Label>
            <Textarea
              id="expected-result"
              value={formData.expected_result}
              onChange={(e) => handleChange('expected_result', e.target.value)}
              placeholder="Masukkan Expected Result"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="actual-result">Actual Result</Label>
            <Textarea
              id="actual-result"
              value={formData.actual_result}
              onChange={(e) => handleChange('actual_result', e.target.value)}
              placeholder="Masukkan Actual Result"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              id="status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <option value="Pass">Pass</option>
              <option value="Fail">Fail</option>
              <option value="Pending">Pending</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Catatan</Label>
            <Textarea
              id="note"
              placeholder="Tambahkan catatan untuk test case ini..."
              value={formData.note}
              onChange={(e) => handleChange('note', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Batal
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
