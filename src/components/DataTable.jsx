import { useState, useMemo } from 'react'
import data from '../data/aerplus.json'
import './DataTable.css'

function DataTable() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterModule, setFilterModule] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [expandedRow, setExpandedRow] = useState(null)

  // Get unique modules for filter
  const uniqueModules = useMemo(() => {
    const modules = [...new Set(data.map(item => item.module))]
    return modules.sort()
  }, [])

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = 
        item.case_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.test_case.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.expected_result.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesModule = filterModule === '' || item.module === filterModule
      const matchesStatus = filterStatus === '' || item.status === filterStatus

      return matchesSearch && matchesModule && matchesStatus
    })
  }, [searchTerm, filterModule, filterStatus])

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index)
  }

  return (
    <div className="data-table-container">
      <div className="table-header">
        <h1>UAT Test Cases</h1>
        <div className="table-info">
          Menampilkan {filteredData.length} dari {data.length} test cases
        </div>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label htmlFor="search">Pencarian:</label>
          <input
            id="search"
            type="text"
            placeholder="Cari berdasarkan Case ID, Module, Test Case..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="module-filter">Filter Module:</label>
          <select
            id="module-filter"
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="filter-select"
          >
            <option value="">Semua Module</option>
            {uniqueModules.map(module => (
              <option key={module} value={module}>{module}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status-filter">Filter Status:</label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">Semua Status</option>
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>No</th>
              <th style={{ width: '100px' }}>Case ID</th>
              <th style={{ width: '200px' }}>Module</th>
              <th style={{ width: '300px' }}>Test Case</th>
              <th style={{ width: '250px' }}>Expected Result</th>
              <th style={{ width: '100px' }}>Status</th>
              <th style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  Tidak ada data yang ditemukan
                </td>
              </tr>
            ) : (
              filteredData.map((item, index) => (
                <>
                  <tr key={item.case_id} className={expandedRow === index ? 'expanded' : ''}>
                    <td className="row-number">{index + 1}</td>
                    <td className="case-id">{item.case_id}</td>
                    <td className="module">{item.module}</td>
                    <td className="test-case">{item.test_case}</td>
                    <td className="expected-result">{item.expected_result}</td>
                    <td>
                      <span className={`status-badge ${item.status.toLowerCase()}`}>
                        {item.status || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="expand-btn"
                        onClick={() => toggleRow(index)}
                        aria-label="Toggle details"
                      >
                        {expandedRow === index ? '−' : '+'}
                      </button>
                    </td>
                  </tr>
                  {expandedRow === index && (
                    <tr key={`${item.case_id}-detail`} className="detail-row">
                      <td colSpan="7" className="detail-cell">
                        <div className="detail-content">
                          <div className="detail-section">
                            <h4>Test Steps:</h4>
                            <ol>
                              {item.test_steps.map((step, stepIndex) => (
                                <li key={stepIndex}>{step}</li>
                              ))}
                            </ol>
                          </div>
                          {item.actual_result && (
                            <div className="detail-section">
                              <h4>Actual Result:</h4>
                              <p>{item.actual_result}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DataTable
