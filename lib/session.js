import { getIronSession } from 'iron-session';

const sessionOptions = {
  password: 'super-secret-key-change-in-production-please-use-a-random-string',
  cookieName: 'oraya-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export function getSession(req, res) {
  return getIronSession(req, res, sessionOptions);
}

export default sessionOptions;