import React, { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import { 
  TrendingUp, 
  Download, 
  FileSpreadsheet, 
  BarChart3, 
  LineChart as LineIcon,
  AlertTriangle,
  RefreshCw,
  TrendingDown,
  Loader,
  CheckCircle
} from 'lucide-react'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  Filler,
} from 'chart.js'
import { formatINR } from './DashboardView'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  ChartLegend,
  Filler
)

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#a855f7']

export default function AnalyticsView({ onRefresh }) {
  const [pnlData, setPnlData] = useState([])
  const [revenueData, setRevenueData] = useState([])
  const [loading, setLoading] = useState(true)
  
  // PDF compilation mock states
  const [compilingPDF, setCompilingPDF] = useState(false)
  const [pdfProgress, setPdfProgress] = useState(0)
  const [pdfSuccess, setPdfSuccess] = useState(false)

  // CSV export mock states
  const [exportingCSV, setExportingCSV] = useState(false)

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const pnlRes = await fetch('/api/analytics/pnl')
      const pnl = await pnlRes.json()
      setPnlData(pnl)

      const revRes = await fetch('/api/analytics/revenue-summary')
      const rev = await revRes.json()
      setRevenueData(rev)
    } catch (e) {
      console.error("Error fetching analytics details:", e)
    } finally {
      // Small delay to make transition look premium
      setTimeout(() => setLoading(false), 500)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  // Trigger PDF generation
  const handleExportPDF = () => {
    setCompilingPDF(true)
    setPdfProgress(0)
    setPdfSuccess(false)
    
    // Simulate compilation steps for visual effect
    const interval = setInterval(() => {
      setPdfProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setCompilingPDF(false)
          setPdfSuccess(true)
          
          // Trigger the actual PDF download
          generateFinancialPDF()

          // Reset success checkmark after 3 seconds
          setTimeout(() => setPdfSuccess(false), 3000)
          return 100
        }
        return prev + 20
      })
    }, 300)
  }

  const generateFinancialPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    const primaryColor = [15, 23, 42]   // slate-900
    const accentColor = [234, 88, 12]   // orange-600
    const mutedColor = [100, 116, 139]  // slate-500
    const lightBg = [248, 250, 252]    // slate-50

    // Title banner
    doc.setFillColor(...accentColor)
    doc.rect(0, 0, 297, 8, 'F')

    // Header
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(...primaryColor)
    doc.text('DHATRI CONSTRUCTIONS', 20, 22)

    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...mutedColor)
    doc.text('ENTERPRISE FINANCIAL PERFORMANCE & P&L LEDGER', 20, 27)

    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...accentColor)
    doc.text('AUDITED STATEMENT', 220, 22)

    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...mutedColor)
    doc.text(`DATE OF EXPORT: ${new Date().toLocaleDateString()}`, 220, 27)

    // Divider line
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.5)
    doc.line(20, 31, 277, 31)

    // ── SUMMARY PANEL ──
    const totalContract = pnlData.reduce((sum, p) => sum + p.contract_value, 0)
    const totalCollected = pnlData.reduce((sum, p) => sum + p.amount_received, 0)
    const totalExpenses = pnlData.reduce((sum, p) => sum + p.total_expenses, 0)
    const totalProfit = pnlData.reduce((sum, p) => sum + p.net_profit, 0)
    const averageMargin = pnlData.length > 0 ? (totalProfit / totalContract) * 100 : 0

    doc.setFillColor(...lightBg)
    doc.rect(20, 37, 257, 24, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.rect(20, 37, 257, 24, 'S')

    // Summary text
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...mutedColor)
    doc.text('TOTAL VALUATION', 25, 43)
    doc.text('TOTAL REVENUE', 80, 43)
    doc.text('TOTAL OUTLAYS', 135, 43)
    doc.text('NET OPERATING PROFIT', 190, 43)
    doc.text('NET MARGIN', 245, 43)

    doc.setFontSize(12)
    doc.setTextColor(...primaryColor)
    doc.text(formatINR(totalContract), 25, 52)
    doc.text(formatINR(totalCollected), 80, 52)
    doc.text(formatINR(totalExpenses), 135, 52)
    doc.setTextColor(...(totalProfit >= 0 ? [6, 95, 70] : [153, 27, 27])) // Green or red
    doc.text(formatINR(totalProfit), 190, 52)
    doc.text(`${averageMargin.toFixed(1)}%`, 245, 52)

    // ── FINANCIAL LEDGER TABLE ──
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...primaryColor)
    doc.text('PROJECT STATEMENT BREAKDOWN', 20, 72)
    doc.setDrawColor(...accentColor)
    doc.setLineWidth(0.8)
    doc.line(20, 74, 50, 74)

    // Table Header
    doc.setFillColor(241, 245, 249)
    doc.rect(20, 80, 257, 8, 'F')
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...primaryColor)
    doc.text('PROJECT NAME', 23, 85.5)
    doc.text('CLIENT', 70, 85.5)
    doc.text('CONTRACT VALUE', 115, 85.5)
    doc.text('AMOUNT RECEIVED', 160, 85.5)
    doc.text('TOTAL EXPENSES', 205, 85.5)
    doc.text('NET PROFIT/LOSS', 245, 85.5)

    // Table rows
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(8.5)
    let y = 94
    const pageHeightLimit = 185

    pnlData.forEach((p, index) => {
      if (y > pageHeightLimit) {
        doc.addPage()
        doc.setFillColor(...accentColor)
        doc.rect(0, 0, 297, 8, 'F')
        
        doc.setFont('Helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(...primaryColor)
        doc.text('DHATRI CONSTRUCTIONS - FINANCIAL LEDGER AUDIT (CONT.)', 20, 20)
        
        doc.setDrawColor(226, 232, 240)
        doc.line(20, 24, 277, 24)
        
        doc.setFillColor(241, 245, 249)
        doc.rect(20, 28, 257, 8, 'F')
        doc.text('PROJECT NAME', 23, 33.5)
        doc.text('CLIENT', 70, 33.5)
        doc.text('CONTRACT VALUE', 115, 33.5)
        doc.text('AMOUNT RECEIVED', 160, 33.5)
        doc.text('TOTAL EXPENSES', 205, 33.5)
        doc.text('NET PROFIT/LOSS', 245, 33.5)
        
        doc.setFont('Helvetica', 'normal')
        doc.setFontSize(8.5)
        y = 42
      }

      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252)
        doc.rect(20, y - 5, 257, 7, 'F')
      }

      doc.setTextColor(...primaryColor)
      doc.text(p.name, 23, y)
      doc.text(p.client, 70, y)
      doc.text(formatINR(p.contract_value), 115, y)
      doc.text(formatINR(p.amount_received), 160, y)
      doc.text(formatINR(p.total_expenses), 205, y)
      doc.setTextColor(...(p.net_profit >= 0 ? [6, 95, 70] : [153, 27, 27]))
      doc.text(formatINR(p.net_profit), 245, y)

      doc.setDrawColor(241, 245, 249)
      doc.setLineWidth(0.3)
      doc.line(20, y + 2, 277, y + 2)

      y += 7.5
    })

    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.5)
      doc.line(20, 192, 277, 192)

      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...mutedColor)
      doc.text('Dhatri Constructions - Enterprise Resource Ledger Statement (Confidential)', 20, 197)
      doc.text(`Page ${i} of ${totalPages}`, 260, 197)
    }

    doc.save(`dhatri_financials_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  // Trigger Mock CSV export
  const handleExportCSV = () => {
    setExportingCSV(true)
    setTimeout(() => {
      setExportingCSV(false)
      // Standard CSV construction
      const headers = ["Project ID", "Project Name", "Client", "Contract Value (INR)", "Amount Collected (INR)", "Total Expenses (INR)", "Net Profit/Loss (INR)", "Profit Margin (%)"]
      const csvRows = [headers.join(",")]
      
      pnlData.forEach(p => {
        csvRows.push([
          p.id,
          `"${p.name}"`,
          `"${p.client}"`,
          p.contract_value,
          p.amount_received,
          p.total_expenses,
          p.net_profit,
          p.profit_margin.toFixed(2)
        ].join(","))
      })

      const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `Dhatri_Constructions_PNL_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }, 1000)
  }

  // Prepare Outstanding Dues Bar Chart Data
  const getOutstandingBarData = () => {
    return pnlData.map(p => ({
      name: p.name.split(' ')[0] + '...', // short name
      fullName: p.name,
      outstanding: p.contract_value - p.amount_received
    }))
  }

  const outstandingData = getOutstandingBarData()

  // Chart.js configuration for Revenue collections (Line / Area)
  const revenueChartData = {
    labels: revenueData.map(d => d.month),
    datasets: [
      {
        label: 'Collected',
        data: revenueData.map(d => d.revenue),
        borderColor: '#f59e0b',
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
          gradient.addColorStop(1, 'rgba(245, 158, 11, 0.01)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointBackgroundColor: '#f59e0b',
        pointHoverRadius: 6,
      }
    ]
  }

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return ` Collected: ${formatINR(context.raw)}`;
          }
        },
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 8,
        displayColors: false,
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 10
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(30, 41, 59, 0.3)'
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 10
          },
          callback: function(value) {
            return `₹${value/100000}L`;
          }
        }
      }
    }
  }

  // Chart.js configuration for Outstanding dues (Bar)
  const outstandingChartData = {
    labels: outstandingData.map(d => d.name),
    datasets: [
      {
        label: 'Outstanding',
        data: outstandingData.map(d => d.outstanding),
        backgroundColor: outstandingData.map((_, index) => COLORS[index % COLORS.length]),
        borderRadius: 4,
        borderWidth: 0,
      }
    ]
  }

  const outstandingChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            const index = context[0].dataIndex;
            return outstandingData[index]?.fullName || context[0].label;
          },
          label: function(context) {
            return ` Outstanding: ${formatINR(context.raw)}`;
          }
        },
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 8,
        displayColors: false,
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 10
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(30, 41, 59, 0.3)'
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 10
          },
          callback: function(value) {
            return `₹${value/100000}L`;
          }
        }
      }
    }
  }

  // Calculate global aggregate indicators for analytics dashboard
  const totalContract = pnlData.reduce((acc, p) => acc + p.contract_value, 0)
  const totalRevenue = pnlData.reduce((acc, p) => acc + p.amount_received, 0)
  const totalExpenses = pnlData.reduce((acc, p) => acc + p.total_expenses, 0)
  const netEarnings = totalRevenue - totalExpenses
  const netMargin = totalRevenue > 0 ? (netEarnings / totalRevenue * 100) : 0

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-900/40 border border-slate-800/60 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-900/40 border border-slate-800/60 rounded-xl" />
          <div className="h-72 bg-slate-900/40 border border-slate-800/60 rounded-xl" />
        </div>
        <div className="h-96 bg-slate-900/40 border border-slate-800/60 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* ── Mock PDF compiling loader panel overlay ── */}
      {compilingPDF && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-sm w-full space-y-4 shadow-2xl text-center flex flex-col items-center">
            <Loader className="w-8 h-8 text-orange-500 animate-spin" />
            <h4 className="text-base font-bold text-white font-display uppercase tracking-wider">Generating Financial PDF</h4>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div 
                className="gradient-accent h-full rounded-full transition-all duration-300"
                style={{ width: `${pdfProgress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 font-mono">Compiling ledger balances... {pdfProgress}%</p>
          </div>
        </div>
      )}

      {/* ── Page Header & CTAs ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Financial Analytics</h2>
          <p className="text-sm text-slate-400">P&L matrix tables and macro revenue aggregations.</p>
        </div>
        <div className="flex items-center gap-3">
          
          {/* Mock PDF compilation trigger */}
          <button
            onClick={handleExportPDF}
            disabled={pdfSuccess}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all focus-ring shadow-lg ${
              pdfSuccess 
                ? 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-400' 
                : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/10'
            }`}
          >
            {pdfSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                PDF Compiled!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Compile PDF Report
              </>
            )}
          </button>

          {/* Export to CSV */}
          <button
            onClick={handleExportCSV}
            disabled={exportingCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors focus-ring"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {exportingCSV ? 'Exporting...' : 'Export P&L CSV'}
          </button>
        </div>
      </div>

      {/* ── Executive Performance Widgets ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Combined Contract Values */}
        <div className="glass-panel p-5 rounded-xl border-slate-800/80">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block">Combined Value</span>
          <h3 className="text-2xl font-display font-bold text-white mt-1">{formatINR(totalContract)}</h3>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-2 font-medium">
            <span>Portfolio active contracts total</span>
          </div>
        </div>

        {/* Card 2: Accumulated Collected Revenues */}
        <div className="glass-panel p-5 rounded-xl border-slate-800/80">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block">Collected revenue</span>
          <h3 className="text-2xl font-display font-bold text-emerald-400 mt-1">{formatINR(totalRevenue)}</h3>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/80 mt-2 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{((totalRevenue/totalContract)*100).toFixed(0)}% billing collection completion</span>
          </div>
        </div>

        {/* Card 3: Total Logged Expenditures */}
        <div className="glass-panel p-5 rounded-xl border-slate-800/80">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block">Logged Costs</span>
          <h3 className="text-2xl font-display font-bold text-orange-500 mt-1">{formatINR(totalExpenses)}</h3>
          <div className="flex items-center gap-1.5 text-[10px] text-orange-500/80 mt-2 font-medium">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{((totalExpenses/totalRevenue)*100).toFixed(0)}% cost-to-revenue ratio</span>
          </div>
        </div>

        {/* Card 4: Portfolio Profit Margin */}
        <div className="glass-panel p-5 rounded-xl border-slate-800/80">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block">Net Cash Margin</span>
          <h3 className={`text-2xl font-display font-bold mt-1 ${netEarnings >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
            {netMargin.toFixed(1)}%
          </h3>
          <div className="flex items-center gap-1.5 text-[10px] mt-2 font-medium">
            <span className="text-slate-400">Total Profit:</span>{' '}
            <span className={`font-bold ${netEarnings >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              {formatINR(netEarnings)}
            </span>
          </div>
        </div>

      </div>

      {/* ── Visual Charts Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart A: Monthly Revenue Summary (Area) */}
        <div className="glass-panel p-5 rounded-xl border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <LineIcon className="w-4 h-4 text-orange-500" />
              Monthly Revenue Collections Summary
            </h3>
          </div>

          {revenueData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-slate-500">No payment transaction records found to graph.</div>
          ) : (
            <div className="h-60 w-full text-xs">
              <Line data={revenueChartData} options={revenueChartOptions} />
            </div>
          )}
        </div>

        {/* Chart B: Outstanding collection balances (Bar) */}
        <div className="glass-panel p-5 rounded-xl border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-500" />
              Outstanding Collection Balance by Project
            </h3>
          </div>

          {outstandingData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-slate-500 font-medium">No projects loaded.</div>
          ) : (
            <div className="h-60 w-full text-xs">
              <Bar data={outstandingChartData} options={outstandingChartOptions} />
            </div>
          )}
        </div>

      </div>

      {/* ── System Profit & Loss Engine Table ── */}
      <div className="glass-panel rounded-xl border-slate-800/80 overflow-hidden">
        
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/30 flex justify-between items-center">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Profit & Loss Engine Matrix
          </h3>
          <span className="text-[10px] text-slate-500 font-semibold italic">
            * Margins are calculated mathematically: (Revenue Collected - Logged Expenses) / Revenue Collected
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                <th className="px-5 py-3.5">Project Name</th>
                <th className="px-5 py-3.5 text-right">Contract Value</th>
                <th className="px-5 py-3.5 text-right">Collected Revenue</th>
                <th className="px-5 py-3.5 text-right">Logged Expenses</th>
                <th className="px-5 py-3.5 text-right">Net Profit/Loss</th>
                <th className="px-5 py-3.5 text-right">Margin (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/40">
              {pnlData.map((p) => {
                const isLoss = p.net_profit < 0
                return (
                  <tr key={p.id} className="hover:bg-slate-900/20 text-slate-300 font-medium">
                    <td className="px-5 py-4 min-w-[200px]">
                      <span className="font-bold text-slate-200 block truncate">{p.name}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">{p.client}</span>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold font-mono">{formatINR(p.contract_value)}</td>
                    <td className="px-5 py-4 text-right font-semibold text-emerald-400/95 font-mono">{formatINR(p.amount_received)}</td>
                    <td className="px-5 py-4 text-right font-semibold text-orange-500/95 font-mono">{formatINR(p.total_expenses)}</td>
                    <td className={`px-5 py-4 text-right font-extrabold font-mono ${isLoss ? 'text-rose-500 bg-rose-500/5' : 'text-emerald-400'}`}>
                      {formatINR(p.net_profit)}
                    </td>
                    <td className={`px-5 py-4 text-right font-extrabold font-mono ${isLoss ? 'text-rose-500 bg-rose-500/5' : 'text-emerald-400'}`}>
                      {p.profit_margin.toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  )
}
