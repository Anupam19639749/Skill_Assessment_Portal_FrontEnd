export interface AuthResponse {
  userId: number;
  fullName: string;
  email: string;
  role: string; // The role name string, e.g., "Admin", "Candidate"
  token: string;
  expiresOn: Date; // Keep as Date, Angular HttpClient will convert ISO strings automatically
}

export interface Users { // Changed from User to Users
  userId: number;
  fullName: string;
  email: string;
  roleName: string; 
  createdAt: Date;
  updatedAt: Date;
  profilePicturePath?: string;
  gender?: string;
  highestQualification?: string;
  isEmployed?: boolean;
  currentRole?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserRegister {
  fullName: string;
  email: string;
  password: string;
  roleId: number; // The numeric ID of the role
}

// Interface for updating user role (if needed in a User Management component)
export interface UserRoleUpdate {
  newRoleId: number;
}

export interface UserProfileUpdate {
    fullName?: string;
    email?: string;
    profilePicturePath?: string;
    gender?: string;
    highestQualification?: string;
    isEmployed?: boolean;
    currentRole?: string;
}

// DTO for password changes
export interface UserPasswordUpdate {
    currentPassword: string;
    newPassword: string;
}