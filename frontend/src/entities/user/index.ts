export type { CurrentUser, UnverifiedUser, UserRole } from '@/entities/user/model/types'
export {
  deleteMyAccount,
  deleteMyAvatar,
  deleteMyStatus,
  fetchMyProfile,
  blockUser,
  fetchUnverifiedUsers,
  updateMyAvatar,
  updateMyStatus,
  verifyUser,
} from '@/entities/user/api/userApi'
