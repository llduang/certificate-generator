'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Upload,
  FileSpreadsheet,
  Users,
  TrendingUp,
  TrendingDown,
  Copy,
  ClipboardList,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Search,
  Trophy,
  ArrowUpDown,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import * as XLSX from 'xlsx'

// ========== 类型定义 ==========

/** 单个学生的排名数据 */
interface StudentRankData {
  name: string
  gradeRank: number | null
  classRank: number | null
  score: number | null
}

/** 一个Excel文件的解析结果 */
interface ParsedExamData {
  fileName: string
  sheetName: string
  students: StudentRankData[]
  allSheetNames: string[]
  selectedSheetName: string
}

/** 进步排名结果 */
interface ProgressResult {
  name: string
  firstRank: number
  secondRank: number
  progress: number
  tied: boolean
}

/** 班级分析结果 */
interface ClassAnalysis {
  totalStudents: number
  avgScore: number | null
  scoreDistribution: {
    excellent: number // ≥90
    good: number // 80-89
    pass: number // 60-79
    fail: number // <60
  }
  rankDistribution: {
    top10: number // 前10%
    top20: number // 前20%
    top50: number // 前50%
    bottom20: number // 后20%
  }
  progressOverview: {
    improved: number
    declined: number
    unchanged: number
    avgProgress: number
  }
}

/** 统计行关键词 */
const STAT_KEYWORDS = [
  '平均分', '及格率', '优秀率', '最高分', '最低分',
  '标准差', '方差', '人数', '合计', '总计', '备注',
]

// ========== 工具函数 ==========

/** 判断一行是否为统计行 */
function isStatRow(row: Record<string, unknown>): boolean {
  const values = Object.values(row).map((v) => String(v ?? '').trim())
  return values.some((v) => STAT_KEYWORDS.some((kw) => v.includes(kw)))
}

/** 从行数据中找到"姓名"列的值 */
function findNameValue(row: Record<string, unknown>): string | null {
  for (const [key, val] of Object.entries(row)) {
    if (key.includes('姓名') && val != null && String(val).trim() !== '') {
      return String(val).trim()
    }
  }
  return null
}

/** 从行数据中找到排名列的值（匹配"*排名"模式） */
function findRankValue(
  row: Record<string, unknown>,
  rankPattern: string
): number | null {
  for (const [key, val] of Object.entries(row)) {
    if (key.includes(rankPattern)) {
      const num = parseFloat(String(val ?? '').replace(/[^0-9.\-]/g, ''))
      if (!isNaN(num) && num > 0) return Math.round(num)
    }
  }
  return null
}

/** 从行数据中找到分数列的值 */
function findScoreValue(row: Record<string, unknown>): number | null {
  for (const [key, val] of Object.entries(row)) {
    if (key.includes('总分') || key.includes('分数') || key === '成绩') {
      const num = parseFloat(String(val ?? '').replace(/[^0-9.\-]/g, ''))
      if (!isNaN(num)) return num
    }
  }
  return null
}

/** 智能匹配班级对应的Sheet */
function matchSheet(
  sheetNames: string[],
  className: string
): string | null {
  if (!className.trim()) return null

  const input = className.trim()

  // 1. 精确匹配
  const exactMatch = sheetNames.find((s) => s === input)
  if (exactMatch) return exactMatch

  // 2. 匹配 "输入 + 班" 模式（输入"1"匹配"1班"）
  const withClassSuffix = sheetNames.find((s) => s === `${input}班`)
  if (withClassSuffix) return withClassSuffix

  // 3. 反向匹配（输入"1班"匹配"1"）
  const strippedInput = input.replace(/班$/, '')
  if (strippedInput !== input) {
    const reverseMatch = sheetNames.find((s) => s === strippedInput)
    if (reverseMatch) return reverseMatch
  }

  // 4. 部分匹配
  const partialMatch = sheetNames.find((s) =>
    s.includes(input) || input.includes(s)
  )
  if (partialMatch) return partialMatch

  return null
}

