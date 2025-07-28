import { sign, verify } from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';


const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET must be defined in environment variables');
}

export interface TokenPayload {
    UserID: string;
    Email: string;
    RoleID: string;
    emailVerified: string;
}

export const generateToken = (user: TokenPayload): string => {
    try {
        return sign(
            {
                UserID: user.UserID,
                Email: user.Email,
                RoleID: user.RoleID,
                emailVerified: user.emailVerified
            },
            JWT_SECRET,
            {
                expiresIn: '180d' // Token expires in 6 months
            }
        );
    } catch (error) {

        throw new Error("Failed to generate token");
    }
};

export const verifyToken = (token: string): TokenPayload | null => {
    try {
        const decoded = verify(token, JWT_SECRET) as JwtPayload;
        return {
            UserID: decoded.UserID,
            Email: decoded.Email,
            RoleID: decoded.RoleID,
            emailVerified: decoded.emailVerified
        };
    } catch (error) {

        throw new Error("Mision Failed: Token no created");
    }
};

