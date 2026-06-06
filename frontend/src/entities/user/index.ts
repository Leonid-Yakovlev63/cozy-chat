export type { CurrentUser, UnverifiedUser, UserRole } from '@/entities/user/model/types'
export {
  deleteMyStatus,
  fetchMyProfile,
  blockUser,
  fetchUnverifiedUsers,
  updateMyStatus,
  verifyUser,
} from '@/entities/user/api/userApi'
