// Pulse animation
const pulseKeyframes = `
  @keyframes skeleton-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

// Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <style>{pulseKeyframes}</style>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="h-4 w-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full mb-3 animate-pulse"></div>
            <div className="h-8 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200">
          <div className="h-6 w-40 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-6 animate-pulse"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="h-6 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-4 animate-pulse"></div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Customers Skeleton
export function CustomersSkeleton() {
  return (
    <div className="space-y-6">
      <style>{pulseKeyframes}</style>
      <div className="h-10 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
      
      <div className="h-12 w-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl p-5 bg-white border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="h-5 w-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-2 animate-pulse"></div>
                <div className="h-4 w-32 bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-8 w-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
            </div>
            <div className="space-y-2 mb-4">
              {[...Array(2)].map((_, j) => (
                <div key={j} className="h-4 w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
            <div className="h-4 w-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Work Orders Skeleton
export function WorkOrdersSkeleton() {
  return (
    <div className="space-y-6">
      <style>{pulseKeyframes}</style>
      <div className="flex justify-between items-center">
        <div className="h-10 w-40 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
        <div className="h-10 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
      </div>

      <div className="space-y-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="h-5 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-3 animate-pulse"></div>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-4 w-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
                <div className="h-8 w-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Reports Skeleton
export function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <style>{pulseKeyframes}</style>
      <div className="flex gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg flex-1 animate-pulse"></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="h-6 w-40 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-6 animate-pulse"></div>
            <div className="space-y-3">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-8 w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="h-6 w-40 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-6 animate-pulse"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Settings Skeleton
export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <style>{pulseKeyframes}</style>
      <div className="max-w-4xl">
        <div className="h-8 w-40 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-8 animate-pulse"></div>

        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            <div className="h-6 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-4 animate-pulse"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, j) => (
                <div key={j}>
                  <div className="h-4 w-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2 animate-pulse"></div>
                  <div className="h-10 w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Modal Skeleton
export function ModalSkeleton() {
  return (
    <div className="space-y-5">
      <style>{pulseKeyframes}</style>
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <div className="h-4 w-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2 animate-pulse"></div>
          <div className="h-10 w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}

// Customer Detail Skeleton
export function CustomerDetailSkeleton() {
  return (
    <div className="space-y-5">
      <style>{pulseKeyframes}</style>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex gap-3 mb-4">
            <div className="h-6 w-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse flex-shrink-0"></div>
            <div className="h-5 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse flex-1"></div>
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-4 w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <style>{pulseKeyframes}</style>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-4 flex gap-4">
          {[...Array(4)].map((_, j) => (
            <div key={j} className="h-4 flex-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      ))}
    </div>
  );
}
