const STYLES = {
    High:   'bg-green-400/10 text-green-400 border border-green-400/20',
    Medium: 'bg-amber-400/10 text-amber-400 border border-amber-400/20',
    Low:    'bg-red-400/10   text-red-400   border border-red-400/20'
}

const ICONS = {
    High:   'bi-check-circle-fill',
    Medium: 'bi-dash-circle-fill',
    Low:    'bi-x-circle-fill'
}

export default function ConfidenceBadge({ confidence }) {

    if(!confidence) return null
    const style = STYLES[confidence] ?? STYLES.Low
    const icon = ICONS[confidence] ?? 'bi-circle'

    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${style}`}>
            <i className={`bi ${icon} text-[9px]`} aria-hidden="true" />
            {confidence} confidence
        </span>
    )

}