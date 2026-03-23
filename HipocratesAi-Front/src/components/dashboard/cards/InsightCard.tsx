interface InsightCardProps {
  title?: string;
  icon?: string;
  description: string;
  reference?: string;
  onViewMore?: () => void;
}

export default function InsightCard({
  title = 'Weekly Insights',
  icon = 'lightbulb',
  description,
  reference = 'Bio-Feedback AI',
  onViewMore,
}: InsightCardProps) {
  return (
    <div className="bg-primary p-6 rounded-xl shadow-lg text-white">
      <div className="flex items-center gap-3 mb-4">
        <span className="material-icon p-2 bg-white/20 rounded-lg">{icon}</span>
        <h3 className="text-heading-3">{title}</h3>
      </div>
      <p className="text-blue-100 text-body-sm leading-relaxed">{description}</p>
      <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center">
        <span className="text-caption text-blue-200">Ref: {reference}</span>
        {onViewMore && (
          <button
            className="bg-white text-primary px-4 py-1.5 rounded-lg text-caption-bold"
            onClick={onViewMore}
          >
            Ver mais
          </button>
        )}
      </div>
    </div>
  );
}
