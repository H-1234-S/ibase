/** Claims shared by signed Access and Refresh Tokens. */
export interface AuthTokenClaims {
  sub: string;
  sid: string;
  jti: string;
  token_use: 'access' | 'refresh';
}

/** Raw token pair passed from the auth service to the Cookie controller. */
export interface IssuedAuthTokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenId: string;
  refreshTokenHash: string;
  refreshExpiresAt: Date;
}
