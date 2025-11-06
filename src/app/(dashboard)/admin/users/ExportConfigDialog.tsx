'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Settings, Download, CheckCircle2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ExportField {
  key: string
  label: string
}

interface ExportCategory {
  category: string
  fields: ExportField[]
}

interface ExportConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableFields: ExportCategory[]
  selectedFields: string[]
  onToggleField: (fieldKey: string) => void
  onSelectCategory: (category: string) => void
  onExport: () => void
  roleFilter: string
  onRoleFilterChange: (role: string) => void
}

export function ExportConfigDialog({
  open,
  onOpenChange,
  availableFields,
  selectedFields,
  onToggleField,
  onSelectCategory,
  onExport,
  roleFilter,
  onRoleFilterChange
}: ExportConfigDialogProps) {
  const handleExport = () => {
    onExport()
    onOpenChange(false)
  }

  const getCategorySelectedCount = (category: ExportCategory) => {
    return category.fields.filter(f => selectedFields.includes(f.key)).length
  }

  const isCategoryFullySelected = (category: ExportCategory) => {
    return category.fields.every(f => selectedFields.includes(f.key))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 sm:p-6 pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            Configure CSV Export
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Select the fields you want to include in your export
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 sm:px-6 space-y-3">
          {/* Role Filter Section */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-2.5 sm:p-3">
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-semibold text-gray-900">
                Filter by Role
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
                {[
                  { value: 'all', label: 'All Roles', icon: '👥' },
                  { value: 'student', label: 'Students', icon: '🎓' },
                  { value: 'teacher', label: 'Teachers', icon: '👨‍🏫' },
                  { value: 'parent', label: 'Parents', icon: '👨‍👩‍👧' },
                  { value: 'admin', label: 'Admins', icon: '⚙️' }
                ].map((role) => (
                  <button
                    key={role.value}
                    onClick={() => onRoleFilterChange(role.value)}
                    className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all min-h-[36px] sm:min-h-0 ${
                      roleFilter === role.value
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <span className="text-sm sm:text-base">{role.icon}</span>
                    <span className="hidden xs:inline">{role.label}</span>
                    <span className="xs:hidden">{role.label.replace('s', '')}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fields Selection Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-2.5 sm:p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                  {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              {selectedFields.length === 0 && (
                <Badge variant="destructive" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 flex-shrink-0">
                  Select one
                </Badge>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[50vh] px-4 sm:px-6">
          <div className="space-y-3 sm:space-y-4 pb-4">
            {availableFields.map((category) => {
              const selectedCount = getCategorySelectedCount(category)
              const isFullySelected = isCategoryFullySelected(category)
              
              return (
                <div key={category.category} className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => onSelectCategory(category.category)}
                      className="flex items-center gap-2 sm:gap-2.5 hover:bg-gray-50 active:bg-gray-100 p-2 sm:p-2.5 rounded-lg transition-colors w-full min-h-[44px] sm:min-h-0"
                    >
                      <Checkbox
                        checked={isFullySelected}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0"
                      />
                      <Label className="font-semibold text-sm sm:text-base text-gray-900 cursor-pointer flex-1 text-left">
                        {category.category}
                      </Label>
                      <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 flex-shrink-0">
                        {selectedCount}/{category.fields.length}
                      </Badge>
                    </button>
                  </div>
                  
                  <div className="ml-4 sm:ml-6 space-y-1 sm:space-y-1.5">
                    {category.fields.map((field) => (
                      <button
                        key={field.key}
                        onClick={() => onToggleField(field.key)}
                        className="flex items-center gap-2 hover:bg-gray-50 active:bg-gray-100 p-2 rounded-lg transition-colors w-full min-h-[40px] sm:min-h-0"
                      >
                        <Checkbox
                          checked={selectedFields.includes(field.key)}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"
                        />
                        <Label className="text-xs sm:text-sm text-gray-700 cursor-pointer flex-1 text-left">
                          {field.label}
                        </Label>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-4 sm:p-6 sm:pt-3 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-11 sm:h-10 text-sm sm:text-base"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedFields.length === 0}
            className="flex-1 h-11 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-sm sm:text-base"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden xs:inline">Export CSV ({selectedFields.length})</span>
            <span className="xs:hidden">Export ({selectedFields.length})</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
