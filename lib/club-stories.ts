export type ClubStory = {
  id: string
  content: string
  createdAt: string
  authorName: string
  authorInitials: string
  photoUrl: string | null
  isMine: boolean
  likesCount: number
}

export type ClubStoriesResponse = {
  stories: ClubStory[]
}
