import _ from 'lodash';

export function nameToInitials(string: string) {
  const parts = string.split(' ').slice(0, 2);

  if (string.includes(',')) {
    parts.reverse();
  }

  return parts.map(p => p.charAt(0).toUpperCase());
}

export function maxLenStr(str: string, len: number) {
  if (str.length > len) {
    return `${str.substr(0, len - 3)}...`;
  }
  return str;
}

export function safeFieldValue(data: string | number | boolean) {
  const temp = String(data);
  return `"${temp.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export function safeFieldValueURI(data: string | number | boolean) {
  return `${encodeURIComponent(safeFieldValue(data))}`;
}

export function sanitizeLuceneQuery(query: string) {
  return query
    .replace(/([\^"~*?:\\/()[\]{}\-!])/g, '\\$1')
    .replace('&&', '\\&&')
    .replace('||', '\\||');
}

// Supports : prop or any form of nested object.. prop.object.prop2, prop.object[0].prop2
export function safeStringPropertyCompare(propertyPath: string) {
  return function (a: unknown, b: unknown) {
    const aVal = _.get(a, propertyPath);
    const bVal = _.get(b, propertyPath);
    return aVal && bVal ? aVal.localeCompare(bVal) : aVal ? 1 : 0;
  };
}

export function sanitizeMultilineLucene(query: string) {
  return query.replace(/#.+/g, '').replace(/\n{2,}/, '\n');
}
