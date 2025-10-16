// src/components/ui/mood-chart-7days.tsx
'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts'

// Helper functions at the TOP
const getMoodColor = (mood: number) => {
  if (mood < 25) return '#f87171'
  if (mood < 50) return '#60a5fa' 
  if (mood < 75) return '#34d399'
  return '#8b5cf6'
}

const getMoodGradient = (mood: number) => {
  if (mood < 25) return ['#fecaca', '#f87171']
  if (mood < 50) return ['#bfdbfe', '#60a5fa']
  if (mood < 75) return ['#a7f3d0', '#34d399']
  return ['#ddd6fe', '#8b5cf6']
}

interface MoodEntry {
  mood: number
  timestamp: any
  id?: string
  note?: string
}

interface MoodChart7DaysProps {
  moodEntries?: MoodEntry[]
  height?: number
  showLabels?: boolean
  showGrid?: boolean
  compact?: boolean
  variant?: 'line' | 'bar' | 'area'
  showTooltip?: boolean
  className?: string
}

interface ChartDay {
  date: string
  day: string
  fullDay: string
  mood: number | null
  index: number
  fill?: string
}

export function MoodChart7Days({ 
  moodEntries = [], 
  height = 200, 
  showLabels = true, 
  showGrid = true,
  compact = false,
  variant = 'line',
  showTooltip = true,
  className = ""
}: MoodChart7DaysProps) {
  const chartData = useMemo(() => {
    const days: ChartDay[] = []
    const dayNames = compact ? ['N', 'P', 'W', 'Ś', 'C', 'P', 'S'] : ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb']
    const fullDayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota']
    
    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split('T')[0]
      const dayIndex = date.getDay()
      
      // Initialize day data
      const dayData: ChartDay = {
        date: dateString,
        day: dayNames[dayIndex],
        fullDay: fullDayNames[dayIndex],
        mood: null,
        index: 6 - i
      }

      // Try to find matching mood entry
      try {
        const matchingEntry = moodEntries.find(entry => {
          let entryDate: Date
          
          // Handle different timestamp formats
          if (entry.timestamp?.toDate) {
            entryDate = entry.timestamp.toDate()
          } else if (entry.timestamp instanceof Date) {
            entryDate = entry.timestamp
          } else if (typeof entry.timestamp === 'string') {
            entryDate = new Date(entry.timestamp)
          } else if (entry.timestamp?.seconds) {
            entryDate = new Date(entry.timestamp.seconds * 1000)
          } else {
            return false
          }

          if (isNaN(entryDate.getTime())) return false
          
          const entryDateString = entryDate.toISOString().split('T')[0]
          return entryDateString === dateString
        })

        if (matchingEntry) {
          const moodValue = Math.max(0, Math.min(100, matchingEntry.mood || 50))
          dayData.mood = moodValue
          dayData.fill = getMoodColor(moodValue)
        }
      } catch (error) {
        console.error('Error processing mood entry:', error)
      }

      days.push(dayData)
    }

    return days
  }, [moodEntries, compact])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-slate-200 shadow-xl"
        >
          <p className="font-semibold text-slate-800 text-sm">{data.fullDay}</p>
          <p className="text-slate-600 text-sm mt-1">
            Nastrój: <span className="font-bold" style={{ color: getMoodColor(payload[0].value) }}>
              {payload[0].value}%
            </span>
          </p>
          {data.date && (
            <p className="text-slate-500 text-xs mt-1">
              {new Date(data.date).toLocaleDateString('pl-PL')}
            </p>
          )}
        </motion.div>
      )
    }
    return null
  }

  const CustomizedDot = (props: any) => {
    const { cx, cy, payload } = props

    if (payload.mood === null) return null

    return (
      <motion.circle
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: payload.index * 0.1 }}
        whileHover={{ scale: 1.5 }}
        cx={cx}
        cy={cy}
        r={4}
        fill={getMoodColor(payload.mood)}
        stroke="#fff"
        strokeWidth={2}
        className="cursor-pointer"
      />
    )
  }

  // Check if we have any data
  const hasData = chartData.some(day => day.mood !== null)
  const dataWithValues = chartData.filter(day => day.mood !== null)

  // If no data, show empty state
  if (!hasData || dataWithValues.length === 0) {
    return (
      <EmptyChartState 
        height={height} 
        compact={compact}
        className={className}
      />
    )
  }

  // For single data point, we need to handle it differently
  const isSinglePoint = dataWithValues.length === 1

  return (
    <div 
      className={`w-full ${className}`}
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        {variant === 'line' ? (
          <LineChart 
            data={isSinglePoint ? [dataWithValues[0], dataWithValues[0]] : chartData} 
            margin={{ top: 10, right: 10, left: 0, bottom: compact ? 0 : 10 }}
          >
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#f1f5f9"
                horizontal={true}
                vertical={false}
              />
            )}
            
            <XAxis 
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: compact ? 10 : 12, 
                fill: '#64748b',
                fontWeight: 500 
              }}
              tickMargin={8}
              interval={0}
            />
            
            {showLabels && (
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fontSize: compact ? 10 : 12, 
                  fill: '#64748b' 
                }}
                tickMargin={8}
                domain={[0, 100]}
                tickFormatter={(value) => compact ? `${value}` : `${value}%`}
                width={compact ? 20 : 30}
              />
            )}
            
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            
            <Line
              type={isSinglePoint ? "linear" : "monotone"}
              dataKey="mood"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={<CustomizedDot />}
              activeDot={{ 
                r: 6, 
                fill: '#7c3aed',
                stroke: '#fff',
                strokeWidth: 2
              }}
              connectNulls={false}
            />
          </LineChart>
        ) : variant === 'area' ? (
          <AreaChart 
            data={isSinglePoint ? [dataWithValues[0], dataWithValues[0]] : chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: compact ? 0 : 10 }}
          >
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#f1f5f9"
                horizontal={true}
                vertical={false}
              />
            )}
            
            <XAxis 
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: compact ? 10 : 12, 
                fill: '#64748b',
                fontWeight: 500 
              }}
              tickMargin={8}
              interval={0}
            />
            
            {showLabels && (
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fontSize: compact ? 10 : 12, 
                  fill: '#64748b' 
                }}
                tickMargin={8}
                domain={[0, 100]}
                tickFormatter={(value) => compact ? `${value}` : `${value}%`}
                width={compact ? 20 : 30}
              />
            )}
            
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            
            <defs>
              <linearGradient id="moodAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <Area
              type="monotone"
              dataKey="mood"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#moodAreaGradient)"
              dot={<CustomizedDot />}
              activeDot={{ 
                r: 6, 
                fill: '#7c3aed',
                stroke: '#fff',
                strokeWidth: 2
              }}
              connectNulls={false}
            />
          </AreaChart>
        ) : (
          // Bar Chart
          <BarChart 
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: compact ? 0 : 10 }}
          >
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#f1f5f9"
                horizontal={true}
                vertical={false}
              />
            )}
            
            <XAxis 
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: compact ? 10 : 12, 
                fill: '#64748b',
                fontWeight: 500 
              }}
              tickMargin={8}
              interval={0}
            />
            
            {showLabels && (
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fontSize: compact ? 10 : 12, 
                  fill: '#64748b' 
                }}
                tickMargin={8}
                domain={[0, 100]}
                tickFormatter={(value) => compact ? `${value}` : `${value}%`}
                width={compact ? 20 : 30}
              />
            )}
            
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            
            <Bar 
              dataKey="mood" 
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              className="transition-all duration-300 hover:opacity-80"
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

