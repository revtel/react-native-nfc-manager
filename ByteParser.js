function byteToHexString(bytes) {
  if (!Array.isArray(bytes) || !bytes.length) return '';

  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += `0${bytes[i].toString(16)}`.slice(-2);
  }
  return result;
}

function byteToString(bytes) {
  if (!Array.isArray(bytes) || !bytes.length) return '';

  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += String.fromCharCode(bytes[i]);
  }
  return result;
}

export default {
    byteToHexString,
    byteToString,
}
