export type TokenKind =
  | 'keyword'
  | 'type'
  | 'string'
  | 'number'
  | 'comment'
  | 'punct'
  | 'field-suivant'
  | 'field-precedent'
  | 'field-value'
  | 'builtin'
  | 'ident'
  | 'space'

export interface Token {
  text: string
  kind: TokenKind
}

const KEYWORDS = new Set([
  'typedef',
  'return',
  'if',
  'else',
  'while',
  'for',
  'do',
  'switch',
  'case',
  'break',
  'continue',
  'goto',
  'sizeof',
  'struct',
  'union',
  'enum',
  'const',
  'static',
  'extern',
  'register',
  'volatile',
  'inline',
  'restrict',
  'include',
  'define',
  'ifdef',
  'ifndef',
  'endif',
  'NULL',
])
const TYPES = new Set([
  'void',
  'int',
  'char',
  'short',
  'long',
  'float',
  'double',
  'signed',
  'unsigned',
  '_Bool',
  'size_t',
  'FILE',
  'tableau',
  'Noeud',
  'NoeudEtudiant',
  'Etudiant',
])
const BUILTINS = new Set([
  'malloc',
  'calloc',
  'realloc',
  'free',
  'printf',
  'fprintf',
  'sprintf',
  'scanf',
  'fgets',
  'getchar',
  'puts',
  'putchar',
  'strlen',
  'memcpy',
  'memset',
  'strcpy',
  'strcmp',
  'atoi',
  'exit',
  'fopen',
  'fclose',
  'stdin',
  'stdout',
  'stderr',
  'EOF',
])
const PREV_FIELDS = new Set(['precedent'])
const NEXT_FIELDS = new Set(['suivant'])
const VALUE_FIELDS = new Set(['valeur', 'donnees', 'numero', 'nom', 'prenom'])

function classifyIdentifier(word: string): TokenKind {
  if (KEYWORDS.has(word)) return 'keyword'
  if (TYPES.has(word)) return 'type'
  if (BUILTINS.has(word)) return 'builtin'
  if (PREV_FIELDS.has(word)) return 'field-precedent'
  if (NEXT_FIELDS.has(word)) return 'field-suivant'
  if (VALUE_FIELDS.has(word)) return 'field-value'
  return 'ident'
}

export function tokenizeC(line: string): Token[] {
  const tokens: Token[] = []
  let index = 0

  while (index < line.length) {
    const char = line[index] ?? ''
    const rest = line.slice(index)

    if (/\s/.test(char)) {
      const match = rest.match(/^\s+/)
      const text = match?.[0] ?? char
      tokens.push({ text, kind: 'space' })
      index += text.length
      continue
    }

    if (rest.startsWith('//')) {
      tokens.push({ text: rest, kind: 'comment' })
      break
    }

    if (rest.startsWith('/*')) {
      const end = line.indexOf('*/', index + 2)
      const text = end === -1 ? rest : line.slice(index, end + 2)
      tokens.push({ text, kind: 'comment' })
      index += text.length
      continue
    }

    if (char === '"' || char === "'") {
      const quote = char
      let cursor = index + 1
      while (cursor < line.length) {
        if (line[cursor] === '\\') {
          cursor += 2
          continue
        }
        if (line[cursor] === quote) {
          cursor += 1
          break
        }
        cursor += 1
      }
      tokens.push({ text: line.slice(index, cursor), kind: 'string' })
      index = cursor
      continue
    }

    if (/[0-9]/.test(char)) {
      const match = rest.match(/^[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?(?:[uUlLfF]+)?/)
      const text = match?.[0] ?? char
      tokens.push({ text, kind: 'number' })
      index += text.length
      continue
    }

    if (rest.startsWith('->')) {
      tokens.push({ text: '->', kind: 'punct' })
      index += 2
      continue
    }

    if (/[A-Za-z_]/.test(char)) {
      const match = rest.match(/^[A-Za-z_][A-Za-z0-9_]*/)
      const text = match?.[0] ?? char
      tokens.push({ text, kind: classifyIdentifier(text) })
      index += text.length
      continue
    }

    tokens.push({ text: char, kind: 'punct' })
    index += 1
  }

  return tokens
}
