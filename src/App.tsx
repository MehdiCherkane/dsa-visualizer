import { defaultPlugin } from './registry'
import { DemoApp } from './ui/App'

export default function App() {
  return <DemoApp key={defaultPlugin.id} plugin={defaultPlugin} />
}
