// Password limits: bcrypt only reads the first 72 bytes of its input, so the
// maximum must stay well under that.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 24;

export const NAME_MAX_LENGTH = 100;
// 254 is the maximum length of an email address per RFC 5321.
export const EMAIL_MAX_LENGTH = 254;

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
// Caps how much a single request can ask for, so nobody can pull the whole table.
export const MAX_PAGE_SIZE = 100;
