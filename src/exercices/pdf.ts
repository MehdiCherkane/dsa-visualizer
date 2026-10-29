/** Sibling-asset path of an exercise handout inside `public/exercices/`. */
export function exercisePdfHref(exerciseId: string): string {
  return `./exercices/${exerciseId}.pdf`
}
