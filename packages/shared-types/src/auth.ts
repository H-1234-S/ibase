/** Public user fields returned by authentication endpoints. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt: string;
}