/** 解析Excel文件 */
function parseExcelFile(
  file: File,
  className?: string
): Promise<ParsedExamData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const allSheetNames = workbook.SheetNames

        // 确定使用哪个Sheet
        let selectedSheetName = allSheetNames[0]
        if (className && className.trim()) {
          const matched = matchSheet(allSheetNames, className)
          if (matched) {
            selectedSheetName = matched
          }
        }

        const worksheet = workbook.Sheets[selectedSheetName]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)

        // 解析学生数据
        const students: StudentRankData[] = []
        for (const row of jsonData) {
          // 跳过统计行
          if (isStatRow(row)) break

          const name = findNameValue(row)
          if (!name) continue

          const gradeRank = findRankValue(row, '年级排名')
          const classRank = findRankValue(row, '班级排名')
          const score = findScoreValue(row)

          // 至少有一个有效排名才纳入
          if (gradeRank !== null || classRank !== null) {
            students.push({ name, gradeRank, classRank, score })
          }
        }

        resolve({
          fileName: file.name,
          sheetName: selectedSheetName,
          students,
          allSheetNames,
          selectedSheetName,
        })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}

/** 计算进步排名（含并列处理） */
function calculateProgress(
  exam1: ParsedExamData,
  exam2: ParsedExamData,
  rankType: 'grade' | 'class',
  topN: number
): ProgressResult[] {
  const rankKey = rankType === 'grade' ? 'gradeRank' : 'classRank'

  // 构建姓名→排名的映射
  const map1 = new Map<string, number>()
  const map2 = new Map<string, number>()

  for (const s of exam1.students) {
    if (s[rankKey] !== null) {
      map1.set(s.name, s[rankKey] as number)
    }
  }
  for (const s of exam2.students) {
    if (s[rankKey] !== null) {
      map2.set(s.name, s[rankKey] as number)
    }
  }

  // 只分析两次都参加的学生
  const results: ProgressResult[] = []
  for (const [name, rank1] of map1) {
    const rank2 = map2.get(name)
    if (rank2 !== undefined) {
      const progress = rank1 - rank2 // 正数=进步
      results.push({ name, firstRank: rank1, secondRank: rank2, progress, tied: false })
    }
  }

  // 按进步排序（降序）
  results.sort((a, b) => b.progress - a.progress)

  // Top N + 并列处理
  if (results.length === 0) return results

  const n = Math.min(topN, results.length)
  const nthProgress = results[n - 1].progress

  // 找出所有与第N名进步值相同的学生
  const expanded = results.filter((r) => r.progress >= nthProgress)

  // 标记并列：如果同一进步值有多人
  const progressCount = new Map<number, number>()
  for (const r of expanded) {
    progressCount.set(r.progress, (progressCount.get(r.progress) || 0) + 1)
  }
  for (const r of expanded) {
    r.tied = (progressCount.get(r.progress) || 0) > 1
  }

  return expanded
}

/** 班级维度分析 */
function analyzeClass(
  exam: ParsedExamData,
  progressResults: ProgressResult[]
): ClassAnalysis {
  const students = exam.students
  const totalStudents = students.length

  // 平均分
  const scoresWithValues = students.filter((s) => s.score !== null)
  const avgScore =
    scoresWithValues.length > 0
      ? scoresWithValues.reduce((sum, s) => sum + (s.score as number), 0) /
        scoresWithValues.length
      : null

  // 分数分布
  const scoreDistribution = { excellent: 0, good: 0, pass: 0, fail: 0 }
  for (const s of scoresWithValues) {
    const score = s.score as number
    if (score >= 90) scoreDistribution.excellent++
    else if (score >= 80) scoreDistribution.good++
    else if (score >= 60) scoreDistribution.pass++
    else scoreDistribution.fail++
  }

  // 排名分布（基于年级排名）
  const gradeRanks = students
    .filter((s) => s.gradeRank !== null)
    .map((s) => s.gradeRank as number)
    .sort((a, b) => a - b)

  const rankDistribution = { top10: 0, top20: 0, top50: 0, bottom20: 0 }
  if (gradeRanks.length > 0) {
    const maxRank = Math.max(...gradeRanks)
    for (const r of gradeRanks) {
      if (r <= maxRank * 0.1) rankDistribution.top10++
      if (r <= maxRank * 0.2) rankDistribution.top20++
      if (r <= maxRank * 0.5) rankDistribution.top50++
      if (r > maxRank * 0.8) rankDistribution.bottom20++
    }
  }

  // 进步概览
  let improved = 0
  let declined = 0
  let unchanged = 0
  let totalProgress = 0
  for (const r of progressResults) {
    if (r.progress > 0) improved++
    else if (r.progress < 0) declined++
    else unchanged++
    totalProgress += r.progress
  }

  const progressOverview = {
    improved,
    declined,
    unchanged,
    avgProgress: progressResults.length > 0
      ? Math.round((totalProgress / progressResults.length) * 10) / 10
      : 0,
  }

  return { totalStudents, avgScore, scoreDistribution, rankDistribution, progressOverview }
}

