// Mirrors backend/src/constants/validation.constants.ts. The backend is the
// real check; these only let the forms reject bad input before a round trip.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 24;

export const NAME_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 254;

export const PROJECT_NAME_MAX_LENGTH = 120;
export const PROJECT_DESCRIPTION_MAX_LENGTH = 500;
