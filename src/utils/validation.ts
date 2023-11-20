/* Redux-form validation
 * Validation functions for Redux-form
 * These functions should output the following:
 *    - if valid => return undefined
 *    - else     => return validation message for that error
 */

import i18n from 'i18next';

export const required = (value: string) =>
  value && typeof value === 'string' && value.trim() ? undefined : i18n.t('validation.required');

export const validateLength =
  (min = 0, max = 255) =>
  (value: string) => {
    if (!value) {
      return undefined;
    }

    if (min > 0 && value.length < min) {
      return `${i18n.t('validation.tooShort')} (${value.length}/${min})`;
    }

    if (max >= 0 && max < value.length) {
      return `${i18n.t('validation.tooLong')} (${value.length}/${max})`;
    }
  };

export const requiredNotNull = (value: unknown) =>
  value !== null && value !== undefined ? undefined : i18n.t('validation.required');

export const validateEmail = (email: string) => {
  if (!email) {
    return;
  }

  if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email)) {
    return i18n.t('validation.email');
  }

  return undefined;
};

export const validateUrl = (url: string) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const testUrl = new URL(url);

    if (testUrl.protocol === 'mailto:') {
      return i18n.t('validation.url');
    }

    // We can add tests here if needed

    return undefined;
  } catch (err) {
    return i18n.t('validation.url');
  }
};
