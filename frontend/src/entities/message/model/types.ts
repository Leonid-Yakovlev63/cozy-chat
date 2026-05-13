export type ChatMessage = {
  id: string
  fromUser: string
  toUser: string
  content: string
  createdAt: string
  isRead: boolean
  isEdited: boolean
}
