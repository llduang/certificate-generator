'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Award, Sparkles, BarChart3 } from 'lucide-react'
import CertificateGenerator from '@/components/certificate-generator'
import GradeAnalysis from '@/components/grade-analysis'

export default function Home() {
  const [activeFeature, setActiveFeature] = useState<'certificate' | 'analysis'>('certificate')
  const [fontLoaded, setFontLoaded] = useState(false)

  // 加载华文行楷字体（全局，用于证书生成）
  useEffect(() => {
    const loadFont = async () => {
      try {
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

        const font = new FontFace('华文行楷', 'url(/fonts/STXINGKA.TTF)')
        const loaded = await font.load()
        document.fonts.add(loaded)
        setFontLoaded(true)
      } catch (e) {
        console.warn('华文行楷字体加载失败，将使用楷体替代:', e)
        setFontLoaded(true)
      }
    }
    loadFont()
  }, [])

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
                {activeFeature === 'certificate' ? '奖状生成器' : '成绩分析'}
              </h1>
              <p className="text-xs text-gray-500">
                {activeFeature === 'certificate'
                  ? '批量生成奖状 · 一键打印 · 匹配Word模板'
                  : '两次考试成绩对比 · 排名进步分析 · 班级维度统计'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeFeature === 'certificate' && (
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
            )}
            {/* 功能切换 */}
            <div className="flex bg-amber-100/60 rounded-lg p-0.5">
              <button
                onClick={() => setActiveFeature('certificate')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                  activeFeature === 'certificate'
                    ? 'bg-white text-amber-700 shadow-sm'
                    : 'text-gray-500 hover:text-amber-600'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">奖状生成</span>
              </button>
              <button
                onClick={() => setActiveFeature('analysis')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                  activeFeature === 'analysis'
                    ? 'bg-white text-amber-700 shadow-sm'
                    : 'text-gray-500 hover:text-amber-600'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">成绩分析</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 内容区域 */}
      {activeFeature === 'certificate' ? <CertificateGenerator /> : <GradeAnalysis />}

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
