// Password limits: bcrypt only reads the first 72 bytes of its input, so the
// maximum must stay well under that.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 24;

export const NAME_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 254;

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export const PROJECT_NAME_MAX_LENGTH = 120;
export const PROJECT_DESCRIPTION_MAX_LENGTH = 500;

export const SCHEMA_NAME_MAX_LENGTH = 120;
export const SCHEMA_DESCRIPTION_MAX_LENGTH = 500;

export const SCHEMA_FIELD_NAME_MAX_LENGTH = 64;
export const SCHEMA_MAX_FIELDS = 100;

export const IMPORT_ERROR_PAGE_SIZE = 20;
