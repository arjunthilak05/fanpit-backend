export class AuthResponseDto {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    isEmailVerified: boolean;
    avatar?: string;
    phone?: string;
    organization?: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class TokenResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}