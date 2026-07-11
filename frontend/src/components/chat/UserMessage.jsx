
export default function UserMessage({ content }) {

    return (
        <div className="flex justify-end">
            <div className="max-w-[80%] sm:max-w-[70%] bg-cyan-500/12 border border-cyan-500/20 rounded-2xl rounded-tr-sm px-4 py-2.5">
                <p className="text-slate-100 text-sm leading-relaxed">
                    {content}
                </p>
            </div>
        </div>
    )

}