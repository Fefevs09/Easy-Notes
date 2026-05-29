import React, { useState } from 'react'
import { useNotesStore } from '../../store/notes-store'
import { FolderOpen, Sparkles, Shield, Cpu, BookOpen } from 'lucide-react'

export default function VaultOnboarding(): React.JSX.Element {
  const { initializeVault } = useNotesStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelectDirectory = async () => {
    if (typeof window === 'undefined' || !(window as any).electron) {
      setError('Operação não suportada neste ambiente (Necessário rodar no Electron).')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const selectedPath = await (window as any).electron.ipcRenderer.invoke(
        'select-vault-directory'
      )

      if (selectedPath) {
        localStorage.setItem('easynotes_vault_path', selectedPath)
        await initializeVault(selectedPath)
      }
    } catch (err: any) {
      console.error('Failed to select vault directory:', err)
      setError('Ocorreu um erro ao abrir a pasta. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex w-screen h-screen items-center justify-center bg-slate-50 dark:bg-zinc-950 transition-colors duration-500 overflow-hidden relative select-none">
      {/* Background ambient gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Card Panel */}
      <div className="w-[520px] max-w-full p-8 rounded-3xl border border-slate-200/50 dark:border-zinc-800/40 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center space-y-6 animate-fade-in transition-all">
        {/* Animated Brand Icon */}
        <div className="p-4.5 bg-red-500/10 text-red-500 rounded-2xl relative shadow-inner animate-pulse">
          <BookOpen size={42} className="stroke-[1.75]" />
          <div className="absolute -top-1.5 -right-1.5 p-1 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-full text-red-400">
            <Sparkles size={12} />
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            Bem-vindo ao Easy Notes 2.0
          </h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-sm mx-auto font-medium">
            Seu novo estúdio digital para esboçar ideias, desenhar com pressão e organizar
            pensamentos.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-2 gap-3.5 w-full text-left pt-2">
          <div className="p-3.5 border border-slate-200/40 dark:border-zinc-800/20 bg-white/40 dark:bg-zinc-900/20 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <Shield size={14} className="text-red-400" />
              <span className="text-xs font-semibold">100% Seu (Privacidade)</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-relaxed">
              Suas notas são salvas localmente como arquivos Markdown normais no seu computador.
            </p>
          </div>

          <div className="p-3.5 border border-slate-200/40 dark:border-zinc-800/20 bg-white/40 dark:bg-zinc-900/20 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <Cpu size={14} className="text-red-400" />
              <span className="text-xs font-semibold">Estilo Obsidian</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-relaxed">
              Pastas viram subpastas físicas e esboços são salvos dentro do próprio arquivo de nota.
            </p>
          </div>
        </div>

        {/* Call to Action Selection Button */}
        <div className="w-full pt-4 space-y-3">
          <button
            onClick={handleSelectDirectory}
            disabled={isLoading}
            className={`w-full py-3.5 px-6 bg-red-500 hover:bg-red-600 active:scale-98 text-white rounded-2xl flex items-center justify-center gap-2.5 font-semibold text-sm transition-all hover-scale shadow-lg shadow-red-500/20 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <FolderOpen size={16} />
            {isLoading ? 'Abrindo Seletor...' : 'Abrir Pasta de Notas (Vault)'}
          </button>

          <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
            Escolha uma pasta vazia ou um Vault existente do Obsidian para carregar.
          </p>
        </div>

        {/* Feedback Error Notice */}
        {error && (
          <div className="w-full p-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/30 text-xxs text-red-500 font-semibold leading-relaxed">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
