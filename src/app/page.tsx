'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Award,
  Download,
  Printer,
  Plus,
  X,
  Eye,
  FileText,
  Settings,
  Sparkles,
  RotateCcw,
} from 'lucide-react'

// 解析姓名
function parseNames(input: string): string[] {
  if (!input || !input.trim()) return []
  return input
    .split(/[\n,，、\s]+/)
    .map((n) => n.trim())
    .filter((n) => n.length > 0)
    .filter((n, i, arr) => arr.indexOf(n) === i)
}

// 获取当前日期
function getDefaultDate(): string {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
}

export default function CertificateGenerator() {
  const [prefix, setPrefix] = useState('奖给')
  const [namesInput, setNamesInput] = useState('')
  const [award, setAward] = useState('学习优胜奖')
  const [organization, setOrganization] = useState('定州市南城回民中学')
  const [date, setDate] = useState(getDefaultDate)
  const [previewName, setPreviewName] = useState('张梦凡')
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [fontLoaded, setFontLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form')
  const renderAreaRef = useRef<HTMLDivElement>(null)

  const names = parseNames(namesInput)

  // 加载华文行楷字体
  useEffect(() => {
    const loadFont = async () => {
      try {
        // 先检查是否已经有这个字体
        const loadedFonts = document.fonts
        let hasFont = false
        for (const font of loadedFonts) {
          if (font.family === '华文行楷') {
            hasFont = true
            break
          }
        }
        if (hasFont) {
          setFontLoaded(true)
          return
        }

        // 通过FontFace API加载
        const font = new FontFace('华文行楷', 'url(/fonts/STXINGKA.TTF)')
        const loaded = await font.load()
        document.fonts.add(loaded)
        setFontLoaded(true)
      } catch (e) {
        console.warn('华文行楷字体加载失败，将使用楷体替代:', e)
        setFontLoaded(true) // 仍然允许使用，只是用fallback字体
      }
    }
    loadFont()
  }, [])

  // 更新预览姓名
  useEffect(() => {
    if (names.length > 0) {
      setPreviewName(names[0])
    }
  }, [names])

  // 奖状预览组件 - 精确匹配Word模板
  const CertificatePreview = useCallback(
    ({ name, scale = 1 }: { name: string; scale?: number }) => {
      // Word模板参数:
      // 页面: A4横向 297mm x 210mm
      // 边距: 上下3.175cm(1800twips), 左右2.54cm(1440twips)
      // 字体: 华文行楷
      // 空行x2: 行距1000twips(exact 50pt), 字号72半点=36pt
      // "奖给:" 36pt + 空格 + 姓名42pt, 首行缩进1440twips=2.54cm
      // 奖项: 居中, 220半点=110pt, 宽度缩放80%, spaceBefore 156twips
      // 空行x2: 华文楷体 18pt, 行距360twips exact
      // 单位: 华文楷体 18pt, 居中, 行距420twips
      // 日期: 华文楷体 18pt, 居中, 行距420twips

      return (
        <div
          style={{
            width: '297mm',
            height: '210mm',
            padding: '3.175cm 2.54cm',
            background: 'white',
            fontFamily: '"华文行楷", "STXingka", "楷体", "KaiTi", "STKaiti", serif',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            overflow: 'hidden',
            lineHeight: 'normal',
          }}
        >
          {/* 空行1 */}
          <div style={{ height: '50pt', lineHeight: '50pt', fontSize: '36pt' }}>
            &nbsp;
          </div>
          {/* 空行2 */}
          <div style={{ height: '50pt', lineHeight: '50pt', fontSize: '36pt' }}>
            &nbsp;
          </div>
          {/* 奖给: 姓名 */}
          <div
            style={{
              fontSize: '36pt',
              lineHeight: '50pt',
              textIndent: '2.54cm',
            }}
          >
            <span style={{ fontSize: '36pt' }}>{prefix}:</span>
            <span style={{ fontSize: '36pt' }}>&nbsp;</span>
            <span style={{ fontSize: '42pt' }}>{name}</span>
          </div>
          {/* 奖项名称 */}
          <div
            style={{
              textAlign: 'center',
              fontSize: '110pt',
              lineHeight: '1.15',
              marginTop: '8pt',
              transform: 'scaleX(0.8)',
              transformOrigin: 'center center',
            }}
          >
            {award}
          </div>
          {/* 空行 */}
          <div
            style={{
              height: '18pt',
              lineHeight: '18pt',
              fontSize: '18pt',
              fontFamily: '"华文楷体", "楷体", "KaiTi", "STKaiti", serif',
            }}
          >
            &nbsp;
          </div>
          {/* 空行 */}
          <div
            style={{
              height: '18pt',
              lineHeight: '18pt',
              fontSize: '18pt',
              fontFamily: '"华文楷体", "楷体", "KaiTi", "STKaiti", serif',
            }}
          >
            &nbsp;
          </div>
          {/* 单位 */}
          <div
            style={{
              textAlign: 'center',
              fontSize: '18pt',
              lineHeight: '21pt',
              fontFamily: '"华文楷体", "楷体", "KaiTi", "STKaiti", serif',
              letterSpacing: '1pt',
            }}
          >
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{organization}
          </div>
          {/* 日期 */}
          <div
            style={{
              textAlign: 'center',
              fontSize: '18pt',
              lineHeight: '21pt',
              fontFamily: '"华文楷体", "楷体", "KaiTi", "STKaiti", serif',
              letterSpacing: '1pt',
            }}
          >
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{date}
          </div>
        </div>
      )
    },
    [prefix, award, organization, date]
  )

  // 生成PDF（使用浏览器打印方式 - 最高质量）
  const generatePDF = async () => {
    if (names.length === 0) {
      alert('请输入姓名')
      return
    }
    if (!award.trim()) {
      alert('请输入奖项')
      return
    }

    setGenerating(true)
    setProgress(0)
    setProgressText('准备生成...')

    try {
      const { jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas-pro')).default

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      })

      const renderArea = renderAreaRef.current
      if (!renderArea) return

      for (let i = 0; i < names.length; i++) {
        const name = names[i]
        const percent = Math.round(((i + 1) / names.length) * 100)
        setProgress(percent)
        setProgressText(`正在生成: ${i + 1} / ${names.length} - ${name}`)

        // 创建奖状DOM
        const container = document.createElement('div')
        container.style.cssText = `
          width: 297mm;
          height: 210mm;
          padding: 3.175cm 2.54cm;
          background: white;
          font-family: "华文行楷", "STXingka", "楷体", "KaiTi", "STKaiti", serif;
          position: absolute;
          left: -9999px;
          top: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          line-height: normal;
        `

        // 构建内容 - 匹配Word模板
        container.innerHTML = `
          <div style="height:50pt;line-height:50pt;font-size:36pt;">&nbsp;</div>
          <div style="height:50pt;line-height:50pt;font-size:36pt;">&nbsp;</div>
          <div style="font-size:36pt;line-height:50pt;text-indent:2.54cm;">
            <span style="font-size:36pt;">${prefix}:</span>
            <span style="font-size:36pt;">&nbsp;</span>
            <span style="font-size:42pt;">${name}</span>
          </div>
          <div style="text-align:center;font-size:110pt;line-height:1.15;margin-top:8pt;transform:scaleX(0.8);transform-origin:center center;">
            ${award}
          </div>
          <div style="height:18pt;line-height:18pt;font-size:18pt;font-family:'华文楷体','楷体','KaiTi','STKaiti',serif;">&nbsp;</div>
          <div style="height:18pt;line-height:18pt;font-size:18pt;font-family:'华文楷体','楷体','KaiTi','STKaiti',serif;">&nbsp;</div>
          <div style="text-align:center;font-size:18pt;line-height:21pt;font-family:'华文楷体','楷体','KaiTi','STKaiti',serif;letter-spacing:1pt;">
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${organization}
          </div>
          <div style="text-align:center;font-size:18pt;line-height:21pt;font-family:'华文楷体','楷体','KaiTi','STKaiti',serif;letter-spacing:1pt;">
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${date}
          </div>
        `

        renderArea.appendChild(container)

        // 等待字体渲染
        await document.fonts.ready
        await new Promise((resolve) => setTimeout(resolve, 500))

        const canvas = await html2canvas(container, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: container.offsetWidth,
          height: container.offsetHeight,
        })

        if (i > 0) {
          pdf.addPage()
        }

        const imgData = canvas.toDataURL('image/png', 1.0)
        pdf.addImage(imgData, 'PNG', 0, 0, 297, 210)

        renderArea.removeChild(container)
      }

      pdf.save(`${award}.pdf`)
      setProgressText('生成完成!')
    } catch (error) {
      console.error('PDF生成失败:', error)
      alert('PDF生成失败，请重试')
    } finally {
      setTimeout(() => {
        setGenerating(false)
        setProgress(0)
        setProgressText('')
      }, 1500)
    }
  }

  // 打印奖状（使用浏览器打印 - 最高质量矢量输出）
  const printCertificates = () => {
    if (names.length === 0) {
      alert('请输入姓名')
      return
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('请允许弹出窗口以打印奖状')
      return
    }

    const certificatesHTML = names
      .map(
        (name) => `
      <div class="certificate-page">
        <div class="spacer-line">&nbsp;</div>
        <div class="spacer-line">&nbsp;</div>
        <div class="name-line">
          <span class="prefix">${prefix}:</span>
          <span class="space-char">&nbsp;</span>
          <span class="person-name">${name}</span>
        </div>
        <div class="award-name">${award}</div>
        <div class="empty-line">&nbsp;</div>
        <div class="empty-line">&nbsp;</div>
        <div class="org-line">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${organization}</div>
        <div class="date-line">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${date}</div>
      </div>
    `
      )
      .join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <title>奖状打印</title>
        <style>
          @font-face {
            font-family: '华文行楷';
            src: url('${window.location.origin}/fonts/STXINGKA.TTF') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body { background: white; }
          .certificate-page {
            width: 297mm;
            height: 210mm;
            padding: 3.175cm 2.54cm;
            background: white;
            font-family: "华文行楷", "STXingka", "楷体", "KaiTi", serif;
            display: flex;
            flex-direction: column;
            page-break-after: always;
            overflow: hidden;
            line-height: normal;
          }
          .certificate-page:last-child {
            page-break-after: auto;
          }
          .spacer-line {
            height: 50pt;
            line-height: 50pt;
            font-size: 36pt;
          }
          .name-line {
            font-size: 36pt;
            line-height: 50pt;
            text-indent: 2.54cm;
          }
          .prefix { font-size: 36pt; }
          .space-char { font-size: 36pt; }
          .person-name { font-size: 42pt; }
          .award-name {
            text-align: center;
            font-size: 110pt;
            line-height: 1.15;
            margin-top: 8pt;
            transform: scaleX(0.8);
            transform-origin: center center;
          }
          .empty-line {
            height: 18pt;
            line-height: 18pt;
            font-size: 18pt;
            font-family: "华文楷体", "楷体", "KaiTi", "STKaiti", serif;
          }
          .org-line {
            text-align: center;
            font-size: 18pt;
            line-height: 21pt;
            font-family: "华文楷体", "楷体", "KaiTi", "STKaiti", serif;
            letter-spacing: 1pt;
          }
          .date-line {
            text-align: center;
            font-size: 18pt;
            line-height: 21pt;
            font-family: "华文楷体", "楷体", "KaiTi", "STKaiti", serif;
            letter-spacing: 1pt;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${certificatesHTML}
        <script>
          // 等待字体加载完成后再打印
          document.fonts.ready.then(function() {
            setTimeout(function() { window.print(); }, 800);
          });
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  // 删除姓名
  const removeName = (index: number) => {
    const newNames = [...names]
    newNames.splice(index, 1)
    setNamesInput(newNames.join('\n'))
  }

  // 重置表单
  const resetForm = () => {
    setPrefix('奖给')
    setNamesInput('')
    setAward('学习优胜奖')
    setOrganization('定州市南城回民中学')
    setDate(getDefaultDate())
    setPreviewName('张梦凡')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* 顶部标题栏 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-amber-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-200">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                奖状生成器
              </h1>
              <p className="text-xs text-gray-500">
                批量生成奖状 · 一键打印 · 匹配Word模板
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-xs ${
                fontLoaded
                  ? 'border-green-300 text-green-700 bg-green-50'
                  : 'border-amber-300 text-amber-700 bg-amber-50'
              }`}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {fontLoaded ? '华文行楷已加载' : '字体加载中...'}
            </Badge>
          </div>
        </div>
      </header>

      {/* 移动端Tab切换 */}
      <div className="md:hidden flex border-b border-amber-200/50 bg-white/50">
        <button
          onClick={() => setActiveTab('form')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 ${
            activeTab === 'form'
              ? 'text-amber-700 border-b-2 border-amber-600 bg-amber-50/50'
              : 'text-gray-500'
          }`}
        >
          <Settings className="w-4 h-4" />
          填写信息
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 ${
            activeTab === 'preview'
              ? 'text-amber-700 border-b-2 border-amber-600 bg-amber-50/50'
              : 'text-gray-500'
          }`}
        >
          <Eye className="w-4 h-4" />
          预览奖状
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* 左侧 - 表单区域 */}
          <div
            className={`w-full md:w-[400px] lg:w-[420px] shrink-0 space-y-4 ${
              activeTab !== 'form' ? 'hidden md:block' : ''
            }`}
          >
            {/* 基本信息卡片 */}
            <Card className="border-amber-200/50 shadow-lg shadow-amber-100/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  奖状信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prefix" className="text-sm font-medium">
                    前缀
                  </Label>
                  <Input
                    id="prefix"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="如：奖给、授予"
                    className="border-amber-200 focus:border-amber-400 focus:ring-amber-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="award" className="text-sm font-medium">
                    奖项名称
                  </Label>
                  <Input
                    id="award"
                    value={award}
                    onChange={(e) => setAward(e.target.value)}
                    placeholder="如：学习优胜奖、三好学生"
                    className="border-amber-200 focus:border-amber-400 focus:ring-amber-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization" className="text-sm font-medium">
                    颁发单位
                  </Label>
                  <Input
                    id="organization"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="如：XX学校"
                    className="border-amber-200 focus:border-amber-400 focus:ring-amber-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium">
                    日期
                  </Label>
                  <Input
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="如：2025年6月1日"
                    className="border-amber-200 focus:border-amber-400 focus:ring-amber-200"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 姓名输入卡片 */}
            <Card className="border-amber-200/50 shadow-lg shadow-amber-100/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-amber-600" />
                    获奖姓名
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-800"
                  >
                    {names.length} 人
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={namesInput}
                  onChange={(e) => setNamesInput(e.target.value)}
                  placeholder={'每行一个姓名，或用逗号、顿号分隔\n如：\n张三\n李四\n王五'}
                  className="min-h-[120px] border-amber-200 focus:border-amber-400 focus:ring-amber-200 resize-y"
                />
                <p className="text-xs text-gray-500">
                  支持回车、逗号、顿号、空格分隔，自动去重
                </p>

                {/* 姓名标签列表 */}
                {names.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {names.map((name, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 px-2.5 py-1 rounded-md text-sm hover:bg-amber-200 transition-colors"
                      >
                        {name}
                        <button
                          onClick={() => removeName(index)}
                          className="text-amber-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            <div className="space-y-3">
              <Button
                onClick={generatePDF}
                disabled={generating || names.length === 0}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-200 h-12 text-base font-medium"
              >
                <Download className="w-5 h-5 mr-2" />
                {generating ? '生成中...' : `生成PDF (${names.length}张)`}
              </Button>
              <div className="flex gap-3">
                <Button
                  onClick={printCertificates}
                  disabled={names.length === 0}
                  variant="outline"
                  className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50 h-11"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  打印
                </Button>
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="border-gray-300 text-gray-600 hover:bg-gray-50 h-11 px-4"
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  重置
                </Button>
              </div>

              {/* 进度条 */}
              {generating && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-center text-gray-500">
                    {progressText}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 右侧 - 预览区域 */}
          <div
            className={`flex-1 min-w-0 ${
              activeTab !== 'preview' ? 'hidden md:block' : ''
            }`}
          >
            <Card className="border-amber-200/50 shadow-lg shadow-amber-100/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-600" />
                  奖状预览
                  {names.length > 1 && (
                    <span className="text-xs text-gray-500 font-normal">
                      （当前预览：{previewName}）
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto bg-gray-100/80 rounded-lg p-4 md:p-6">
                  <div
                    className="relative"
                    style={{
                      width: `calc(297mm * 0.42)`,
                      height: `calc(210mm * 0.42)`,
                      overflow: 'hidden',
                    }}
                  >
                    <CertificatePreview
                      name={names.length > 0 ? previewName : '张梦凡'}
                      scale={0.42}
                    />
                  </div>
                </div>

                {/* 多人切换 */}
                {names.length > 1 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      切换预览人员：
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {names.map((name, index) => (
                        <button
                          key={index}
                          onClick={() => setPreviewName(name)}
                          className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                            previewName === name
                              ? 'bg-amber-500 text-white shadow-md'
                              : 'bg-white border border-amber-200 text-gray-700 hover:bg-amber-50'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* 隐藏的渲染区域（用于PDF生成） */}
      <div
        ref={renderAreaRef}
        style={{ position: 'absolute', left: '-9999px', top: 0 }}
      />

      {/* 全局字体声明 */}
      <style jsx global>{`
        @font-face {
          font-family: '华文行楷';
          src: url('/fonts/STXINGKA.TTF') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `}</style>
    </div>
  )
}