// ========== 主组件 ==========

export default function GradeAnalysis() {
  const { toast } = useToast()
  const file1Ref = useRef<HTMLInputElement>(null)
  const file2Ref = useRef<HTMLInputElement>(null)

  // 文件上传状态
  const [file1, setFile1] = useState<File | null>(null)
  const [file2, setFile2] = useState<File | null>(null)
  const [file1Uploaded, setFile1Uploaded] = useState(false)
  const [file2Uploaded, setFile2Uploaded] = useState(false)

  // 解析结果
  const [exam1Data, setExam1Data] = useState<ParsedExamData | null>(null)
  const [exam2Data, setExam2Data] = useState<ParsedExamData | null>(null)

  // 配置
  const [className, setClassName] = useState('')
  const [topN, setTopN] = useState(10)
  const [resultTab, setResultTab] = useState('grade')

  // 分析结果
  const [gradeProgress, setGradeProgress] = useState<ProgressResult[]>([])
  const [classProgress, setClassProgress] = useState<ProgressResult[]>([])
  const [classAnalysis1, setClassAnalysis1] = useState<ClassAnalysis | null>(null)
  const [classAnalysis2, setClassAnalysis2] = useState<ClassAnalysis | null>(null)
  const [analyzed, setAnalyzed] = useState(false)

  // 分析中的loading状态
  const [analyzing, setAnalyzing] = useState(false)

  // 处理文件上传
  const handleFileUpload = useCallback(
    async (file: File, examIndex: 1 | 2) => {
      try {
        const data = await parseExcelFile(file, className || undefined)

        if (data.students.length === 0) {
          toast({
            title: '解析失败',
            description: `文件 "${file.name}" 中未找到有效的学生排名数据，请检查是否包含"姓名"和"排名"列`,
            variant: 'destructive',
          })
          return
        }

        if (examIndex === 1) {
          setFile1(file)
          setFile1Uploaded(true)
          setExam1Data(data)
        } else {
          setFile2(file)
          setFile2Uploaded(true)
          setExam2Data(data)
        }

        toast({
          title: '上传成功',
          description: `文件 "${file.name}" 解析成功，使用Sheet"${data.selectedSheetName}"，共${data.students.length}名学生`,
        })

        // 重置分析结果
        setAnalyzed(false)
      } catch (err) {
        toast({
          title: '解析失败',
          description: `无法解析文件 "${file.name}"，请确保为有效的Excel文件`,
          variant: 'destructive',
        })
        console.error(err)
      }
    },
    [className, toast]
  )

  // 文件选择事件
  const onFile1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFileUpload(f, 1)
  }
  const onFile2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFileUpload(f, 2)
  }

  // 执行分析
  const runAnalysis = useCallback(() => {
    if (!exam1Data || !exam2Data) {
      toast({
        title: '请先上传文件',
        description: '需要上传两次考试的Excel文件',
        variant: 'destructive',
      })
      return
    }

    setAnalyzing(true)

    // 使用setTimeout让UI更新
    setTimeout(() => {
      try {
        // 年级排名进步
        const gp = calculateProgress(exam1Data, exam2Data, 'grade', topN)
        setGradeProgress(gp)

        // 班级排名进步
        const cp = calculateProgress(exam1Data, exam2Data, 'class', topN)
        setClassProgress(cp)

        // 班级维度分析
        const ca1 = analyzeClass(exam1Data, gp)
        const ca2 = analyzeClass(exam2Data, gp)
        setClassAnalysis1(ca1)
        setClassAnalysis2(ca2)

        setAnalyzed(true)
        setResultTab('grade')

        toast({
          title: '分析完成',
          description: `年级进步${gp.length}人，班级进步${cp.length}人`,
        })
      } catch (err) {
        toast({
          title: '分析失败',
          description: '计算过程中出现错误，请检查数据格式',
          variant: 'destructive',
        })
        console.error(err)
      } finally {
        setAnalyzing(false)
      }
    }, 100)
  }, [exam1Data, exam2Data, topN, toast])

  // 复制详情
  const copyDetails = useCallback(
    (results: ProgressResult[], type: string) => {
      if (results.length === 0) return
      const lines = results.map(
        (r, i) =>
          `第${i + 1}名：${r.name} — 进步 +${r.progress} 名（${r.firstRank}名→${r.secondRank}名）${r.tied ? '（并列）' : ''}`
      )
      const text = `【${type}进步TOP${results.length}】\n${lines.join('\n')}`
      navigator.clipboard
        .writeText(text)
        .then(() => toast({ title: '复制成功', description: '详细信息已复制到剪贴板' }))
        .catch(() => toast({ title: '复制失败', description: '请手动复制', variant: 'destructive' }))
    },
    [toast]
  )

  // 仅复制姓名
  const copyNames = useCallback(
    (results: ProgressResult[]) => {
      if (results.length === 0) return
      const text = results.map((r) => r.name).join('\n')
      navigator.clipboard
        .writeText(text)
        .then(() => toast({ title: '复制成功', description: '姓名已复制到剪贴板' }))
        .catch(() => toast({ title: '复制失败', description: '请手动复制', variant: 'destructive' }))
    },
    [toast]
  )

  // 获取统计信息
  const getStats = useCallback(() => {
    if (!exam1Data || !exam2Data) return null
    const names1 = new Set(exam1Data.students.map((s) => s.name))
    const names2 = new Set(exam2Data.students.map((s) => s.name))
    const common = [...names1].filter((n) => names2.has(n))
    const only1 = [...names1].filter((n) => !names2.has(n))
    const only2 = [...names2].filter((n) => !names1.has(n))
    return { names1, names2, common, only1, only2 }
  }, [exam1Data, exam2Data])

  const stats = analyzed ? getStats() : null

  // 渲染进度表格
  const renderProgressTable = (results: ProgressResult[], rankLabel: string) => {
    if (results.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>暂无数据</p>
          <p className="text-sm mt-1">请确保两次考试都包含{rankLabel}列</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">名次</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead className="text-center">第一次{rankLabel}</TableHead>
              <TableHead className="text-center">第二次{rankLabel}</TableHead>
              <TableHead className="text-center">
                <span className="inline-flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3" />
                  进步
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((r, i) => (
              <TableRow key={r.name} className="hover:bg-amber-50/50 transition-colors">
                <TableCell className="text-center font-medium">
                  <div className="flex items-center justify-center gap-1">
                    {i + 1}
                    {r.tied && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 border-amber-400 text-amber-600">
                        并列
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-center text-gray-600">{r.firstRank}</TableCell>
                <TableCell className="text-center text-gray-600">{r.secondRank}</TableCell>
                <TableCell className="text-center">
                  <span
                    className={`inline-flex items-center gap-1 font-bold ${
                      r.progress > 0
                        ? 'text-green-600'
                        : r.progress < 0
                          ? 'text-red-500'
                          : 'text-gray-500'
                    }`}
                  >
                    {r.progress > 0 && <TrendingUp className="w-3.5 h-3.5" />}
                    {r.progress < 0 && <TrendingDown className="w-3.5 h-3.5" />}
                    {r.progress > 0 ? '+' : ''}
                    {r.progress}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* 并列说明 */}
        {results.some((r) => r.tied) && (
          <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
            💡 因第{topN}名存在并列，已自动扩展至{results.length}人
          </p>
        )}
      </div>
    )
  }

  // 渲染班级分析卡片
  const renderClassAnalysis = (
    analysis: ClassAnalysis | null,
    label: string
  ) => {
    if (!analysis) return null

    return (
      <Card className="border-amber-200/50 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-600" />
            {label}班级分析
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-amber-50/80 rounded-lg p-2.5">
              <p className="text-xs text-gray-500">总人数</p>
              <p className="text-lg font-bold text-amber-700">{analysis.totalStudents}</p>
            </div>
            {analysis.avgScore !== null && (
              <div className="bg-amber-50/80 rounded-lg p-2.5">
                <p className="text-xs text-gray-500">平均分</p>
                <p className="text-lg font-bold text-amber-700">
                  {Math.round(analysis.avgScore * 10) / 10}
                </p>
              </div>
            )}
          </div>

          {/* 分数分布 */}
          {analysis.avgScore !== null && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1.5">分数分布</p>
              <div className="grid grid-cols-4 gap-1.5">
                <div className="bg-green-50 rounded-md p-1.5 text-center">
                  <p className="text-[10px] text-green-600">优秀(≥90)</p>
                  <p className="text-sm font-bold text-green-700">
                    {analysis.scoreDistribution.excellent}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-md p-1.5 text-center">
                  <p className="text-[10px] text-blue-600">良好(80-89)</p>
                  <p className="text-sm font-bold text-blue-700">
                    {analysis.scoreDistribution.good}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-md p-1.5 text-center">
                  <p className="text-[10px] text-yellow-600">及格(60-79)</p>
                  <p className="text-sm font-bold text-yellow-700">
                    {analysis.scoreDistribution.pass}
                  </p>
                </div>
                <div className="bg-red-50 rounded-md p-1.5 text-center">
                  <p className="text-[10px] text-red-600">不及格(&lt;60)</p>
                  <p className="text-sm font-bold text-red-600">
                    {analysis.scoreDistribution.fail}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 排名分布 */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1.5">年级排名分布</p>
            <div className="grid grid-cols-4 gap-1.5">
              <div className="bg-purple-50 rounded-md p-1.5 text-center">
                <p className="text-[10px] text-purple-600">前10%</p>
                <p className="text-sm font-bold text-purple-700">{analysis.rankDistribution.top10}</p>
              </div>
              <div className="bg-indigo-50 rounded-md p-1.5 text-center">
                <p className="text-[10px] text-indigo-600">前20%</p>
                <p className="text-sm font-bold text-indigo-700">{analysis.rankDistribution.top20}</p>
              </div>
              <div className="bg-teal-50 rounded-md p-1.5 text-center">
                <p className="text-[10px] text-teal-600">前50%</p>
                <p className="text-sm font-bold text-teal-700">{analysis.rankDistribution.top50}</p>
              </div>
              <div className="bg-rose-50 rounded-md p-1.5 text-center">
                <p className="text-[10px] text-rose-600">后20%</p>
                <p className="text-sm font-bold text-rose-700">{analysis.rankDistribution.bottom20}</p>
              </div>
            </div>
          </div>

          {/* 进步概览 */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1.5">进步概览</p>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="bg-green-50 rounded-md p-1.5 text-center">
                <p className="text-[10px] text-green-600">进步</p>
                <p className="text-sm font-bold text-green-700">{analysis.progressOverview.improved}</p>
              </div>
              <div className="bg-red-50 rounded-md p-1.5 text-center">
                <p className="text-[10px] text-red-600">退步</p>
                <p className="text-sm font-bold text-red-700">{analysis.progressOverview.declined}</p>
              </div>
              <div className="bg-gray-50 rounded-md p-1.5 text-center">
                <p className="text-[10px] text-gray-600">平均进步</p>
                <p className="text-sm font-bold text-gray-700">{analysis.progressOverview.avgProgress}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* 文件上传区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 第一次考试 */}
        <Card
          className={`border-2 transition-colors ${
            file1Uploaded
              ? 'border-green-300 shadow-lg shadow-green-100/50'
              : 'border-amber-200/50 shadow-lg shadow-amber-100/50'
          }`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              第一次考试
              {file1Uploaded && (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              onClick={() => file1Ref.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                file1Uploaded
                  ? 'border-green-300 bg-green-50/50 hover:bg-green-50'
                  : 'border-amber-300 bg-amber-50/30 hover:bg-amber-50/50'
              }`}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-amber-400" />
              <p className="text-sm font-medium text-gray-700">
                {file1 ? file1.name : '点击上传Excel文件'}
              </p>
              <p className="text-xs text-gray-500 mt-1">支持 .xlsx / .xls 格式</p>
            </div>
            <input
              ref={file1Ref}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={onFile1Change}
            />
            {exam1Data && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">
                    Sheet: {exam1Data.selectedSheetName}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-green-300 text-green-700">
                    {exam1Data.students.length} 名学生
                  </Badge>
                </div>
                <p className="text-[10px] text-gray-400">
                  所有Sheet: {exam1Data.allSheetNames.join('、')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 第二次考试 */}
        <Card
          className={`border-2 transition-colors ${
            file2Uploaded
              ? 'border-green-300 shadow-lg shadow-green-100/50'
              : 'border-amber-200/50 shadow-lg shadow-amber-100/50'
          }`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              第二次考试
              {file2Uploaded && (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              onClick={() => file2Ref.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                file2Uploaded
                  ? 'border-green-300 bg-green-50/50 hover:bg-green-50'
                  : 'border-amber-300 bg-amber-50/30 hover:bg-amber-50/50'
              }`}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-amber-400" />
              <p className="text-sm font-medium text-gray-700">
                {file2 ? file2.name : '点击上传Excel文件'}
              </p>
              <p className="text-xs text-gray-500 mt-1">支持 .xlsx / .xls 格式</p>
            </div>
            <input
              ref={file2Ref}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={onFile2Change}
            />
            {exam2Data && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">
                    Sheet: {exam2Data.selectedSheetName}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-green-300 text-green-700">
                    {exam2Data.students.length} 名学生
                  </Badge>
                </div>
                <p className="text-[10px] text-gray-400">
                  所有Sheet: {exam2Data.allSheetNames.join('、')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 配置区域 */}
      <Card className="border-amber-200/50 shadow-lg shadow-amber-100/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-600" />
            分析配置
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1.5">
              <Label className="text-sm font-medium">班级名称（可选）</Label>
              <Input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder='如："1"、"1班"，留空则使用第一个Sheet'
                className="border-amber-200 focus:border-amber-400 focus:ring-amber-200"
              />
              <p className="text-[10px] text-gray-400">
                输入班级名将自动匹配对应Sheet，支持模糊匹配
              </p>
            </div>
            <div className="w-32 space-y-1.5">
              <Label className="text-sm font-medium">Top N</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={topN}
                onChange={(e) => setTopN(Math.max(1, parseInt(e.target.value) || 10))}
                className="border-amber-200 focus:border-amber-400 focus:ring-amber-200"
              />
            </div>
            <Button
              onClick={runAnalysis}
              disabled={analyzing || !exam1Data || !exam2Data}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-200 h-10 px-6"
            >
              {analyzing ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  分析中...
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4 mr-2" />
                  开始分析
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 分析结果 */}
      {analyzed && stats && (
        <div className="space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-amber-200/50 shadow-md">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-gray-500">考试1人数</p>
                <p className="text-xl font-bold text-amber-700">{exam1Data!.students.length}</p>
                <p className="text-[10px] text-gray-400">Sheet: {exam1Data!.selectedSheetName}</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200/50 shadow-md">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-gray-500">考试2人数</p>
                <p className="text-xl font-bold text-amber-700">{exam2Data!.students.length}</p>
                <p className="text-[10px] text-gray-400">Sheet: {exam2Data!.selectedSheetName}</p>
              </CardContent>
            </Card>
            <Card className="border-green-200/50 shadow-md">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-gray-500">共同参与</p>
                <p className="text-xl font-bold text-green-600">{stats.common.length}</p>
                <p className="text-[10px] text-gray-400">两次均参加</p>
              </CardContent>
            </Card>
            <Card className="border-orange-200/50 shadow-md">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-gray-500">仅参加一次</p>
                <p className="text-xl font-bold text-orange-600">
                  {stats.only1.length + stats.only2.length}
                </p>
                <p className="text-[10px] text-gray-400">
                  仅1: {stats.only1.length} / 仅2: {stats.only2.length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 排名进步结果 */}
          <Card className="border-amber-200/50 shadow-lg shadow-amber-100/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                排名进步分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={resultTab} onValueChange={setResultTab}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="grade">年级排名进步</TabsTrigger>
                    <TabsTrigger value="class">班级排名进步</TabsTrigger>
                  </TabsList>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-300 text-amber-700 hover:bg-amber-50 text-xs"
                      onClick={() =>
                        copyDetails(
                          resultTab === 'grade' ? gradeProgress : classProgress,
                          resultTab === 'grade' ? '年级排名' : '班级排名'
                        )
                      }
                    >
                      <ClipboardList className="w-3 h-3 mr-1" />
                      复制详情
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-300 text-amber-700 hover:bg-amber-50 text-xs"
                      onClick={() =>
                        copyNames(
                          resultTab === 'grade' ? gradeProgress : classProgress
                        )
                      }
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      仅复制姓名
                    </Button>
                  </div>
                </div>

                <TabsContent value="grade">
                  {renderProgressTable(gradeProgress, '年级排名')}
                </TabsContent>
                <TabsContent value="class">
                  {renderProgressTable(classProgress, '班级排名')}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* 班级维度分析 */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-600" />
              班级维度分析
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderClassAnalysis(classAnalysis1, '第一次考试')}
              {renderClassAnalysis(classAnalysis2, '第二次考试')}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
