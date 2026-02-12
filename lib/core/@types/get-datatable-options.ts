export interface GetDatatableOptions {
  withPagination?: {
    nextButtonSelector: string
  }
  infiniteScroll?: {
    scrollContainerSelector: string
  }
  limit?: number
}
