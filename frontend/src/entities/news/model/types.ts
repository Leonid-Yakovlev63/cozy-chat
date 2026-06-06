export type NewsItem = {
  id: string
  title: string
  content: string
  authorUsername: string
  createdAt: string
  updatedAt: string
}

export type CreateNewsPayload = {
  title: string
  content: string
}
