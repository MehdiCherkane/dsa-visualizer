import type { BaseSnapshot, StructurePlugin } from './core/types'
import { ldcPlugin } from './structures/ldc'
import { lddcPlugin } from './structures/lddc'
import { lscPlugin } from './structures/lsc'
import { pilesFilesPlugin } from './structures/piles-files'

export const plugins = [ldcPlugin, lddcPlugin, lscPlugin, pilesFilesPlugin] as const
export const defaultPlugin = ldcPlugin

/**
 * Resolves the plugin for a chapter route. Each plugin has its own snapshot
 * type, but the shell only relies on the shared `StructurePlugin` contract,
 * so this is the single place where the concrete plugin is widened.
 */
export function pluginForChapter(chapter: number): StructurePlugin<BaseSnapshot> | undefined {
  return plugins.find((candidate) => candidate.chapter === chapter) as unknown as
    | StructurePlugin<BaseSnapshot>
    | undefined
}
