export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Loading Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-32 bg-muted rounded animate-pulse"></div>
            <div className="h-10 w-20 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Menu Section Loading */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 w-20 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {[...Array(3)].map((_, categoryIndex) => (
                <div key={categoryIndex}>
                  <div className="h-6 w-32 bg-muted rounded mb-4 animate-pulse"></div>
                  <div className="grid gap-4">
                    {[...Array(3)].map((_, itemIndex) => (
                      <div key={itemIndex} className="border rounded-lg p-4">
                        <div className="flex gap-4">
                          <div className="w-20 h-20 bg-muted rounded-lg animate-pulse"></div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="h-5 w-48 bg-muted rounded mb-2 animate-pulse"></div>
                                <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
                              </div>
                              <div className="text-right ml-4">
                                <div className="h-6 w-16 bg-muted rounded mb-1 animate-pulse"></div>
                                <div className="h-3 w-20 bg-muted rounded animate-pulse"></div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex gap-2">
                                <div className="h-6 w-12 bg-muted rounded animate-pulse"></div>
                                <div className="h-6 w-16 bg-muted rounded animate-pulse"></div>
                              </div>
                              <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Assistant Loading */}
          <div className="lg:col-span-1">
            <div className="border rounded-lg h-[600px] flex flex-col animate-pulse">
              <div className="p-6 border-b">
                <div className="h-6 w-40 bg-muted rounded mb-2"></div>
                <div className="h-4 w-full bg-muted rounded"></div>
              </div>
              <div className="flex-1 p-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
                  <div className="h-4 w-48 bg-muted rounded mx-auto mb-2"></div>
                  <div className="h-3 w-32 bg-muted rounded mx-auto"></div>
                </div>
              </div>
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <div className="flex-1 h-10 bg-muted rounded"></div>
                  <div className="h-10 w-10 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}