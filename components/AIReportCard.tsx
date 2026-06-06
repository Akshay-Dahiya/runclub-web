import React from 'react'

export default function AIReportCard({ report }:{ report:any }) {
  return (
    <div className="p-3 border rounded bg-white dark:bg-gray-800">
      <div className="font-medium">AI Coach</div>
      <div className="text-sm mt-2">{report?.summary}</div>
    </div>
  )
}