// Empty state component
function EmptyChartState({ height, compact, className }: { height: number, compact: boolean, className: string }) {
  return (
    <div 
      className={`flex flex-col items-center justify-center text-slate-400 ${className}`}
      style={{ height }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="text-3xl mb-3">📊</div>
        <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>
          {compact ? 'Brak danych' : 'Brak danych z ostatnich 7 dni'}
        </p>
        {!compact && (
          <p className="text-xs text-slate-500 mt-1">
            Dodaj wpisy nastroju, aby zobaczyć wykres
          </p>
        )}
      </motion.div>
    </div>
  )
}

// Simple compact version for small widgets
export function SimpleMoodChart({ 
  moodEntries = [], 
  height = 60,
  variant = 'bar'
}: MoodChart7DaysProps) {
  const chartData = useMemo(() => {
    const days: any[] = []
    const dayNames = ['N', 'P', 'W', 'Ś', 'C', 'P', 'S']
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split('T')[0]
      
      const dayData: any = {
        day: dayNames[date.getDay()],
        mood: null
      }

      try {
        const matchingEntry = moodEntries.find(entry => {
          let entryDate: Date
          
          if (entry.timestamp?.toDate) {
            entryDate = entry.timestamp.toDate()
          } else if (entry.timestamp instanceof Date) {
            entryDate = entry.timestamp
          } else if (typeof entry.timestamp === 'string') {
            entryDate = new Date(entry.timestamp)
          } else if (entry.timestamp?.seconds) {
            entryDate = new Date(entry.timestamp.seconds * 1000)
          } else {
            return false
          }

          if (isNaN(entryDate.getTime())) return false
          return entryDate.toISOString().split('T')[0] === dateString
        })

        if (matchingEntry) {
          dayData.mood = Math.max(0, Math.min(100, matchingEntry.mood || 50))
        }
      } catch (error) {
        console.error('Error processing mood entry:', error)
      }

      days.push(dayData)
    }

    return days
  }, [moodEntries])

  const hasData = chartData.some(day => day.mood !== null)

  if (!hasData) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-slate-300">
        <span className="text-xs">-</span>
      </div>
    )
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {variant === 'line' ? (
          <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
            <Line
              type="monotone"
              dataKey="mood"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              activeDot={false}
            />
          </LineChart>
        ) : (
          <BarChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <Bar 
              dataKey="mood" 
              fill="#8b5cf6"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

// Mini sparkline version for really small spaces
export function MoodSparkline({ moodEntries = [], height = 20 }: MoodChart7DaysProps) {
  const chartData = useMemo(() => {
    const days: any[] = []
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split('T')[0]
      
      const dayData: any = {
        mood: null
      }

      try {
        const matchingEntry = moodEntries.find(entry => {
          let entryDate: Date
          
          if (entry.timestamp?.toDate) {
            entryDate = entry.timestamp.toDate()
          } else if (entry.timestamp instanceof Date) {
            entryDate = entry.timestamp
          } else if (typeof entry.timestamp === 'string') {
            entryDate = new Date(entry.timestamp)
          } else if (entry.timestamp?.seconds) {
            entryDate = new Date(entry.timestamp.seconds * 1000)
          } else {
            return false
          }

          if (isNaN(entryDate.getTime())) return false
          return entryDate.toISOString().split('T')[0] === dateString
        })

        if (matchingEntry) {
          dayData.mood = Math.max(0, Math.min(100, matchingEntry.mood || 50))
        }
      } catch (error) {
        console.error('Error processing mood entry:', error)
      }

      days.push(dayData)
    }

    return days
  }, [moodEntries])

  const hasData = chartData.some(day => day.mood !== null)

  if (!hasData) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <div className="w-full h-1 bg-slate-200 rounded-full"></div>
      </div>
    )
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Line
            type="monotone"
            dataKey="mood"
            stroke="#8b5cf6"
            strokeWidth={1.5}
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default MoodChart7Days