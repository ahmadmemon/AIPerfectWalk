export default function TabNav({ tabs, activeTab, onTabChange }) {
    return (
        <div className="flex gap-1 p-1 rounded-2xl bg-secondary/60 border border-border/50">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`
            flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl
            text-sm font-medium transition-all duration-200 focus-ring
            ${activeTab === tab.id
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }
          `}
                >
                    {tab.icon}
                    <span>{tab.label}</span>
                </button>
            ))}
        </div>
    )
}

