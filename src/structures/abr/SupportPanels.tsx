import type { JSX } from 'react'
import type { SupportingPanelsProps } from '../../core/types'
import { fr } from '../../i18n/fr'
import type { TreeSnapshot } from '../trees/memory'
import { inorderValues, isAbr } from './memory'
import './AbrSupport.css'

export default function AbrSupportPanels({
  snapshot,
}: SupportingPanelsProps<TreeSnapshot>): JSX.Element {
  const values = inorderValues(snapshot)
  const valid = isAbr(snapshot)
  return (
    <section className="panel abr-support" aria-labelledby="abr-support-title">
      <div className="panel-header abr-support-head">
        <h2 className="panel-title" id="abr-support-title">
          {fr.abr.support.title}
        </h2>
        <code className="abr-support-rule">{fr.abr.support.rule}</code>
      </div>
      <div className="abr-support-body">
        <p className="abr-support-line">
          <span>{fr.abr.support.inorder}</span>
          <code>{values.length > 0 ? values.join(' · ') : fr.abr.support.empty}</code>
        </p>
        <p className={`abr-support-verdict${valid ? ' is-ok' : ' is-bad'}`} role="status">
          <span aria-hidden="true">{valid ? '✓' : '✗'}</span>
          {valid ? fr.abr.support.valid : fr.abr.support.invalid}
        </p>
        <p className="abr-support-note">{fr.abr.support.directed}</p>
      </div>
    </section>
  )
}
